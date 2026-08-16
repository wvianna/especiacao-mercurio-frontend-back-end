"""Ponto de entrada: python -m app.run"""
from __future__ import annotations

import os

import uvicorn

from .logging_setup import setup_logging
from .main import create_app


def main() -> None:
    setup_logging()
    app = create_app()
    uvicorn.run(
        app,
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "8000")),
    )


if __name__ == "__main__":
    main()
