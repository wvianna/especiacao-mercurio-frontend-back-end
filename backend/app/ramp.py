"""Rampa do Tubo U (Forno 1): razão de taxas abaixo de 0 °C, PID acima."""
from __future__ import annotations

from .models import Params
from .pid import PidController


class RampController:
    def __init__(self, params: Params):
        self.params = params
        self.pid = PidController(
            params.pid_u.kp, params.pid_u.ti, params.pid_u.td
        )
        self._rate_c_per_s = self._compute_rate()
        self._rate_system = max(self._rate_c_per_s, 1e-9)

    def update_params(self, params: Params) -> None:
        self.params = params
        self.pid = PidController(
            params.pid_u.kp, params.pid_u.ti, params.pid_u.td
        )
        self._rate_c_per_s = self._compute_rate()
        self._rate_system = max(self._rate_c_per_s, 1e-9)

    def _compute_rate(self) -> float:
        ramp = self.params.ramp
        if ramp.time_s <= 0:
            return 0.0
        return (ramp.target_temp_c - ramp.nitrogen_temp_c) / ramp.time_s

    def set_system_rate(self, rate: float) -> None:
        """Taxa de aquecimento do sistema (calibração) para a razão de taxas."""
        self._rate_system = max(rate, 1e-9)

    def heating_rate_c_per_s(self) -> float:
        return self._rate_c_per_s

    def target_setpoint_at(self, elapsed_s: float) -> float:
        """Setpoint dinâmico da rampa (linear no tempo), limitado ao alvo."""
        sp = self.params.ramp.nitrogen_temp_c + self._rate_c_per_s * elapsed_s
        return min(sp, self.params.ramp.target_temp_c)

    def compute(self, t_current: float, dt: float, elapsed_s: float) -> float:
        if t_current < 0.0:
            # VM = Taxa_usuário / Taxa_sistema (estratégia do TDD para T < 0)
            ratio = self._rate_c_per_s / self._rate_system
            return max(0.0, min(255.0, ratio * 255.0))
        # T >= 0 °C: PID em malha fechada segue o setpoint dinâmico
        return self.pid.update(self.target_setpoint_at(elapsed_s), t_current, dt)
