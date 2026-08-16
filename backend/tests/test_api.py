"""Testes da API REST (sem loop real)."""
from fastapi.testclient import TestClient

from app.config_store import ConfigStore
from app.fsm import StateMachine
from app.main import Hub, create_app


def make_hub(tmp_path) -> Hub:
    hub = Hub()
    hub.store = ConfigStore(tmp_path / "params.json")
    hub.fsm = StateMachine(hub.store.load())
    hub.loop = None  # sem loop de controle nos testes de API
    hub.clients = set()
    return hub


def test_get_config(tmp_path):
    hub = make_hub(tmp_path)
    app = create_app(hub)
    with TestClient(app) as client:
        r = client.get("/api/config")
    assert r.status_code == 200
    assert r.json()["pid_u"]["kp"] == 5.0


def test_put_config_persists(tmp_path):
    hub = make_hub(tmp_path)
    app = create_app(hub)
    body = hub.store.load().model_dump()
    body["pid_u"]["kp"] = 12.0
    with TestClient(app) as client:
        r = client.put("/api/config", json=body)
    assert r.status_code == 200
    assert hub.store.load().pid_u.kp == 12.0


def test_put_config_invalid_returns_422(tmp_path):
    hub = make_hub(tmp_path)
    app = create_app(hub)
    body = hub.store.load().model_dump()
    body["times_s"]["t1"] = -5.0
    with TestClient(app) as client:
        r = client.put("/api/config", json=body)
    assert r.status_code == 422


def test_control_events(tmp_path):
    hub = make_hub(tmp_path)
    app = create_app(hub)
    with TestClient(app) as client:
        assert client.post("/api/control/start").json()["state"] == "T0_DERIV"
        assert client.post("/api/control/emergency").json()["state"] == "SAFE"
        assert client.post("/api/control/stop").json()["state"] == "SAFE"


def test_manual(tmp_path):
    hub = make_hub(tmp_path)
    app = create_app(hub)
    with TestClient(app) as client:
        r = client.put(
            "/api/manual",
            json={"valves": {"sv1": 1}, "pump": 1, "pwm": {"u": 128, "f2": 0}},
        )
    assert r.status_code == 200
    assert r.json()["state"] == "MANUAL"


def test_mode_manual_and_auto(tmp_path):
    hub = make_hub(tmp_path)
    app = create_app(hub)
    with TestClient(app) as client:
        r = client.put("/api/control/mode", json={"mode": "manual"})
        assert r.status_code == 200
        assert r.json()["state"] == "MANUAL"
        r = client.put("/api/control/mode", json={"mode": "auto"})
        assert r.status_code == 200
        assert r.json()["state"] == "SAFE"


def test_mode_invalid_returns_422(tmp_path):
    hub = make_hub(tmp_path)
    app = create_app(hub)
    with TestClient(app) as client:
        r = client.put("/api/control/mode", json={"mode": "xyz"})
    assert r.status_code == 422
