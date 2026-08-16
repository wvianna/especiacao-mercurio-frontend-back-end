"""Enlace serial com codec JSON (line-delimited) e reconexão."""
from __future__ import annotations

import json
import threading
from typing import Any, Optional

try:
    import serial
except ImportError:  # pragma: no cover
    serial = None


class SerialError(Exception):
    pass


class SerialLink:
    def __init__(
        self,
        port: str = "/dev/ttyUSB0",
        baud: int = 115200,
        timeout: float = 0.05,
        transport: Any = None,
    ):
        self.port = port
        self.baud = baud
        self.timeout = timeout
        self._transport = transport  # injetável (testes/simulador)
        self._ser = None
        self._lock = threading.Lock()

    @property
    def connected(self) -> bool:
        return self._ser is not None

    def connect(self, config: dict) -> None:
        if serial is None and self._transport is None:
            raise SerialError("pyserial não instalado")
        if self._transport is not None:
            self._ser = self._transport
        else:
            self._ser = serial.Serial(self.port, self.baud, timeout=self.timeout)
        self.write_raw(
            {
                "cmd": "config",
                "pid_u": config["pid_u"],
                "pid_f2": config["pid_f2"],
            }
        )

    def close(self) -> None:
        with self._lock:
            if self._ser is not None:
                try:
                    self._ser.close()
                except Exception:
                    pass
                self._ser = None

    def write_command(self, cmd: dict) -> None:
        self.write_raw(cmd)

    def write_raw(self, payload: dict) -> None:
        with self._lock:
            if self._ser is None:
                raise SerialError("serial não conectada")
            self._ser.write((json.dumps(payload) + "\n").encode("utf-8"))

    def read_report(self) -> Optional[dict]:
        with self._lock:
            if self._ser is None:
                raise SerialError("serial não conectada")
            line = self._ser.readline()
            if not line:
                return None
            try:
                return json.loads(line.decode("utf-8").strip())
            except json.JSONDecodeError:
                return None
