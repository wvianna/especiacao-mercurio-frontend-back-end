"""Testes do controlador PID."""
from app.pid import PidController


def test_proportional_positive_output():
    pid = PidController(kp=2.0, ti=10.0, td=0.0)
    out = pid.update(100.0, 50.0, 0.25)
    assert out > 0.0


def test_integral_action_accumulates():
    pid = PidController(kp=1.0, ti=0.5, td=0.0)
    # erro constante: o termo integral deve crescer
    pid.update(100.0, 50.0, 0.25)
    pid.update(100.0, 50.0, 0.25)
    pid.update(100.0, 50.0, 0.25)
    out = pid.update(100.0, 50.0, 0.25)
    assert out > pid.kp * 50.0  # maior que só o termo proporcional


def test_derivative_is_stable_for_constant_error():
    pid = PidController(kp=1.0, ti=100.0, td=0.5)
    pid.update(100.0, 50.0, 0.25)
    pid.update(100.0, 50.0, 0.25)
    out2 = pid.update(100.0, 50.0, 0.25)
    out3 = pid.update(100.0, 50.0, 0.25)
    assert abs(out3 - out2) < 1.0  # erro constante -> derivada ~0


def test_saturation_limits():
    pid = PidController(kp=100.0, ti=1000.0, td=0.0)
    assert pid.update(100.0, 0.0, 0.25) <= 255.0
    assert pid.update(0.0, 100.0, 0.25) >= 0.0


def test_converges_with_plant():
    pid = PidController(kp=2.0, ti=0.5, td=0.3)
    pv = 0.0
    sp = 100.0
    for _ in range(12000):
        out = pid.update(sp, pv, 0.25)
        # planta com leve resfriamento para permitir equilíbrio
        pv += (out / 255.0) * 3.0 * 0.25 - 0.02 * 0.25
    assert 90.0 <= pv <= 110.0


def test_reset_clears_integral():
    pid = PidController(kp=1.0, ti=0.5, td=0.0)
    pid.update(100.0, 0.0, 0.25)
    pid.reset()
    assert pid.update(0.0, 0.0, 0.25) == 0.0
