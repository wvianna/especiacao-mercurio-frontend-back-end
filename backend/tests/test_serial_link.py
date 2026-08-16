"""Testes do enlace serial (com transporte fake)."""
import json

from app.serial_link import SerialError, SerialLink


class FakeTransport:
    def __init__(self):
        self.written = []
        self.inbox = []

    def write(self, data: bytes):
        self.written.append(data)

    def readline(self) -> bytes:
        if self.inbox:
            return self.inbox.pop(0)
        return b""

    def close(self):
        pass


def test_connect_sends_handshake():
    t = FakeTransport()
    link = SerialLink(port="fake", transport=t)
    link.connect(
        {"pid_u": {"kp": 5.0, "ti": 1.8, "td": 0.0}, "pid_f2": {"kp": 44.67, "ti": 0.18, "td": 0.0}}
    )
    assert link.connected
    last = json.loads(t.written[-1].decode())
    assert last["cmd"] == "config"
    assert last["pid_u"]["kp"] == 5.0


def test_write_and_read():
    t = FakeTransport()
    link = SerialLink(port="fake", transport=t)
    link.connect({"pid_u": {}, "pid_f2": {}})
    link.write_command(
        {"valves": {"sv1": 1}, "pump": 0, "pwm": {"u": 128, "f2": 255}}
    )
    payload = json.loads(t.written[-1].decode())
    assert payload["pwm"]["u"] == 128
    assert payload["valves"]["sv1"] == 1

    t.inbox.append(b'{"temp":{"t1":-45.2,"t2":699.5},"status":"active","error_code":0}\n')
    rep = link.read_report()
    assert rep["temp"]["t1"] == -45.2
    assert rep["status"] == "active"


def test_read_empty_returns_none():
    t = FakeTransport()
    link = SerialLink(port="fake", transport=t)
    link.connect({"pid_u": {}, "pid_f2": {}})
    assert link.read_report() is None


def test_write_without_connect_raises():
    link = SerialLink(port="fake", transport=FakeTransport())
    try:
        link.write_command({})
        assert False, "deveria levantar SerialError"
    except SerialError:
        pass
