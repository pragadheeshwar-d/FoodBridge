"""
Food Needs REST API - Two-way bridge routes allowing Receivers to post food needs
and Donors to discover and respond to them.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import FoodNeed, FoodNeedResponse, User, Notification, Message
from services.realtime import emit_notification, emit_message

needs_bp = Blueprint('food_needs', __name__)


def _require_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return None, (jsonify({'success': False, 'message': 'User not found'}), 404)
    if not user.verified:
        return None, (jsonify({'success': False, 'message': 'Please verify your email', 'code': 'EMAIL_UNVERIFIED'}), 403)
    if user.status == 'rejected':
        return None, (jsonify({'success': False, 'message': 'Your account has been rejected by an administrator.', 'code': 'ACCOUNT_REJECTED'}), 403)
    if user.status != 'approved':
        return None, (jsonify({'success': False, 'message': 'Account awaiting admin approval', 'code': 'ACCOUNT_PENDING_APPROVAL'}), 403)
    return user, None


@needs_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def list_food_needs():
    """List open food needs with optional filters."""
    urgency = request.args.get('urgency')
    food_type = request.args.get('food_type')
    search = request.args.get('search', '').strip().lower()
    status_filter = request.args.get('status', 'active').strip().lower()

    query = FoodNeed.query

    if status_filter == 'active':
        query = query.filter(FoodNeed.status.in_(['Open', 'Partially Fulfilled']))
    elif status_filter and status_filter != 'all':
        query = query.filter(db.func.lower(FoodNeed.status) == status_filter)

    if urgency and urgency != 'all':
        query = query.filter(FoodNeed.urgency.ilike(f'%{urgency}%'))

    if food_type and food_type != 'all':
        query = query.filter(FoodNeed.food_type.ilike(f'%{food_type}%'))

    if search:
        query = query.filter(
            db.or_(
                FoodNeed.food_name.ilike(f'%{search}%'),
                FoodNeed.food_type.ilike(f'%{search}%'),
                FoodNeed.location.ilike(f'%{search}%'),
                FoodNeed.additional_notes.ilike(f'%{search}%')
            )
        )

    # Sort by urgency high-to-low then required_time
    urgency_order = db.case(
        (FoodNeed.urgency == 'Critical', 1),
        (FoodNeed.urgency == 'High', 2),
        (FoodNeed.urgency == 'Medium', 3),
        (FoodNeed.urgency == 'Low', 4),
        else_=5
    )

    needs = query.order_by(urgency_order, FoodNeed.required_time.asc(), FoodNeed.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [n.to_dict() for n in needs]
    }), 200


@needs_bp.route('/my', methods=['GET'])
@jwt_required()
def my_food_needs():
    """List food needs created by current receiver."""
    user, err = _require_user()
    if err:
        return err

    needs = FoodNeed.query.filter_by(receiver_id=user.id).order_by(FoodNeed.created_at.desc()).all()
    return jsonify({
        'success': True,
        'data': [n.to_dict() for n in needs]
    }), 200


@needs_bp.route('/<int:need_id>', methods=['GET'])
@jwt_required(optional=True)
def get_food_need(need_id):
    """Get single food need detail."""
    need = FoodNeed.query.get(need_id)
    if not need:
        return jsonify({'success': False, 'message': 'Food need not found'}), 404

    return jsonify({
        'success': True,
        'data': need.to_dict()
    }), 200


@needs_bp.route('', methods=['POST'])
@jwt_required()
def create_food_need():
    """Receiver posts a new food need."""
    user, err = _require_user()
    if err:
        return err

    if user.role != 'receiver':
        return jsonify({'success': False, 'message': 'Only verified NGOs and community receivers can post food needs'}), 403
    if not user.verified or user.status != 'approved':
        return jsonify({'success': False, 'message': 'Your account is awaiting admin approval.'}), 403

    data = request.get_json(silent=True) or {}
    food_type = (data.get('food_type') or data.get('foodType') or '').strip()
    food_name = (data.get('food_name') or data.get('foodName') or food_type).strip()
    required_quantity = str(data.get('required_quantity') or data.get('requiredQuantity') or '').strip()
    quantity_num = float(data.get('quantity_number') or data.get('servings') or 1.0)
    unit = data.get('unit') or 'servings'
    urgency = data.get('urgency') or 'Medium'
    location = (data.get('location') or data.get('address') or '').strip()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    required_time_str = data.get('required_time') or data.get('requiredTime')
    additional_notes = (data.get('additional_notes') or data.get('notes') or '').strip()

    if not food_type or not required_quantity:
        return jsonify({'success': False, 'message': 'Food type and required quantity are required'}), 400

    if not location:
        return jsonify({'success': False, 'message': 'Food need location is required. Please specify delivery address.'}), 400

    required_time = datetime.utcnow()
    if required_time_str:
        try:
            required_time = datetime.fromisoformat(required_time_str.replace('Z', '+00:00'))
        except Exception:
            pass

    need = FoodNeed(
        receiver_id=user.id,
        food_type=food_type,
        food_name=food_name,
        required_quantity=required_quantity if 'serving' in required_quantity.lower() or 'kg' in required_quantity.lower() or 'meal' in required_quantity.lower() else f"{required_quantity} {unit}",
        quantity_number=quantity_num,
        remaining_quantity=quantity_num,
        unit=unit,
        urgency=urgency,
        location=location,
        latitude=latitude,
        longitude=longitude,
        required_time=required_time,
        additional_notes=additional_notes or None,
        status='Open',
    )
    db.session.add(need)
    db.session.flush()

    # 1. Receiver confirmation notification
    receiver_notif = Notification(
        user_id=user.id,
        title='Food Requirement Posted',
        message='Food requirement posted successfully! Nearby donors will be notified.',
        type='success',
        link='/receiver/need-food',
    )
    db.session.add(receiver_notif)

    # 2. Notifications to registered donors
    donors = User.query.filter_by(role='donor', verified=True).all()
    notifications = [receiver_notif]
    for donor in donors:
        d_notif = Notification(
            user_id=donor.id,
            title='New food requirement nearby!',
            message=f"New food requirement nearby! A receiver is currently looking for food: {need.food_name or need.food_type} ({need.required_quantity}).",
            type='info',
            link='/donor/needs',
        )
        db.session.add(d_notif)
        notifications.append(d_notif)
    db.session.commit()

    for notif in notifications:
        emit_notification(notif)

    return jsonify({
        'success': True,
        'message': 'Food requirement posted successfully! Nearby donors will be notified.',
        'data': need.to_dict()
    }), 201


@needs_bp.route('/<int:need_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_need(need_id):
    """Donor responds with an offer to provide food for a receiver need."""
    user, err = _require_user()
    if err:
        return err

    if user.role != 'donor':
        return jsonify({'success': False, 'message': 'Only registered donors can offer food in response to needs'}), 403

    need = FoodNeed.query.get(need_id)
    if not need or need.status not in ('Open', 'Partially Fulfilled'):
        return jsonify({'success': False, 'message': 'Food need is not currently active'}), 400

    data = request.get_json(silent=True) or {}
    offered_quantity = float(data.get('offered_quantity') or data.get('offeredQuantity') or need.quantity_number or 1.0)
    delivery_type = data.get('delivery_type') or data.get('deliveryType') or 'Pickup by NGO'
    message_text = (data.get('message') or '').strip()

    response = FoodNeedResponse(
        need_id=need.id,
        donor_id=user.id,
        offered_quantity=offered_quantity,
        unit=need.unit or 'servings',
        delivery_type=delivery_type,
        message=message_text or f"I can provide {offered_quantity} {need.unit} for your need.",
        status='Pending'
    )
    db.session.add(response)

    # Also initiate a message in the chat conversation
    chat_msg = Message(
        sender_id=user.id,
        receiver_id=need.receiver_id,
        need_id=need.id,
        message=f"🍱 Food Offer for Need '{need.food_name or need.food_type}': {offered_quantity} {need.unit}. {message_text}".strip()
    )
    db.session.add(chat_msg)

    # 1. Notify receiver
    notif = Notification(
        user_id=need.receiver_id,
        title='Donor Responded to Food Need',
        message='A donor has responded to your food requirement! Check the available donation.',
        type='info',
        link='/receiver/need-food',
    )
    db.session.add(notif)

    # 2. Notify donor confirmation
    donor_notif = Notification(
        user_id=user.id,
        title='Food Offer Sent',
        message='Food offer sent successfully! The receiver has been notified.',
        type='success',
        link='/donor/needs',
    )
    db.session.add(donor_notif)
    db.session.commit()

    emit_notification(notif)
    emit_notification(donor_notif)
    emit_message([user.id, need.receiver_id], chat_msg.to_dict())

    return jsonify({
        'success': True,
        'message': f'Your offer of {offered_quantity} {need.unit} was sent to the receiver.',
        'data': response.to_dict()
    }), 201


@needs_bp.route('/responses/<int:response_id>/accept', methods=['POST'])
@jwt_required()
def accept_need_response(response_id):
    """Receiver accepts a donor's food offer."""
    user, err = _require_user()
    if err:
        return err

    response = FoodNeedResponse.query.get(response_id)
    if not response:
        return jsonify({'success': False, 'message': 'Response not found'}), 404

    need = response.need
    if need.receiver_id != user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    response.status = 'Accepted'

    # Deduct quantity from remaining
    rem = (need.remaining_quantity or need.quantity_number) - response.offered_quantity
    need.remaining_quantity = max(0, rem)
    if need.remaining_quantity == 0:
        need.status = 'Fulfilled'
    else:
        need.status = 'Partially Fulfilled'

    # Notify donor
    notif = Notification(
        user_id=response.donor_id,
        title='Food Offer Accepted! 🎉',
        message=f"{user.organization or user.name} accepted your offer of {response.offered_quantity} {response.unit}.",
        type='pickup_approved',
        link='/donor/needs'
    )
    db.session.add(notif)
    db.session.commit()

    emit_notification(notif)

    return jsonify({
        'success': True,
        'message': 'Offer accepted! Communication channel is open for pickup coordination.',
        'data': response.to_dict()
    }), 200


@needs_bp.route('/responses/<int:response_id>/decline', methods=['POST'])
@jwt_required()
def decline_need_response(response_id):
    """Receiver declines a donor's food offer."""
    user, err = _require_user()
    if err:
        return err

    response = FoodNeedResponse.query.get(response_id)
    if not response:
        return jsonify({'success': False, 'message': 'Response not found'}), 404

    need = response.need
    if need.receiver_id != user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    response.status = 'Declined'
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Offer declined.',
        'data': response.to_dict()
    }), 200


@needs_bp.route('/responses/<int:response_id>/confirm-receipt', methods=['POST'])
@jwt_required()
def confirm_need_response_receipt(response_id):
    """Receiver confirms that the food offered by a donor was physically received."""
    user, err = _require_user()
    if err:
        return err

    response = FoodNeedResponse.query.get(response_id)
    if not response:
        return jsonify({'success': False, 'message': 'Offer response not found'}), 404

    need = response.need
    if not need or need.receiver_id != user.id:
        return jsonify({'success': False, 'message': 'Only the requesting receiver can confirm receipt'}), 403

    if response.status == 'Completed':
        return jsonify({'success': False, 'message': 'Food receipt has already been confirmed'}), 400

    response.status = 'Completed'
    if need.remaining_quantity <= 0:
        need.status = 'Fulfilled'

    # 1. Receiver notification
    receiver_notif = Notification(
        user_id=user.id,
        title='Food Marked as Collected',
        message='Food marked as collected successfully. The donor has been notified.',
        type='success',
        link='/receiver/need-food',
    )
    db.session.add(receiver_notif)

    # 2. Persistent notification to donor
    notif = Notification(
        user_id=response.donor_id,
        title='Food Successfully Received!',
        message='Food successfully received! Your donation has been collected by the receiver. Thank you for helping reduce food waste!',
        type='food_received',
        link='/donor/history',
    )
    db.session.add(notif)
    db.session.commit()
    emit_notification(receiver_notif)
    emit_notification(notif)

    # Real-time celebration event to donor
    from extensions import socketio
    payload = {
        'event_id': f"need_response_{response.id}",
        'transaction_id': response.id,
        'food_name': need.food_name,
        'quantity': f"{int(response.offered_quantity)} {response.unit}",
        'quantity_number': response.offered_quantity,
        'receiver_name': user.name,
        'receiver_organization': user.organization or user.name,
        'received_at': datetime.utcnow().isoformat(),
        'message': f"Your donation of {int(response.offered_quantity)} {response.unit} was successfully received by {user.organization or user.name}."
    }
    socketio.emit('food_received', payload, room=f"user_{response.donor_id}")

    return jsonify({
        'success': True,
        'message': 'Food receipt confirmed successfully! Donor has been notified.',
        'data': response.to_dict()
    }), 200


@needs_bp.route('/<int:need_id>', methods=['DELETE'])
@jwt_required()
def cancel_food_need(need_id):
    """Receiver cancels their food need."""
    user, err = _require_user()
    if err:
        return err

    need = FoodNeed.query.get(need_id)
    if not need or need.receiver_id != user.id:
        return jsonify({'success': False, 'message': 'Need not found or unauthorized'}), 404

    need.status = 'Cancelled'
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Food need cancelled.',
        'data': {'id': need.id}
    }), 200
