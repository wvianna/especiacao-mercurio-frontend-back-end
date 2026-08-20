"""Testes da FSM e da matriz de atuadores."""
from app.fsm import MATRIX, Event, State, StateMachine
from app.models import Params, PIDGains, RampConfig


def make_params() -> Params:
    return Params(
        pid_u=PIDGains(kp=5.0, ti=1.8, td=0.0),
        pid_f2=PIDGains(kp=44.67, ti=0.18, td=0.0),
        times_s={"t1": 1.0, "t2": 1.0, "t3": 1.0},
        ramp=RampConfig(time_s=1.0, nitrogen_temp_c=-50.0, target_temp_c=230.0),
        setpoints={"f2_c": 700.0},
    )


def test_safe_state_default():
    fsm = StateMachine(make_params())
    assert fsm.state == State.SAFE
    payload = fsm.command_payload()
    assert payload["valves"] == {"sv1": 0, "sv2": 0, "sv3": 0, "sv4": 0, "sv5": 0}
    assert payload["pump"] == 0
    assert payload["pwm"] == {"u": 0, "f2": 0}


def test_start_enters_t0():
    fsm = StateMachine(make_params())
    fsm.handle_event(Event.START)
    assert fsm.state == State.T0
    payload = fsm.command_payload()
    assert payload["valves"]["sv1"] == 1
    assert payload["valves"]["sv5"] == 1
    assert payload["pump"] == 1


def test_full_cycle_passes_all_phases():
    fsm = StateMachine(make_params())
    fsm.handle_event(Event.START)
    seen = set()
    guard = 0
    while fsm.state != State.SAFE and guard < 200:
        fsm.tick(0.5, t1=-45.0, t2=699.0)
        seen.add(fsm.state)
        guard += 1
    assert State.T0 in seen
    assert State.T1 in seen
    assert State.T2 in seen
    assert State.T3 in seen
    assert fsm.state == State.SAFE


def test_matrix_per_phase():
    for state, (sv1, sv2, sv3, sv4, sv5, pump) in MATRIX.items():
        if state == State.MANUAL:
            continue
        fsm = StateMachine(make_params())
        fsm._enter(state)
        payload = fsm.command_payload()
        v = payload["valves"]
        assert (v["sv1"], v["sv2"], v["sv3"], v["sv4"], v["sv5"], payload["pump"]) == (
            sv1,
            sv2,
            sv3,
            sv4,
            sv5,
            pump,
        )


def test_stop_returns_safe():
    fsm = StateMachine(make_params())
    fsm.handle_event(Event.START)
    fsm.handle_event(Event.STOP)
    assert fsm.state == State.SAFE


def test_emergency_returns_safe_from_any_state():
    fsm = StateMachine(make_params())
    fsm.handle_event(Event.START)
    fsm.handle_event(Event.EMERGENCY)
    assert fsm.state == State.SAFE
    assert fsm.emergency


def test_manual_override():
    fsm = StateMachine(make_params())
    fsm.set_manual(
        {"sv1": 1, "sv2": 0, "sv3": 0, "sv4": 0, "sv5": 1},
        1,
        {"u": 128, "f2": 255},
    )
    assert fsm.state == State.MANUAL
    payload = fsm.command_payload()
    assert payload["valves"]["sv1"] == 1
    assert payload["pump"] == 1
    assert payload["pwm"] == {"u": 128, "f2": 255}


def test_t2_drives_ramp_pwm():
    fsm = StateMachine(make_params())
    fsm.handle_event(Event.START)
    # avança até T2
    while fsm.state != State.T2 and fsm.state != State.SAFE:
        fsm.tick(0.5, t1=-45.0, t2=699.0)
    assert fsm.state == State.T2
    # em T2, abaixo de 0°C, pwm_u > 0 (razão de taxas)
    fsm.tick(0.25, t1=-45.0, t2=699.0)
    assert fsm.command_payload()["pwm"]["u"] > 0


def test_stage_progress_reports_elapsed_and_total():
    fsm = StateMachine(make_params())  # durações de 1 s em todas as etapas
    assert fsm.stage_progress()["index"] == -1
    assert fsm.cycle_progress()["total"] == 0.0
    fsm.handle_event(Event.START)
    assert fsm.state == State.T0
    p = fsm.stage_progress()
    assert p["index"] == 0
    assert p["total"] == 1.0
    assert p["elapsed"] == 0.0
    fsm.tick(0.25, t1=-45.0, t2=699.0)
    p = fsm.stage_progress()
    assert p["elapsed"] == 0.25
    assert 0.24 < p["progress"] < 0.26
    c = fsm.cycle_progress()
    assert c["elapsed"] == 0.25
    assert c["total"] == 4.0  # t1+t2+rampa+t3 = 4 s


def test_cycle_progress_advances_across_stages():
    fsm = StateMachine(make_params())
    fsm.handle_event(Event.START)
    # percorre o ciclo inteiro (4 etapas de 1 s)
    while fsm.state != State.SAFE:
        fsm.tick(0.5, t1=-45.0, t2=699.0)
    # em SAFE o progresso de ciclo é zerado
    assert fsm.cycle_progress()["elapsed"] == 0.0
    assert fsm.stage_durations() == [
        {"id": "T0_DERIV", "duration": 1.0},
        {"id": "T1_STAB", "duration": 1.0},
        {"id": "T2_RAMPA", "duration": 1.0},
        {"id": "T3_PURGA", "duration": 1.0},
    ]
