"""Modelos de configuração persistida (contrato do TDD)."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class PIDGains(BaseModel):
    kp: float = Field(ge=0.0)
    ti: float = Field(ge=0.0)
    td: float = Field(ge=0.0)


class RampConfig(BaseModel):
    time_s: float = Field(default=300.0, gt=0.0, description="Duração total da rampa (s)")
    nitrogen_temp_c: float = Field(default=-50.0, ge=-300, le=50)
    target_temp_c: float = Field(default=230.0, ge=0, le=300)


class Params(BaseModel):
    version: int = 1
    updated_at: str = ""
    pid_u: PIDGains = PIDGains(kp=5.0, ti=1.8, td=0.0)
    pid_f2: PIDGains = PIDGains(kp=44.67, ti=0.18, td=0.0)
    times_s: dict[str, float] = Field(
        default_factory=lambda: {"t1": 60.0, "t2": 360.0, "t3": 60.0}
    )
    ramp: RampConfig = RampConfig()
    setpoints: dict[str, float] = Field(default_factory=lambda: {"f2_c": 700.0})

    @field_validator("times_s")
    @classmethod
    def _valid_times(cls, v: dict[str, float]) -> dict[str, float]:
        for key in ("t1", "t2", "t3"):
            if v.get(key, 0.0) <= 0:
                raise ValueError(f"{key} deve ser > 0")
        return v

    @field_validator("setpoints")
    @classmethod
    def _valid_setpoints(cls, v: dict[str, float]) -> dict[str, float]:
        if v.get("f2_c", 0.0) <= 0:
            raise ValueError("setpoint f2_c deve ser > 0")
        return v
