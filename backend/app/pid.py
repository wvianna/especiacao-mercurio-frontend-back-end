"""Controlador PID (P+I com anti-windup). Saída em 0..255."""
from __future__ import annotations


class PidController:
    def __init__(
        self,
        kp: float,
        ti: float,
        td: float = 0.0,
        out_min: float = 0.0,
        out_max: float = 255.0,
    ):
        self.kp = kp
        self.ti = ti
        self.td = td
        self.out_min = out_min
        self.out_max = out_max
        self.reset()

    def reset(self) -> None:
        self._integral = 0.0
        self._prev_pv = None
        self._last_out = 0.0

    def update(self, setpoint: float, pv: float, dt: float) -> float:
        if dt <= 0:
            return self._last_out

        error = setpoint - pv
        p_term = self.kp * error

        # derivada sobre a PV (evita "derivative kick" na mudança de setpoint)
        d_term = 0.0
        if self.td > 0 and self._prev_pv is not None:
            d_term = -self.kp * self.td * (pv - self._prev_pv) / dt

        raw = p_term + self._integral + d_term

        # integração com anti-windup: só integra quando não saturado
        if self.ti > 0:
            if self.out_min < raw < self.out_max:
                self._integral += (self.kp / self.ti) * error * dt
            else:
                # clampa o integrador para não "enrolar"
                lo = self.out_min - p_term - d_term
                hi = self.out_max - p_term - d_term
                self._integral = max(lo, min(self._integral, hi))

        out = p_term + self._integral + d_term
        out = max(self.out_min, min(self.out_max, out))

        self._prev_pv = pv
        self._last_out = out
        return out
