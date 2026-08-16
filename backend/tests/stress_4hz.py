"""Teste de estresse da comunicação a 4 Hz.

Uso:
    python -m tests.stress_4hz --port /dev/pts/X --duration 3600

Mede a perda de pacotes e reporta degradação. Sem hardware, usar socat:
    socat -d -d pty,raw,echo=0 pty,raw,echo=0
"""
from __future__ import annotations

import argparse
import re
import subprocess
import time

from app.fsm import StateMachine
from app.loop import ControlLoop
from app.models import Params, PIDGains, RampConfig
from app.serial_link import SerialLink

from tests.simulator import DaqSimulator


def make_params() -> Params:
    return Params(
        pid_u=PIDGains(kp=5.0, ti=1.8, td=0.0),
        pid_f2=PIDGains(kp=44.67, ti=0.18, td=0.0),
        times_s={"t1": 60.0, "t2": 360.0, "t3": 60.0},
        ramp=RampConfig(time_s=300.0, nitrogen_temp_c=-50.0, target_temp_c=230.0),
        setpoints={"f2_c": 700.0},
    )


def _pty_pair():
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
        raise RuntimeError("não foi possível criar pty pair")
    return proc, paths[0], paths[1]


def run(duration_s: float) -> None:
    proc, sim_port, link_port = _pty_pair()
    sim = DaqSimulator(sim_port)
    sim.start()
    fsm = StateMachine(make_params())
    link = SerialLink(port=link_port, timeout=0.05)
    loop = ControlLoop(fsm, link, loop_rate_hz=4.0)
    loop.start()

    start = time.time()
    last_count = 0
    while time.time() - start < duration_s:
        time.sleep(min(10.0, duration_s))
        now_count = sim.commands
        delta = now_count - last_count
        expected = int((time.time() - start) * 4.0)
        print(
            f"[{time.time() - start:7.1f}s] pacotes={now_count} "
            f"delta={delta} esperados≈{expected}",
            flush=True,
        )
        last_count = now_count

    loop.stop()
    sim.stop()
    proc.kill()

    total = sim.commands
    expected_total = int(duration_s * 4.0)
    loss = max(0, expected_total - total)
    print(f"\nRESULTADO: pacotes={total} esperados≈{expected_total} perda={loss}")
    if loss > 0:
        raise SystemExit(1)
    print("OK: sem perda de pacotes")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Estresse 4 Hz da comunicação")
    parser.add_argument("--duration", type=float, default=3600.0)
    args = parser.parse_args()
    run(args.duration)
