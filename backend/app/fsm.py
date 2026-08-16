"""Máquina de Estados Finita (FSM) do processo."""
from __future__ import annotations

from enum import Enum

from .models import Params
from .pid import PidController
from .ramp import RampController


class State(str, Enum):
    SAFE = "SAFE"
    T0 = "T0_DERIV"
    T1 = "T1_STAB"
    T2 = "T2_RAMPA"
    T3 = "T3_PURGA"
    MANUAL = "MANUAL"


class Event(str, Enum):
    START = "start"
    STOP = "stop"
    EMERGENCY = "emergency"
    MANUAL = "manual"
    AUTO = "auto"


# Matriz de atuadores (TDD): SV1, SV2, SV3, SV4, SV5, bomba
MATRIX: dict[State, tuple[int, int, int, int, int, int]] = {
    State.SAFE: (0, 0, 0, 0, 0, 0),
    State.T0: (1, 0, 0, 0, 1, 1),
    State.T1: (1, 0, 0, 0, 1, 0),
    State.T2: (1, 0, 0, 0, 0, 0),
    State.T3: (0, 1, 1, 1, 0, 0),
}

# Mapeamento dos tempos configuráveis (TDD): duração de cada fase
PHASE_TIME_KEY = {
    State.T0: "t1",  # derivação/criofocalização
    State.T1: "t2",  # estabilização térmica
    State.T2: "ramp",  # rampa (tempo de rampa)
    State.T3: "t3",  # purga total
}


class StateMachine:
    def __init__(self, params: Params):
        self.params = params
        self.state = State.SAFE
        self.ramp = RampController(params)
        self.f2_pid = PidController(
            params.pid_f2.kp, params.pid_f2.ti, params.pid_f2.td
        )
        self.phase_elapsed = 0.0
        self.ramp_elapsed = 0.0
        self.emergency = False
        self.manual_state = {
            "valves": {"sv1": 0, "sv2": 0, "sv3": 0, "sv4": 0, "sv5": 0},
            "pump": 0,
            "pwm": {"u": 0, "f2": 0},
        }
        self._actuators = self._build_actuators(State.SAFE)

    # ------------------------------------------------------------------ eventos
    def handle_event(self, event: Event) -> None:
        if event == Event.START:
            if self.state == State.SAFE:
                self._enter(State.T0)
        elif event == Event.STOP:
            self._enter(State.SAFE)
        elif event == Event.EMERGENCY:
            self.emergency = True
            self._enter(State.SAFE)
        elif event == Event.MANUAL:
            self._enter(State.MANUAL)
        elif event == Event.AUTO:
            self._enter(State.SAFE)

    def set_params(self, params: Params) -> None:
        self.params = params
        self.ramp.update_params(params)
        self.f2_pid = PidController(
            params.pid_f2.kp, params.pid_f2.ti, params.pid_f2.td
        )

    def set_manual(self, valves: dict, pump: int, pwm: dict) -> None:
        self.manual_state = {
            "valves": {
                "sv1": int(valves.get("sv1", 0)),
                "sv2": int(valves.get("sv2", 0)),
                "sv3": int(valves.get("sv3", 0)),
                "sv4": int(valves.get("sv4", 0)),
                "sv5": int(valves.get("sv5", 0)),
            },
            "pump": int(pump),
            "pwm": {"u": int(pwm.get("u", 0)), "f2": int(pwm.get("f2", 0))},
        }
        self._enter(State.MANUAL)

    # -------------------------------------------------------------------- tick
    def tick(self, dt: float, t1: float, t2: float) -> None:
        if self.state in (State.SAFE, State.MANUAL):
            return

        self.phase_elapsed += dt
        sp_f2 = self.params.setpoints.get("f2_c", 700.0)

        if self.state == State.T0:
            self._actuators["pwm"]["f2"] = self._f2(sp_f2, t2, dt)
            if self.phase_elapsed >= self.params.times_s["t1"]:
                self._enter(State.T1)
        elif self.state == State.T1:
            self._actuators["pwm"]["f2"] = self._f2(sp_f2, t2, dt)
            if self.phase_elapsed >= self.params.times_s["t2"]:
                self._enter(State.T2)
        elif self.state == State.T2:
            self.ramp_elapsed += dt
            self._actuators["pwm"]["u"] = round(
                self.ramp.compute(t1, dt, self.ramp_elapsed)
            )
            self._actuators["pwm"]["f2"] = self._f2(sp_f2, t2, dt)
            if self.phase_elapsed >= self.params.ramp.time_s:
                self._enter(State.T3)
        elif self.state == State.T3:
            self._actuators["pwm"]["u"] = 0
            self._actuators["pwm"]["f2"] = 0
            if self.phase_elapsed >= self.params.times_s["t3"]:
                self._enter(State.SAFE)

    def _f2(self, sp: float, t2: float, dt: float) -> int:
        return round(self.f2_pid.update(sp, t2, dt))

    # ------------------------------------------------------------------ helpers
    def _enter(self, state: State) -> None:
        self.state = state
        self.phase_elapsed = 0.0
        if state == State.T2:
            self.ramp_elapsed = 0.0
            self.ramp.pid.reset()
        self._actuators = self._build_actuators(state)

    def _build_actuators(self, state: State) -> dict:
        if state == State.MANUAL:
            m = self.manual_state
            return {
                "valves": dict(m["valves"]),
                "pump": m["pump"],
                "pwm": {"u": m["pwm"]["u"], "f2": m["pwm"]["f2"]},
            }
        sv1, sv2, sv3, sv4, sv5, pump = MATRIX.get(state, (0, 0, 0, 0, 0, 0))
        return {
            "valves": {"sv1": sv1, "sv2": sv2, "sv3": sv3, "sv4": sv4, "sv5": sv5},
            "pump": pump,
            "pwm": {"u": 0, "f2": 0},
        }

    def command_payload(self) -> dict:
        """Payload JSON de escrita enviado ao DAQ."""
        return self._actuators

    def actuator_state(self) -> dict:
        return self._actuators

    def current_setpoints(self) -> dict:
        if self.state == State.SAFE:
            return {"u": 0.0, "f2": 0.0}
        if self.state == State.T2:
            return {
                "u": round(self.ramp.target_setpoint_at(self.ramp_elapsed), 2),
                "f2": self.params.setpoints.get("f2_c", 700.0),
            }
        if self.state in (State.T0, State.T1):
            return {
                "u": self.params.ramp.nitrogen_temp_c,
                "f2": self.params.setpoints.get("f2_c", 700.0),
            }
        # T3 (purga) ou MANUAL
        if self.state == State.MANUAL:
            return {"u": self.manual_state["pwm"]["u"], "f2": self.manual_state["pwm"]["f2"]}
        return {"u": 0.0, "f2": 0.0}
