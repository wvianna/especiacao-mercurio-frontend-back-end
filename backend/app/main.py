"""Fábrica da aplicação FastAPI + Hub de instâncias compartilhadas."""
from __future__ import annotations

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api import create_router, create_websocket_router
from .config_store import ConfigStore
from .fsm import StateMachine
from .loop import ControlLoop
from .serial_link import SerialLink

log = logging.getLogger("main")

FRONTEND_DIST = (
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
)


class Hub:
    """Contém as instâncias compartilhadas e os clientes WebSocket."""

    def __init__(self):
        self.store: ConfigStore = ConfigStore()
        self.serial: SerialLink = SerialLink(
            port=os.environ.get("SERIAL_PORT", "/dev/ttyUSB0")
        )
        self.fsm: StateMachine = StateMachine(self.store.load())
        self.loop: ControlLoop = ControlLoop(self.fsm, self.serial)
        self.clients: set = set()


async def _broadcast_loop(hub: Hub) -> None:
    while True:
        await asyncio.sleep(0.25)
        telemetry = hub.loop.latest_telemetry if hub.loop else None
        if telemetry is None:
            continue
        data = json.dumps(telemetry)
        for ws in list(hub.clients):
            try:
                await ws.send_text(data)
            except Exception:
                hub.clients.discard(ws)


def create_app(hub: Hub | None = None) -> FastAPI:
    hub = hub or Hub()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        if hub.loop:
            hub.loop.start()
        task = asyncio.create_task(_broadcast_loop(hub))
        yield
        task.cancel()
        if hub.loop:
            hub.loop.stop()

    app = FastAPI(title="IHM Especiação de Mercúrio", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(create_router(hub))
    app.include_router(create_websocket_router(hub))
    # Serve a IHM compilada (frontend/dist) quando disponível — servidor único
    if FRONTEND_DIST.exists():
        app.mount(
            "/",
            StaticFiles(directory=str(FRONTEND_DIST), html=True),
            name="frontend",
        )
    app.state.hub = hub
    return app
