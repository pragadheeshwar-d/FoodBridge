"""
Admin management routes for user approval, review, and platform oversight.
"""

from __future__ import annotations

from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import or_, func

from extensions import db
from models import User, Notification
from services.realtime import emit_notification, emit_to_user

admin_bp = Blueprint('admin', __name__)


def _require_admin():
    identity = get_jwt_identity()
    user = User.query.get(identity)
    if not user or user.role not in {'admin', 'super_admin'}:
        return None
    return user


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    admin = _require_admin()
    if not admin:
        return {'success': False, 'message': 'Admin privileges required'}, 403

    total_users = User.query.filter(User.role.in_(['donor', 'receiver'])).count()
    pending_approvals = User.query.filter(
        User.role.in_(['donor', 'receiver']),
        func.lower(User.status) == 'pending'
    ).count()
    approved_users = User.query.filter(
        User.role.in_(['donor', 'receiver']),
        func.lower(User.status) == 'approved'
    ).count()
    rejected_users = User.query.filter(
        User.role.in_(['donor', 'receiver']),
        func.lower(User.status) == 'rejected'
    ).count()
    email_verified_users = User.query.filter(
        User.role.in_(['donor', 'receiver']),
        User.verified == True
    ).count()

    return {
        'success': True,
        'message': 'Admin statistics loaded',
        'data': {
            'totalUsers': total_users,
            'pendingApprovals': pending_approvals,
            'approvedUsers': approved_users,
            'rejectedUsers': rejected_users,
            'emailVerifiedUsers': email_verified_users,
        }
    }, 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    admin = _require_admin()
    if not admin:
        return {'success': False, 'message': 'Admin privileges required'}, 403

    status_filter = request.args.get('status', '').strip().lower()
    role_filter = request.args.get('role', '').strip().lower()
    search = request.args.get('search', '').strip()

    if role_filter and role_filter != 'all':
        query = User.query.filter(func.lower(User.role) == role_filter)
    else:
        query = User.query.filter(User.role.in_(['donor', 'receiver']))

    if status_filter and status_filter != 'all':
        query = query.filter(func.lower(User.status) == status_filter)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term),
                User.organization.ilike(search_term),
                User.phone.ilike(search_term),
            )
        )

    # Sort: pending first, then newest
    users = query.order_by(
        db.case((func.lower(User.status) == 'pending', 0), else_=1),
        User.created_at.desc()
    ).all()

    return {
        'success': True,
        'message': 'Users retrieved',
        'data': {
            'users': [u.to_dict() for u in users],
            'count': len(users),
        }
    }, 200


@admin_bp.route('/users/<int:user_id>/approve', methods=['POST'])
@jwt_required()
def approve_user(user_id: int):
    admin = _require_admin()
    if not admin:
        return {'success': False, 'message': 'Admin privileges required'}, 403

    user = User.query.get(user_id)
    if not user:
        return {'success': False, 'message': 'User not found'}, 404

    user.status = 'approved'
    user.account_status = 'approved'
    user.approved_at = datetime.utcnow()
    user.rejected_at = None
    user.rejection_reason = None

    # Send notification to user
    notification = Notification(
        user_id=user.id,
        title='Account Approved! 🎉',
        message='Your account/request has been approved by the admin.',
        type='success',
        link='/donor' if user.role == 'donor' else '/receiver'
    )
    db.session.add(notification)
    db.session.commit()
    emit_notification(notification)
    emit_to_user(user.id, 'account_status_changed', {
        'status': 'approved',
        'account_status': 'approved',
        'message': 'Your account/request has been approved by the admin.',
        'user': user.to_dict(),
    })

    return {
        'success': True,
        'message': f'Account for {user.name} ({user.organization or user.email}) has been approved.',
        'data': {'user': user.to_dict()}
    }, 200


@admin_bp.route('/users/<int:user_id>/reject', methods=['POST'])
@jwt_required()
def reject_user(user_id: int):
    admin = _require_admin()
    if not admin:
        return {'success': False, 'message': 'Admin privileges required'}, 403

    user = User.query.get(user_id)
    if not user:
        return {'success': False, 'message': 'User not found'}, 404

    data = request.get_json(silent=True) or {}
    reason = (data.get('reason') or data.get('rejection_reason') or '').strip()

    user.status = 'rejected'
    user.account_status = 'rejected'
    user.rejected_at = datetime.utcnow()
    user.rejection_reason = reason or 'Registration does not meet FoodBridge verification criteria.'

    # Send notification to user
    notification = Notification(
        user_id=user.id,
        title='Account Status Update',
        message='Your request requires attention. Please check the latest status.',
        type='warning',
        link='/pending'
    )
    db.session.add(notification)
    db.session.commit()
    emit_notification(notification)
    emit_to_user(user.id, 'account_status_changed', {
        'status': 'rejected',
        'account_status': 'rejected',
        'rejection_reason': user.rejection_reason,
        'message': 'Your request requires attention. Please check the latest status.',
        'user': user.to_dict(),
    })

    return {
        'success': True,
        'message': f'Account for {user.name} has been rejected.',
        'data': {'user': user.to_dict()}
    }, 200
