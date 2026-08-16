"""Teste E2E: ciclo de comunicação real com o simulador via socat (pty)."""
from __future__ import annotations

import re
import subprocess
import time

import pytest

from app.fsm import Event, State, StateMachine
from app.loop import ControlLoop
from app.models import Params, PIDGains, RampConfig
from app.serial_link import SerialLink

from tests.simulator import DaqSimulator

pytestmark = pytest.mark.e2e


def make_params() -> Params:
    return Params(
        pid_u=PIDGains(kp=5.0, ti=1.8, td=0.0),
        pid_f2=PIDGains(kp=44.67, ti=0.18, td=0.0),
        times_s={"t1": 1.0, "t2": 1.0, "t3": 1.0},
        ramp=RampConfig(time_s=1.0, nitrogen_temp_c=-50.0, target_temp_c=230.0),
        setpoints={"f2_c": 700.0},
    )


@pytest.fixture
def pty_pair():
    proc = subprocess.Popen(
        ["socat", "-d", "-d", "pty,raw,echo=0", "pty,raw,echo=0"],
        stderr=subprocess.PIPE,
        text=True,
    )
    paths = []
    deadline = time.time() + 5
    while len(paths) < 2 and time.time() < deadline:
        line = proc.stderr.readline()
        m = re.search(r"N PTY is (\S+)", line)
        if m:
            paths.append(m.group(1))
    if len(paths) < 2:
        proc.kill()
        pytest.skip("socat indisponível")
    yield paths[0], paths[1]
    proc.kill()


def test_serial_roundtrip_4hz(pty_pair):
    sim_port, link_port = pty_pair
    sim = DaqSimulator(sim_port)
    sim.start()
    try:
        fsm = StateMachine(make_params())
        link = SerialLink(port=link_port, timeout=0.05)
        loop = ControlLoop(fsm, link, loop_rate_hz=4.0)
        loop.start()
        time.sleep(1.2)
        loop.stop()
        assert sim.commands > 0
        assert loop.last_report is not None
        assert loop.latest_telemetry is not None
    finally:
        sim.stop()


def test_start_reaches_t0_on_daq(pty_pair):
    sim_port, link_port = pty_pair
    sim = DaqSimulator(sim_port)
    sim.start()
    try:
        fsm = StateMachine(make_params())
        link = SerialLink(port=link_port, timeout=0.05)
        loop = ControlLoop(fsm, link, loop_rate_hz=4.0)
        loop.start()
        fsm.handle_event(Event.START)
        time.sleep(0.7)
        loop.stop()
        assert sim.last_command is not None
        payload = sim.last_command
        assert payload["valves"]["sv1"] == 1
        assert payload["pump"] == 1
    finally:
        sim.stop()


def test_complete_cycle_observed_on_daq(pty_pair):
    sim_port, link_port = pty_pair
    sim = DaqSimulator(sim_port)
    sim.start()
    try:
        fsm = StateMachine(make_params())
        link = SerialLink(port=link_port, timeout=0.05)
        loop = ControlLoop(fsm, link, loop_rate_hz=4.0)
        loop.start()
        fsm.handle_event(Event.START)
        # fases de 1s → ciclo total ~4s
        time.sleep(5.5)
        loop.stop()
        assert fsm.state == State.SAFE  # ciclo completo retornou ao Safe State
    finally:
        sim.stop()
