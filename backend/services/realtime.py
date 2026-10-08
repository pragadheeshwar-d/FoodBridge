"""
Shared helpers for emitting Socket.IO events and syncing live updates.
"""

from __future__ import annotations

from typing import Iterable

from extensions import socketio


def user_room(user_id: int | str) -> str:
    return f'user_{user_id}'


def emit_to_user(user_id: int | str, event: str, payload: dict) -> None:
    socketio.emit(event, payload, room=user_room(user_id))


def emit_to_users(user_ids: Iterable[int | str], event: str, payload: dict) -> None:
    for user_id in user_ids:
        emit_to_user(user_id, event, payload)


def emit_notification(notification) -> None:
    payload = notification.to_dict()
    emit_to_user(notification.user_id, 'notification_created', payload)
    emit_to_user(notification.user_id, 'notification', payload)


def emit_dashboard_update(user_ids: Iterable[int | str], payload: dict | None = None) -> None:
    body = payload or {}
    emit_to_users(user_ids, 'dashboard_updated', body)
    emit_to_users(user_ids, 'dashboard_update', body)


def emit_pickup_update(user_ids: Iterable[int | str], payload: dict) -> None:
    emit_to_users(user_ids, 'pickup_update', payload)


def emit_qr_update(user_ids: Iterable[int | str], payload: dict) -> None:
    emit_to_users(user_ids, 'qr_update', payload)


def emit_message(user_ids: Iterable[int | str], payload: dict) -> None:
    emit_to_users(user_ids, 'new_message', payload)

