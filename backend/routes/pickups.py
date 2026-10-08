"""
Pickup request routes for donor/receiver workflow.
"""

from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload

from extensions import db
from models import Allocation, Conversation, Donation, Message, Notification, PickupRequest, User
from services.allocation import allocate_pending_requests, begin_allocation_transaction, recalculate_donation_state
from services.qr_service import generate_qr_token
from services.realtime import emit_dashboard_update, emit_message, emit_notification, emit_pickup_update

pickups_bp = Blueprint('pickups', __name__)


def _json(success: bool, message: str, data=None, status: int = 200, code: str | None = None):
    payload = {'success': success, 'message': message}
    if code:
        payload['code'] = code
    if data is not None:
        payload['data'] = data
    return jsonify(payload), status


def _current_user() -> User | None:
    user_id = get_jwt_identity()
    if not user_id:
        return None
    return User.query.get(int(user_id))


def _serialize_pickup(pickup: PickupRequest) -> dict:
    donation = pickup.donation
    receiver = pickup.receiver
    donor = donation.donor if donation else None
    qr = pickup.pickup_qr
    return {
        'id': pickup.id,
        'donation_id': pickup.donation_id,
        'receiver_id': pickup.receiver_id,
        'receiver_name': receiver.name if receiver else None,
        'receiver_organization': receiver.organization if receiver else None,
        'request_message': pickup.request_message,
        'status': pickup.status,
        'requested_quantity': pickup.requested_quantity,
        'allocated_quantity': pickup.allocated_quantity or 0,
        'pending_quantity': max(0, (pickup.requested_quantity or 0) - (pickup.allocated_quantity or 0)),
        'allocation_status': pickup.allocation_status or 'WAITING',
        'requested_at': pickup.requested_at.isoformat() if pickup.requested_at else None,
        'approved_at': pickup.approved_at.isoformat() if pickup.approved_at else None,
        'completed_at': pickup.completed_at.isoformat() if pickup.completed_at else None,
        'qr_token': qr.qr_token if qr and qr.status == 'Active' else None,
        'qr_status': qr.status if qr else ('Used' if pickup.qr_used else None),
        'qr_generated_at': qr.generated_at.isoformat() if qr and qr.generated_at else None,
        'qr_expires_at': qr.expires_at.isoformat() if qr and qr.expires_at else None,
        'qr_scanned_at': qr.scanned_at.isoformat() if qr and qr.scanned_at else None,
        'donor_id': donation.donor_id if donation else None,
        'donation': {
            'id': donation.id if donation else None,
            'donor_id': donation.donor_id if donation else None,
            'food_name': donation.food_name if donation else None,
            'food_type': donation.food_type if donation else None,
            'quantity': donation.quantity if donation else None,
            'pickup_address': donation.pickup_address if donation else None,
            'pickup_time': donation.pickup_time.isoformat() if donation and donation.pickup_time else None,
            'expiry_time': donation.expiry_time.isoformat() if donation and donation.expiry_time else None,
            'status': donation.status if donation else None,
            'donor_name': donor.name if donor else None,
            'donor_organization': donor.organization if donor else None,
            'image': f'/api/donations/uploads/{donation.image}' if donation and donation.image else None,
        } if donation else None,
        'donation_id_display': donation.id if donation else None,
        'food_name': donation.food_name if donation else None,
        'food_type': donation.food_type if donation else None,
        'quantity': donation.quantity if donation else None,
        'pickup_address': donation.pickup_address if donation else None,
        'pickup_time': donation.pickup_time.isoformat() if donation and donation.pickup_time else None,
        'expiry_time': donation.expiry_time.isoformat() if donation and donation.expiry_time else None,
        'donor_id': donation.donor_id if donation else None,
        'donor_name': donor.name if donor else None,
        'donor_organization': donor.organization if donor else None,
        'food_image': f'/api/donations/uploads/{donation.image}' if donation and donation.image else None,
    }


def _ensure_pickup_ownership(user: User, pickup: PickupRequest) -> bool:
    if user.role in {'admin', 'super_admin'}:
        return True
    if user.role == 'receiver':
        return pickup.receiver_id == user.id
    donation = pickup.donation
    return bool(donation and donation.donor_id == user.id)


@pickups_bp.route('', methods=['POST'])
@pickups_bp.route('/', methods=['POST'])
@jwt_required()
def create_pickup_request():
    user = _current_user()
    if not user:
        return _json(False, 'Unauthorized', status=401)
    if user.role != 'receiver':
        return _json(False, 'Only receivers can request pickups', status=403)
    if not user.verified:
        return _json(False, 'Please verify your email before requesting food.', status=403, code='EMAIL_UNVERIFIED')
    if user.status == 'rejected':
        return _json(False, 'Your account has been rejected by an administrator.', status=403, code='ACCOUNT_REJECTED')
    if user.status != 'approved':
        return _json(False, 'Your account is awaiting admin approval.', status=403, code='ACCOUNT_PENDING_APPROVAL')

    data = request.get_json(silent=True) or {}
    donation_id = data.get('donation_id') or data.get('donationId')
    request_message = str(data.get('request_message') or data.get('requestMessage') or '').strip() or None

    if not donation_id:
        return _json(False, 'donation_id is required', status=400)

    # SQLite needs the lock before balance reads; server databases use row locks
    # in the allocator. Both make request creation and allocation one unit.
    begin_allocation_transaction()
    donation = Donation.query.with_for_update().get(int(donation_id))
    if not donation:
        return _json(False, 'Donation not found', status=404)

    # Calculate actual remaining quantity based on approved/completed requests
    approved_pickups = PickupRequest.query.filter(
        PickupRequest.donation_id == donation.id,
        PickupRequest.status.in_(['Approved', 'Completed']),
    ).all()
    current_allocated = sum(float(p.requested_quantity or 0.0) for p in approved_pickups)
    current_remaining = max(0.0, float(donation.quantity_number or 0.0) - current_allocated)

    unit = donation.unit or 'meals'
    if donation.status in {'Completed', 'FULLY_ALLOCATED', 'Expired'} or current_remaining <= 0:
        return _json(False, 'This donation is no longer available', status=400)

    existing = PickupRequest.query.filter_by(donation_id=donation.id, receiver_id=user.id).filter(
        PickupRequest.status.notin_(['Rejected'])
    ).first()
    if existing:
        return _json(False, 'You have already requested this donation', status=400)

    try:
        requested_quantity = float(data.get('requested_quantity') or data.get('requestedQuantity') or current_remaining)
    except (TypeError, ValueError):
        return _json(False, 'Requested quantity must be a number', status=400)
    if requested_quantity <= 0:
        return _json(False, 'Requested quantity must be greater than zero', status=400)

    if requested_quantity > current_remaining:
        rem_display = int(current_remaining) if current_remaining.is_integer() else current_remaining
        return _json(False, f"Only {rem_display} {unit} are remaining for this donation.", status=400)

    pickup = PickupRequest(
        donation_id=donation.id,
        receiver_id=user.id,
        status='Pending',
        request_message=request_message,
        requested_quantity=requested_quantity,
        allocated_quantity=0,
        allocation_status='WAITING',
    )
    db.session.add(pickup)
    db.session.flush()

    # Strictly ONE conversation per donor + receiver pair: retrieve or create
    conv = Conversation.query.filter_by(
        donor_id=donation.donor_id,
        receiver_id=user.id,
    ).first()
    if not conv:
        conv = Conversation(
            donor_id=donation.donor_id,
            receiver_id=user.id,
            donation_id=donation.id,
            request_id=pickup.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.session.add(conv)
        db.session.flush()
    else:
        # Update existing conversation context to the latest donation and pickup request
        conv.donation_id = donation.id
        conv.request_id = pickup.id
        conv.updated_at = datetime.utcnow()
        db.session.flush()

    initial_msg = None
    if request_message:
        initial_msg = Message(
            conversation_id=conv.id,
            sender_id=user.id,
            receiver_id=donation.donor_id,
            donation_id=donation.id,
            pickup_id=pickup.id,
            message=request_message,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.session.add(initial_msg)
        conv.updated_at = datetime.utcnow()

    req_display = int(requested_quantity) if requested_quantity.is_integer() else requested_quantity

    # 1. Notification for donor
    donor_notification = Notification(
        user_id=donation.donor_id,
        title='New food request received!',
        message=f'New food request received! A receiver has requested your donation: {donation.food_name} ({req_display} {unit}).',
        type='pickup_requested',
        link='/donor/pickups',
    )
    db.session.add(donor_notification)

    # 2. Notification for receiver
    receiver_notification = Notification(
        user_id=user.id,
        title='Food Request Sent',
        message='Food request sent successfully! The donor will be notified.',
        type='success',
        link='/receiver/requests',
    )
    db.session.add(receiver_notification)
    db.session.commit()

    emit_notification(donor_notification)
    emit_notification(receiver_notification)
    if initial_msg:
        emit_message([donation.donor_id, user.id], initial_msg.to_dict())
    emit_pickup_update([donation.donor_id, user.id], {
        'pickup_request': _serialize_pickup(pickup),
        'status': 'Pending',
    })
    emit_dashboard_update([donation.donor_id, user.id], {
        'reason': 'pickup_requested',
        'pickup_request_id': pickup.id,
    })

    req_display = int(requested_quantity) if requested_quantity.is_integer() else requested_quantity
    return _json(
        True,
        f"Pickup request for {req_display} {unit} submitted. Waiting for donor approval.",
        {'pickup_request': _serialize_pickup(pickup)},
        status=201
    )


@pickups_bp.route('', methods=['GET'])
@pickups_bp.route('/', methods=['GET'])
@jwt_required()
def list_pickup_requests():
    user = _current_user()
    if not user:
        return _json(False, 'Unauthorized', status=401)

    q = PickupRequest.query.options(
        joinedload(PickupRequest.donation).joinedload(Donation.donor),
        joinedload(PickupRequest.receiver),
    ).order_by(PickupRequest.requested_at.desc())

    if user.role == 'receiver':
        q = q.filter(PickupRequest.receiver_id == user.id)
    elif user.role == 'donor':
        q = q.join(Donation).filter(Donation.donor_id == user.id)

    status_filter = request.args.get('status')
    if status_filter:
        q = q.filter(PickupRequest.status == status_filter)

    pickups = q.all()
    return _json(True, 'Operation Successful', {'pickup_requests': [_serialize_pickup(p) for p in pickups]})


@pickups_bp.route('/<int:pickup_id>', methods=['PUT'])
@jwt_required()
def update_pickup_request(pickup_id: int):
    user = _current_user()
    if not user:
        return _json(False, 'Unauthorized', status=401)

    pickup = PickupRequest.query.options(
        joinedload(PickupRequest.donation).joinedload(Donation.donor),
        joinedload(PickupRequest.receiver),
    ).get(pickup_id)
    if not pickup:
        return _json(False, 'Pickup request not found', status=404)
    if not _ensure_pickup_ownership(user, pickup):
        return _json(False, 'Forbidden', status=403)
    if user.role in {'donor', 'receiver'}:
        if not user.verified:
            return _json(False, 'Please verify your email.', status=403, code='EMAIL_UNVERIFIED')
        if user.status != 'approved':
            return _json(False, 'Your account is awaiting admin approval.', status=403, code='ACCOUNT_PENDING_APPROVAL')

    data = request.get_json(silent=True) or {}
    new_status = str(data.get('status') or '').strip()

    if not new_status:
        return _json(False, 'status is required', status=400)

    if user.role == 'receiver':
        if new_status != 'Completed':
            return _json(False, 'Receivers can only mark approved pickups as completed', status=403)
        if pickup.status != 'Approved':
            return _json(False, 'Only approved pickups can be marked as completed', status=400)
        pickup.status = 'Completed'
        pickup.completed_at = datetime.utcnow()
        if pickup.donation:
            recalculate_donation_state(pickup.donation)
            notification = Notification(
                user_id=pickup.donation.donor_id,
                title='Pickup Completed',
                message=f'{user.organization or user.name} marked {pickup.donation.food_name} as completed.',
                type='pickup_completed',
                link='/donor/pickups',
            )
            db.session.add(notification)
        else:
            notification = None
        db.session.commit()
        if notification:
            emit_notification(notification)
        emit_pickup_update([pickup.receiver_id, pickup.donation.donor_id if pickup.donation else pickup.receiver_id], {
            'pickup_request': _serialize_pickup(pickup),
            'status': 'Completed',
        })
        emit_dashboard_update([pickup.receiver_id, pickup.donation.donor_id if pickup.donation else pickup.receiver_id], {
            'reason': 'pickup_completed',
            'pickup_request_id': pickup.id,
        })
        return _json(True, 'Pickup marked as completed', {'pickup_request': _serialize_pickup(pickup)})

    if new_status not in {'Approved', 'Rejected'}:
        return _json(False, 'status must be Approved or Rejected', status=400)
    if pickup.status != 'Pending':
        return _json(False, 'Only pending pickups can be updated', status=400)

    if new_status == 'Approved':
        donation = Donation.query.with_for_update().get(pickup.donation_id)
        if not donation:
            return _json(False, 'Donation not found', status=404)

        # Calculate current remaining from already approved or completed pickups (excluding this one)
        approved_pickups = PickupRequest.query.filter(
            PickupRequest.donation_id == donation.id,
            PickupRequest.id != pickup.id,
            PickupRequest.status.in_(['Approved', 'Completed']),
        ).all()
        current_allocated = sum(float(p.requested_quantity or 0.0) for p in approved_pickups)
        current_remaining = max(0.0, float(donation.quantity_number or 0.0) - current_allocated)

        needed = float(pickup.requested_quantity or 0.0)
        unit = donation.unit or 'meals'
        if needed > current_remaining:
            rem_display = int(current_remaining) if current_remaining.is_integer() else current_remaining
            return _json(False, f"Only {rem_display} {unit} are remaining for this donation.", status=400)

        pickup.status = 'Approved'
        pickup.approved_at = datetime.utcnow()
        pickup.allocated_quantity = needed
        pickup.allocation_status = 'FULLY_ALLOCATED'

        new_remaining = max(0.0, current_remaining - needed)
        donation.remaining_quantity = new_remaining
        if new_remaining <= 0.0:
            donation.status = 'FULLY_ALLOCATED'
        else:
            donation.status = 'PARTIALLY_ALLOCATED'

        db.session.add(Allocation(
            pickup_request_id=pickup.id,
            donation_id=donation.id,
            receiver_id=pickup.receiver_id,
            quantity=needed,
        ))
    else:
        pickup.status = 'Rejected'
        pickup.allocated_quantity = 0
        pickup.allocation_status = 'WAITING'
        donation = Donation.query.with_for_update().get(pickup.donation_id)
        if donation:
            recalculate_donation_state(donation)

    db.session.commit()

    if new_status == 'Approved':
        donor_id = pickup.donation.donor_id if pickup.donation else user.id

        # 1. Receiver notification
        approval_notif = Notification(
            user_id=pickup.receiver_id,
            title='Request Accepted!',
            message='Your food request has been accepted! Please proceed to collect the food.',
            type='pickup_approved',
            link='/receiver/schedule',
        )
        db.session.add(approval_notif)

        # 2. Donor notification
        donor_notif = Notification(
            user_id=donor_id,
            title='Request Accepted',
            message='Request accepted successfully. The receiver has been notified.',
            type='success',
            link='/donor/pickups',
        )
        db.session.add(donor_notif)
        db.session.commit()

        emit_notification(approval_notif)
        emit_notification(donor_notif)
        generate_qr_token(pickup.id)
        emit_pickup_update([pickup.receiver_id, donor_id], {
            'pickup_request': _serialize_pickup(pickup),
            'status': 'Approved',
        })
        emit_dashboard_update([pickup.receiver_id, donor_id], {
            'reason': 'pickup_approved',
            'pickup_request_id': pickup.id,
        })
    else:
        rejection_notif = Notification(
            user_id=pickup.receiver_id,
            title='Request Update',
            message='Your request requires attention. Please check the latest status.',
            type='pickup_rejected',
            link='/receiver/requests',
        )
        db.session.add(rejection_notif)
        db.session.commit()
        emit_notification(rejection_notif)
        emit_pickup_update([pickup.receiver_id, pickup.donation.donor_id if pickup.donation else pickup.receiver_id], {
            'pickup_request': _serialize_pickup(pickup),
            'status': 'Rejected',
        })
        emit_dashboard_update([pickup.receiver_id, pickup.donation.donor_id if pickup.donation else pickup.receiver_id], {
            'reason': 'pickup_rejected',
            'pickup_request_id': pickup.id,
        })
    return _json(True, 'Pickup request updated successfully', {'pickup_request': _serialize_pickup(pickup)})


@pickups_bp.route('/<int:pickup_id>/accept', methods=['POST'])
@jwt_required()
def accept_pickup(pickup_id: int):
    user = _current_user()
    if not user or user.role != 'donor':
        return _json(False, 'Only donors can accept pickup requests', status=403)
    return update_pickup_request(pickup_id)


@pickups_bp.route('/<int:pickup_id>/decline', methods=['POST'])
@jwt_required()
def decline_pickup(pickup_id: int):
    user = _current_user()
    if not user or user.role != 'donor':
        return _json(False, 'Only donors can decline pickup requests', status=403)
    # Inject status: Rejected
    request._cached_json = {'status': 'Rejected'}
    return update_pickup_request(pickup_id)


@pickups_bp.route('/<int:pickup_id>/confirm-receipt', methods=['POST'])
@jwt_required()
def confirm_pickup_receipt(pickup_id: int):
    """Receiver confirms that they have physically received the food donation."""
    user = _current_user()
    if not user:
        return _json(False, 'Authentication required', status=401)
    if user.role != 'receiver':
        return _json(False, 'Only receivers can confirm food receipt', status=403)
    if not user.verified:
        return _json(False, 'Please verify your email.', status=403, code='EMAIL_UNVERIFIED')
    if user.status != 'approved':
        return _json(False, 'Your account is awaiting admin approval.', status=403, code='ACCOUNT_PENDING_APPROVAL')

    pickup = PickupRequest.query.get(pickup_id)
    if not pickup:
        return _json(False, 'Pickup request not found', status=404)

    if pickup.receiver_id != user.id:
        return _json(False, 'Only the requesting receiver can confirm food receipt', status=403)

    if pickup.status == 'Completed':
        return _json(False, 'Food receipt has already been confirmed for this pickup', status=400)

    # Transition to completed
    pickup.status = 'Completed'
    pickup.completed_at = datetime.utcnow()
    donation = pickup.donation
    if donation:
        donation = Donation.query.with_for_update().get(pickup.donation_id)
        recalculate_donation_state(donation)
        donor_id = donation.donor_id
        food_name = donation.food_name
        quantity_str = f"{int(pickup.allocated_quantity or pickup.requested_quantity or 0)} {donation.unit or 'meals'}"
    else:
        donor_id = None
        food_name = 'Donation'
        quantity_str = f"{int(pickup.allocated_quantity or pickup.requested_quantity or 0)} servings"

    db.session.commit()

    # 1. Notification for receiver
    receiver_notif = Notification(
        user_id=user.id,
        title='Food Marked as Collected',
        message='Food marked as collected successfully. The donor has been notified.',
        type='success',
        link='/receiver/requests',
    )
    db.session.add(receiver_notif)

    if donor_id:
        # 2. Notification for donor
        notif = Notification(
            user_id=donor_id,
            title='Food Successfully Received!',
            message='Food successfully received! Your donation has been collected by the receiver. Thank you for helping reduce food waste!',
            type='food_received',
            link='/donor/donations',
        )
        db.session.add(notif)
        db.session.commit()
        emit_notification(notif)
        emit_notification(receiver_notif)

        # 3. Emit instant real-time celebration event
        from extensions import socketio
        payload = {
            'event_id': f"food_received_{pickup.id}",
            'transaction_id': pickup.id,
            'donation_id': pickup.donation_id,
            'food_name': food_name,
            'quantity': quantity_str,
            'quantity_number': pickup.allocated_quantity or pickup.requested_quantity or (donation.quantity_number if donation else 0),
            'receiver_id': user.id,
            'receiver_name': user.name,
            'receiver_organization': user.organization or user.name,
            'received_at': datetime.utcnow().isoformat(),
            'message': f"Your donation of {quantity_str} was successfully received by {user.organization or user.name}."
        }
        socketio.emit('food_received', payload, room=f"user_{donor_id}")

        emit_pickup_update([user.id, donor_id], {
            'pickup_request': _serialize_pickup(pickup),
            'status': 'Completed',
        })
        emit_dashboard_update([user.id, donor_id], {
            'reason': 'pickup_completed',
            'pickup_request_id': pickup.id,
        })

    return _json(True, 'Food receipt confirmed! The donor has received immediate acknowledgment.', {
        'pickup_request': _serialize_pickup(pickup)
    })

