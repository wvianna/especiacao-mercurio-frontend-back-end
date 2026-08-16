"""Persistência atômica dos parâmetros em JSON (com backup rotativo)."""
from __future__ import annotations

import json
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from .models import Params

DEFAULT_PATH = Path(__file__).resolve().parent.parent / "data" / "params.json"


class ConfigStore:
    def __init__(self, path: Path | str = DEFAULT_PATH):
        self.path = Path(path)
        self.backup = self.path.with_suffix(".json.bak")

    def defaults(self) -> Params:
        return Params()

    def load(self) -> Params:
        if not self.path.exists():
            return self.defaults()
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
            return Params.model_validate(data)
        except Exception:
            # tenta restaurar o backup rotativo
            if self.backup.exists():
                try:
                    data = json.loads(self.backup.read_text(encoding="utf-8"))
                    return Params.model_validate(data)
                except Exception:
                    return self.defaults()
            return self.defaults()

    def save(self, params: Params) -> None:
        # valida antes de persistir (reusa as regras do modelo)
        Params.model_validate(params.model_dump())
        self.path.parent.mkdir(parents=True, exist_ok=True)
        params.updated_at = datetime.now(timezone.utc).isoformat()
        payload = params.model_dump_json(indent=2) + "\n"

        # backup rotativo do arquivo anterior
        if self.path.exists():
            shutil.copy2(self.path, self.backup)

        fd, tmp = tempfile.mkstemp(dir=str(self.path.parent), suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(payload)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp, self.path)
        except BaseException:
            if os.path.exists(tmp):
                os.unlink(tmp)
            raise
