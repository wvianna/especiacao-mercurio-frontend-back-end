"""Testes da rampa do Tubo U."""
from app.models import Params, PIDGains, RampConfig
from app.ramp import RampController


def make_params(pwm_below_zero: int = 180) -> Params:
    return Params(
        pid_u=PIDGains(kp=5.0, ti=1.8, td=0.0),
        pid_f2=PIDGains(kp=44.67, ti=0.18, td=0.0),
        times_s={"t1": 60.0, "t2": 360.0, "t3": 60.0},
        ramp=RampConfig(
            time_s=300.0,
            nitrogen_temp_c=-50.0,
            target_temp_c=230.0,
            pwm_below_zero=pwm_below_zero,
        ),
        setpoints={"f2_c": 700.0},
    )


def test_heating_rate():
    ramp = RampController(make_params())
    expected = 280.0 / 300.0  # (230 - (-50)) / 300
    assert abs(ramp.heating_rate_c_per_s() - expected) < 1e-6


def test_fixed_pwm_below_zero():
    ramp = RampController(make_params(pwm_below_zero=180))
    assert ramp.compute(-45.0, 0.25, 0.0) == 180.0


def test_fixed_pwm_at_zero_boundary():
    # 0 °C ainda é a região sem leitura confiável (o controle só assume T > 0 °C)
    ramp = RampController(make_params(pwm_below_zero=90))
    assert ramp.compute(0.0, 0.25, 0.0) == 90.0


def test_fixed_pwm_on_invalid_reading():
    # Leitura inválida (NaN) = região sem leitura confiável → PWM fixo
    ramp = RampController(make_params(pwm_below_zero=70))
    assert ramp.compute(float("nan"), 0.25, 0.0) == 70.0


def test_pid_takes_over_above_zero():
    ramp = RampController(make_params(pwm_below_zero=180))
    # SP dinâmico em elapsed=200 s: -50 + (280/300)*200 ≈ 136,7 °C; PV 100 °C → erro > 0
    vm = ramp.compute(100.0, 0.25, 200.0)
    assert 0.0 < vm <= 255.0
    assert vm != 180.0  # malha fechada assumiu; não é mais o PWM fixo


def test_fixed_pwm_follows_param_update():
    ramp = RampController(make_params(pwm_below_zero=180))
    ramp.update_params(make_params(pwm_below_zero=64))
    assert ramp.compute(-10.0, 0.25, 0.0) == 64.0


def test_target_setpoint_progresses():
    ramp = RampController(make_params())
    assert ramp.target_setpoint_at(0.0) == -50.0
    assert ramp.target_setpoint_at(150.0) > ramp.target_setpoint_at(0.0)
    assert ramp.target_setpoint_at(5000.0) <= 230.0
