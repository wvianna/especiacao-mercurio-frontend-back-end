"""Testes da rampa do Tubo U."""
from app.models import Params, PIDGains, RampConfig
from app.ramp import RampController


def make_params() -> Params:
    return Params(
        pid_u=PIDGains(kp=5.0, ti=1.8, td=0.0),
        pid_f2=PIDGains(kp=44.67, ti=0.18, td=0.0),
        times_s={"t1": 60.0, "t2": 360.0, "t3": 60.0},
        ramp=RampConfig(time_s=300.0, nitrogen_temp_c=-50.0, target_temp_c=230.0),
        setpoints={"f2_c": 700.0},
    )


def test_heating_rate():
    ramp = RampController(make_params())
    expected = 280.0 / 300.0  # (230 - (-50)) / 300
    assert abs(ramp.heating_rate_c_per_s() - expected) < 1e-6


def test_ratio_vm_below_zero():
    ramp = RampController(make_params())
    ramp.set_system_rate(1.0)
    vm = ramp.compute(-45.0, 0.25, 0.0)
    expected = (280.0 / 300.0) * 255.0  # taxa_usuário / taxa_sistema * 255
    assert abs(vm - expected) < 0.5


def test_pid_above_zero():
    ramp = RampController(make_params())
    vm = ramp.compute(0.0, 0.25, 0.0)
    assert 0.0 <= vm <= 255.0


def test_target_setpoint_progresses():
    ramp = RampController(make_params())
    assert ramp.target_setpoint_at(0.0) == -50.0
    assert ramp.target_setpoint_at(150.0) > ramp.target_setpoint_at(0.0)
    assert ramp.target_setpoint_at(5000.0) <= 230.0
