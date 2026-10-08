"""
Notification routes.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Notification, User
from services.realtime import emit_notification

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    limit = int(request.args.get('limit', 50))
    notifs = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return jsonify([n.to_dict() for n in notifs]), 200


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    user_id = get_jwt_identity()
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({'unread_count': count}), 200


@notifications_bp.route('/<int:id>/read', methods=['PUT', 'POST'])
@notifications_bp.route('/<int:id>/read/', methods=['PUT', 'POST'])
@jwt_required()
def mark_read(id):
    user_id = get_jwt_identity()
    notif = Notification.query.get_or_404(id)
    if str(notif.user_id) != str(user_id):
        return jsonify({'message': 'Unauthorized'}), 403
    notif.is_read = True
    db.session.commit()
    try:
        from services.realtime import emit_to_user
        emit_to_user(user_id, 'notification_read', {'id': id})
    except Exception:
        pass
    return jsonify({'message': 'Marked as read', 'id': id}), 200


@notifications_bp.route('/read', methods=['PUT', 'POST'])
@notifications_bp.route('/read/', methods=['PUT', 'POST'])
@jwt_required()
def mark_read_alias():
    data = request.get_json(silent=True) or {}
    notification_id = data.get('id')
    if notification_id:
        return mark_read(int(notification_id))
    user_id = get_jwt_identity()
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        uid = user_id
    Notification.query.filter_by(user_id=uid, is_read=False).update({'is_read': True}, synchronize_session=False)
    db.session.commit()
    try:
        from services.realtime import emit_to_user
        emit_to_user(user_id, 'notifications_read_all', {})
    except Exception:
        pass
    return jsonify({'message': 'Notifications marked as read'}), 200


@notifications_bp.route('/read-all', methods=['PUT', 'POST'])
@notifications_bp.route('/read-all/', methods=['PUT', 'POST'])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        uid = user_id
    Notification.query.filter_by(user_id=uid, is_read=False).update({'is_read': True}, synchronize_session=False)
    db.session.commit()
    try:
        from services.realtime import emit_to_user
        emit_to_user(user_id, 'notifications_read_all', {})
    except Exception:
        pass
    return jsonify({'message': 'All notifications marked as read'}), 200


@notifications_bp.route('/broadcast', methods=['POST'])
@jwt_required()
def broadcast():
    """Admin: broadcast a notification to all users or a specific role."""
    from extensions import socketio
    current_id = get_jwt_identity()
    admin = User.query.get(current_id)
    if admin.role not in ('admin', 'super_admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    data = request.get_json(force=True) or {}
    title = data.get('title', 'Announcement')
    message = data.get('message', '')
    role_filter = data.get('role')  # optional

    q = User.query
    if role_filter:
        q = q.filter_by(role=role_filter)
    users = q.all()

    created = []
    for u in users:
        n = Notification(
            user_id=u.id, title=title, message=message,
            type='info'
        )
        db.session.add(n)
        created.append(n)
    db.session.commit()

    for n in created:
        emit_notification(n)
    return jsonify({'message': f'Broadcast sent to {len(users)} users'}), 200


@notifications_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_notification(id):
    user_id = get_jwt_identity()
    notif = Notification.query.get_or_404(id)
    if str(notif.user_id) != str(user_id):
        return jsonify({'message': 'Unauthorized'}), 403
    db.session.delete(notif)
    db.session.commit()
    return jsonify({'message': 'Notification deleted'}), 200
