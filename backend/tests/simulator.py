"""Simulador do DAQ (emula o Arduino) para testes sem hardware."""
from __future__ import annotations

import json
import threading

import serial


class DaqSimulator:
    """Lê JSON de escrita e responde JSON de leitura, com suporte a falha."""

    def __init__(
        self,
        port: str,
        baud: int = 115200,
        initial_t1: float = -45.0,
        initial_t2: float = 699.5,
    ):
        self.port = port
        self.baud = baud
        self.t1 = initial_t1
        self.t2 = initial_t2
        self.respond = True
        self._ser = None
        self._thread = None
        self._stop = threading.Event()
        self.last_command = None
        self.commands = 0

    def start(self) -> None:
        self._ser = serial.Serial(self.port, self.baud, timeout=0.05)
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._ser:
            try:
                self._ser.close()
            except Exception:
                pass

    def fail(self) -> None:
        """Para de responder — usado para testar o watchdog."""
        self.respond = False

    def _run(self) -> None:
        while not self._stop.is_set():
            try:
                line = self._ser.readline()
            except Exception:
                break  # serial fechada durante o stop
            if not line:
                continue
            try:
                cmd = json.loads(line.decode("utf-8").strip())
            except json.JSONDecodeError:
                continue
            self.last_command = cmd
            self.commands += 1
            if not self.respond:
                continue
            self._respond()

    def _respond(self) -> None:
        rep = {
            "temp": {"t1": round(self.t1, 1), "t2": round(self.t2, 1)},
            "status": "active",
            "error_code": 0,
        }
        self._ser.write((json.dumps(rep) + "\n").encode("utf-8"))
