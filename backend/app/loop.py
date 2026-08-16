"""Loop de controle a 4 Hz: serial, FSM, telemetria e watchdog de backend."""
from __future__ import annotations

import logging
import threading
import time

from .fsm import Event, State

log = logging.getLogger("loop")

WATCHDOG_TIMEOUT_S = 1.0  # espelho do watchdog do Arduino (segurança)


class ControlLoop:
    def __init__(self, fsm, serial_link, loop_rate_hz: float = 4.0):
        self.fsm = fsm
        self.serial = serial_link
        self.period = 1.0 / loop_rate_hz
        self._stop = threading.Event()
        self._thread = None
        self._lock = threading.Lock()
        self.last_report = None
        self.last_report_ts = 0.0
        self.loop_count = 0
        self.latest_telemetry = None

    def start(self) -> None:
        self._thread = threading.Thread(
            target=self._run, daemon=True, name="control-loop"
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=2)

    def _run(self) -> None:
        next_time = time.monotonic()
        while not self._stop.is_set():
            now = time.monotonic()
            dt = min(now - next_time + self.period, 0.5)
            next_time += self.period
            if next_time < now - self.period:
                next_time = now + self.period
            self._step(max(dt, 1e-4))
            self._stop.wait(max(0.0, next_time - time.monotonic()))

    def _step(self, dt: float) -> None:
        fsm = self.fsm

        # reconexão automática (captura ampla: pyserial lança SerialException etc.)
        if not self.serial.connected:
            try:
                self.serial.connect(
                    {
                        "pid_u": fsm.params.pid_u.model_dump(),
                        "pid_f2": fsm.params.pid_f2.model_dump(),
                    }
                )
                self.last_report_ts = time.monotonic()
            except Exception:
                pass  # tenta de novo no próximo ciclo

        try:
            self.serial.write_command(fsm.command_payload())
            rep = self.serial.read_report()
        except Exception:
            fsm.handle_event(Event.EMERGENCY)
            self._emit()
            return

        if rep is not None:
            self.last_report = rep
            self.last_report_ts = time.monotonic()
            t1 = rep.get("temp", {}).get("t1", 0.0)
            t2 = rep.get("temp", {}).get("t2", 0.0)
            fsm.tick(dt, t1, t2)
        else:
            # sem resposta do DAQ — se passar do timeout, entra em Safe State
            if (
                self.last_report_ts
                and time.monotonic() - self.last_report_ts > WATCHDOG_TIMEOUT_S
                and fsm.state not in (State.SAFE, State.MANUAL)
            ):
                log.warning("sem resposta do DAQ por > 1s; entrando em SAFE")
                fsm.handle_event(Event.EMERGENCY)

        self.loop_count += 1
        self._emit()

    def _emit(self) -> None:
        fsm = self.fsm
        act = fsm.actuator_state()
        telemetry = {
            "ts": round(time.time(), 3),
            "temp": self._temp_from_report(),
            "sp": fsm.current_setpoints(),
            "pwm": dict(act["pwm"]),
            "rate_c_per_s": round(fsm.ramp.heating_rate_c_per_s(), 3),
            "state": fsm.state.value,
            "valves": dict(act["valves"]),
            "pump": act["pump"],
            "error_code": (
                0
                if self.last_report is None
                else self.last_report.get("error_code", 0)
            ),
        }
        with self._lock:
            self.latest_telemetry = telemetry

    def _temp_from_report(self) -> dict:
        if self.last_report is None:
            return {"t1": 0.0, "t2": 0.0}
        return self.last_report.get("temp", {"t1": 0.0, "t2": 0.0})
