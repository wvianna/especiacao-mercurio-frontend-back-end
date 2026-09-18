"""Testes de persistência (ConfigStore)."""
import json

import pytest

from app.config_store import ConfigStore
from app.models import Params


def test_defaults_when_missing(tmp_path):
    store = ConfigStore(tmp_path / "params.json")
    p = store.load()
    assert p.pid_u.kp == 5.0
    assert p.pid_f2.kp == 44.67
    assert p.ramp.target_temp_c == 230.0
    assert p.ramp.pwm_below_zero == 128
    assert p.setpoints["f2_c"] == 700.0


def test_roundtrip(tmp_path):
    store = ConfigStore(tmp_path / "params.json")
    p = store.load()
    p.pid_u.kp = 12.5
    p.ramp.time_s = 480.0
    p.ramp.pwm_below_zero = 200
    store.save(p)

    p2 = store.load()
    assert p2.pid_u.kp == 12.5
    assert p2.ramp.time_s == 480.0
    assert p2.ramp.pwm_below_zero == 200
    assert p2.updated_at  # timestamp preenchido na escrita


def test_backup_restored_on_corruption(tmp_path):
    path = tmp_path / "params.json"
    store = ConfigStore(path)
    # 1ª gravação: cria o arquivo principal
    p = store.load()
    p.pid_u.kp = 7.0
    store.save(p)
    # 2ª gravação: gera o backup rotativo do anterior (kp=7)
    p.pid_u.kp = 9.0
    store.save(p)

    # corrompe o arquivo principal
    path.write_text("{corrupto", encoding="utf-8")
    p2 = store.load()
    assert p2.pid_u.kp == 7.0  # restaurado do backup


def test_rejects_invalid_times():
    with pytest.raises(Exception):
        Params(times_s={"t1": -5.0, "t2": 10.0, "t3": 10.0})


def test_rejects_invalid_setpoint():
    with pytest.raises(Exception):
        Params(setpoints={"f2_c": -1.0})


def test_rejects_invalid_pwm_below_zero():
    base = {"time_s": 300.0, "nitrogen_temp_c": -50.0, "target_temp_c": 230.0}
    with pytest.raises(Exception):
        Params(ramp={**base, "pwm_below_zero": 300})
    with pytest.raises(Exception):
        Params(ramp={**base, "pwm_below_zero": -1})


def test_legacy_json_defaults_new_field(tmp_path):
    """JSON gravado por versão anterior (sem pwm_below_zero) carrega com default."""
    path = tmp_path / "params.json"
    store = ConfigStore(path)
    data = store.defaults().model_dump()
    del data["ramp"]["pwm_below_zero"]
    path.write_text(json.dumps(data), encoding="utf-8")
    assert store.load().ramp.pwm_below_zero == 128
