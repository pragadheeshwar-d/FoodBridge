"""
Socket.IO event handlers for real-time chat and room membership.
"""

from __future__ import annotations

from flask import request
from flask_jwt_extended import decode_token
from flask_socketio import emit, join_room, leave_room

from extensions import db, socketio
from models import Message
from services.realtime import emit_message

connected_users: dict[str, bool] = {}


def _join_authenticated_user(auth=None):
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get('token')

    if not token:
        return None

    decoded = decode_token(token)
    user_id = str(decoded['sub'])
    connected_users[user_id] = True
    join_room(f'user_{user_id}')
    return user_id


@socketio.on('connect')
def handle_connect(auth=None):
    try:
        user_id = _join_authenticated_user(auth)
        if user_id:
            emit('connected', {'message': 'Authenticated', 'user_id': user_id})
        else:
            emit('connected', {'message': 'Connected (unauthenticated)'})
    except Exception:
        emit('connected', {'message': 'Connected (no token)'})


@socketio.on('disconnect')
def handle_disconnect():
    sid = getattr(request, 'sid', None)
    if sid is not None:
        connected_users.pop(str(sid), None)


@socketio.on('join_room')
@socketio.on('join')
def handle_join(data):
    user_id = data.get('user_id') if isinstance(data, dict) else None
    if user_id:
        join_room(f'user_{user_id}')
        emit('joined', {'room': f'user_{user_id}'})


@socketio.on('leave_room')
@socketio.on('leave')
def handle_leave(data):
    user_id = data.get('user_id') if isinstance(data, dict) else None
    if user_id:
        leave_room(f'user_{user_id}')


@socketio.on('send_message')
def handle_send_message(data):
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    text = str(data.get('message', '')).strip()
    conv_id = data.get('conversation_id')

    if not all([sender_id, receiver_id, text]):
        emit('error', {'message': 'Missing required fields'})
        return

    from models import Conversation, User
    from datetime import datetime
    sender = User.query.get(int(sender_id))
    receiver = User.query.get(int(receiver_id))
    if not sender or not receiver:
        emit('error', {'message': 'Invalid sender or receiver'})
        return

    # Strictly Donor ↔ Receiver only
    if (sender.role == 'donor' and receiver.role != 'receiver') or (sender.role == 'receiver' and receiver.role != 'donor'):
        emit('error', {'message': 'Messaging is only permitted between a donor and receiver'})
        return

    conv = None
    if conv_id:
        conv = Conversation.query.get(int(conv_id))
    if not conv:
        donor_id = sender.id if sender.role == 'donor' else receiver.id
        recv_id = sender.id if sender.role == 'receiver' else receiver.id
        conv = Conversation.query.filter_by(donor_id=donor_id, receiver_id=recv_id).first()
        if not conv:
            from models import PickupRequest, Donation
            latest_pickup = (
                PickupRequest.query
                .join(Donation)
                .filter(Donation.donor_id == donor_id, PickupRequest.receiver_id == recv_id)
                .order_by(PickupRequest.requested_at.desc())
                .first()
            )
            if latest_pickup:
                conv = Conversation(
                    donor_id=donor_id,
                    receiver_id=recv_id,
                    donation_id=latest_pickup.donation_id,
                    request_id=latest_pickup.id,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.session.add(conv)
                db.session.flush()

    msg = Message(
        conversation_id=conv.id if conv else None,
        sender_id=int(sender_id),
        receiver_id=int(receiver_id),
        message=text,
        donation_id=conv.donation_id if conv else None,
        pickup_id=conv.request_id if conv else None
    )
    db.session.add(msg)
    if conv:
        conv.updated_at = datetime.utcnow()
    db.session.commit()

    msg_dict = msg.to_dict()
    emit_message([sender_id, receiver_id], msg_dict)



@socketio.on('mark_read')
def handle_mark_read(data):
    message_ids = data.get('message_ids', [])
    sender_id = data.get('sender_id')

    if message_ids:
        Message.query.filter(Message.id.in_(message_ids)).update({'is_read': True}, synchronize_session=False)
        db.session.commit()
        if sender_id:
            payload = {'message_ids': message_ids}
            emit('messages_read', payload, room=f'user_{sender_id}')
            emit('message_read', payload, room=f'user_{sender_id}')


@socketio.on('typing')
def handle_typing(data):
    receiver_id = data.get('receiver_id')
    sender_id = data.get('sender_id')
    if receiver_id:
        payload = {'user_id': sender_id}
        emit('user_typing', payload, room=f'user_{receiver_id}')
        emit('typing_indicator', payload, room=f'user_{receiver_id}')
        emit('userTyping', payload, room=f'user_{receiver_id}')


@socketio.on('stop_typing')
def handle_stop_typing(data):
    receiver_id = data.get('receiver_id')
    sender_id = data.get('sender_id')
    if receiver_id:
        payload = {'user_id': sender_id}
        emit('user_stop_typing', payload, room=f'user_{receiver_id}')
        emit('typing_indicator', {'user_id': sender_id, 'typing': False}, room=f'user_{receiver_id}')
        emit('userStoppedTyping', payload, room=f'user_{receiver_id}')
