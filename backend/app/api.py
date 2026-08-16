"""API REST + WebSocket da IHM."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from .fsm import Event
from .models import Params
from .serial_link import SerialError


class ManualPayload(BaseModel):
    valves: dict = {}
    pump: int = 0
    pwm: dict = {"u": 0, "f2": 0}


class ModePayload(BaseModel):
    mode: str


def create_websocket_router(hub) -> APIRouter:
    """Router sem prefixo /api: o WebSocket fica em /ws/telemetry (contrato do TDD)."""
    router = APIRouter()

    @router.websocket("/ws/telemetry")
    async def telemetry(ws: WebSocket):
        await ws.accept()
        hub.clients.add(ws)
        try:
            while True:
                await ws.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            hub.clients.discard(ws)

    return router


def create_router(hub) -> APIRouter:
    router = APIRouter(prefix="/api")

    @router.get("/config")
    def get_config():
        return hub.store.load().model_dump()

    @router.put("/config")
    def put_config(params: Params):
        try:
            hub.store.save(params)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        hub.fsm.set_params(params)
        if hub.serial.connected:
            try:
                hub.serial.write_command(
                    {
                        "cmd": "config",
                        "pid_u": params.pid_u.model_dump(),
                        "pid_f2": params.pid_f2.model_dump(),
                    }
                )
            except SerialError:
                pass
        return {"ok": True, "params": params.model_dump()}

    @router.post("/control/start")
    def start():
        hub.fsm.handle_event(Event.START)
        return {"state": hub.fsm.state.value}

    @router.post("/control/stop")
    def stop():
        hub.fsm.handle_event(Event.STOP)
        return {"state": hub.fsm.state.value}

    @router.post("/control/emergency")
    def emergency():
        hub.fsm.handle_event(Event.EMERGENCY)
        return {"state": hub.fsm.state.value}

    @router.put("/manual")
    def manual(payload: ManualPayload):
        hub.fsm.set_manual(payload.valves, payload.pump, payload.pwm)
        return {"state": hub.fsm.state.value}

    @router.put("/control/mode")
    def set_mode(payload: ModePayload):
        """Alterna entre operação AUTOMÁTICA e MANUAL."""
        if payload.mode == "manual":
            hub.fsm.handle_event(Event.MANUAL)
        elif payload.mode == "auto":
            hub.fsm.handle_event(Event.AUTO)
        else:
            raise HTTPException(
                status_code=422, detail="mode deve ser 'auto' ou 'manual'"
            )
        return {"state": hub.fsm.state.value}

    return router
