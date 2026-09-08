"""
Dashboard analytics routes for donor, receiver, and admin.
"""
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from extensions import db
from models import User, Donation, PickupRequest, Certificate, Notification, OrganizationVerification

dashboard_bp = Blueprint('dashboard', __name__)


def _month_range(months_ago: int):
    """Return (start, end) datetime for a calendar month relative to today."""
    today = datetime.utcnow()
    # Walk back months_ago months
    month = today.month - months_ago
    year = today.year
    while month <= 0:
        month += 12
        year -= 1
    from calendar import monthrange
    _, last_day = monthrange(year, month)
    start = datetime(year, month, 1, 0, 0, 0)
    end = datetime(year, month, last_day, 23, 59, 59)
    return start, end


def _parse_qty(qty_str):
    """Try to extract a float from a quantity string like '50 meals' or '10 kg'."""
    try:
        return float(str(qty_str).split()[0])
    except (ValueError, IndexError, AttributeError):
        return 1.0


def _meals_from_donation(donation: Donation) -> int:
    if donation.unit == 'kg':
        return int((donation.quantity_number or _parse_qty(donation.quantity)) * 2)
    return int(donation.quantity_number or _parse_qty(donation.quantity))


def _kg_prevented_from_donation(donation: Donation) -> float:
    qty = donation.quantity_number or _parse_qty(donation.quantity)
    return qty * (0.5 if donation.unit == 'meals' else 1)


def _city_from_address(address: str | None) -> str | None:
    if not address:
        return None
    parts = [part.strip() for part in address.split(',') if part.strip()]
    if not parts:
        return None
    if len(parts) == 1:
        return parts[0]
    last = parts[-1].lower()
    if last in {'india', 'tamil nadu', 'tn'} and len(parts) > 1:
        return parts[-2]
    return parts[-1]


@dashboard_bp.route('/public', methods=['GET'])
def public_dashboard():
    """Public homepage metrics derived from live database state."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    donations = Donation.query.all()
    completed_donations = [d for d in donations if d.status == 'Completed']
    available_donations = [d for d in donations if d.status in ('Available', 'AVAILABLE', 'PARTIALLY_ALLOCATED', 'partially_allocated') and (d.remaining_quantity or 0) > 0 and d.expiry_time > now]
    completed_pickups = PickupRequest.query.filter_by(status='Completed').all()

    meals_saved = sum(_meals_from_donation(d) for d in completed_donations)
    food_waste_prevented = sum(_kg_prevented_from_donation(d) for d in completed_donations)

    donor_orgs = {
        d.organization.strip()
        for d in User.query.filter_by(role='donor').all()
        if d.organization and d.organization.strip()
    }
    receiver_orgs = {
        u.organization.strip()
        for u in User.query.filter_by(role='receiver').filter(User.organization.isnot(None)).all()
        if u.organization and u.organization.strip()
    }
    cities = {
        city
        for city in (_city_from_address(u.address) for u in User.query.filter(User.address.isnot(None)).all())
        if city
    }

    todays_donations = Donation.query.filter(Donation.created_at >= today_start).count()

    return jsonify({
        'stats': {
            'meals_saved': meals_saved,
            'active_donations': len(available_donations),
            'daily_people_fed': meals_saved,
            'food_waste_prevented': round(food_waste_prevented, 1),
            'restaurants_connected': len(donor_orgs),
            'ngos_connected': len(receiver_orgs),
            'cities_covered': len(cities),
            'successful_deliveries': len(completed_pickups),
            'todays_donations': todays_donations,
            'active_users': User.query.count(),
        }
    }), 200


# ─── Donor Dashboard ──────────────────────────────────────────────────────────

@dashboard_bp.route('/donor', methods=['GET'])
@jwt_required()
def donor_dashboard():
    user_id = int(get_jwt_identity())
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start, month_end = _month_range(0)

    # Today's donations
    todays_donations = Donation.query.filter(
        Donation.donor_id == user_id,
        Donation.created_at >= today_start
    ).count()

    # All donor donation IDs
    donor_donations = Donation.query.options(joinedload(Donation.donor)).filter_by(donor_id=user_id).all()
    donation_ids = [d.id for d in donor_donations]

    # Pending pickups
    pending_pickups = PickupRequest.query.filter(
        PickupRequest.donation_id.in_(donation_ids),
        PickupRequest.status == 'Pending'
    ).count() if donation_ids else 0

    # Completed donations
    completed_donations = [d for d in donor_donations if d.status == 'Completed']
    completed_donations_month = [
        d for d in completed_donations
        if d.created_at and month_start <= d.created_at <= month_end
    ]
    expiring_soon = Donation.query.filter(
        Donation.donor_id == user_id,
        Donation.status.in_(['Available', 'Requested', 'Approved']),
        Donation.expiry_time > datetime.utcnow(),
        Donation.expiry_time <= datetime.utcnow() + timedelta(hours=2),
    ).count()

    # Meals donated (estimate: quantity_number or parse from string)
    meals_donated = sum(
        int(d.quantity_number * 2) if d.unit == 'kg' else int(d.quantity_number or 1)
        for d in completed_donations
    )
    meals_donated_month = sum(
        int(d.quantity_number * 2) if d.unit == 'kg' else int(d.quantity_number or 1)
        for d in completed_donations_month
    )

    # Food waste prevented (kg)
    food_waste_prevented = sum(
        (d.quantity_number or _parse_qty(d.quantity)) * (0.5 if d.unit == 'meals' else 1)
        for d in completed_donations
    )

    carbon_reduced = round(food_waste_prevented * 2.5, 1)
    certificates = Certificate.query.filter_by(donor_id=user_id).count()

    # Monthly donations (last 6 months)
    monthly_data = []
    for i in range(5, -1, -1):
        start, end = _month_range(i)
        count = Donation.query.filter(
            Donation.donor_id == user_id,
            Donation.created_at >= start,
            Donation.created_at <= end
        ).count()
        monthly_data.append({'month': start.strftime('%b'), 'donations': count, 'meals': count * 10})

    # Food type breakdown
    food_types = (
        db.session.query(Donation.food_type, func.count(Donation.id))
        .filter(Donation.donor_id == user_id)
        .group_by(Donation.food_type)
        .all()
    )
    food_categories = [{'name': ft[0], 'value': ft[1]} for ft in food_types]

    # Recent donations
    recent = (
        Donation.query.options(joinedload(Donation.donor))
        .filter_by(donor_id=user_id)
        .order_by(Donation.created_at.desc())
        .limit(10)
        .all()
    )

    # Recent pickup requests (for the donor's donations)
    recent_pickups = (
        PickupRequest.query.options(
            joinedload(PickupRequest.donation).joinedload(Donation.donor),
            joinedload(PickupRequest.receiver),
        )
        .filter(PickupRequest.donation_id.in_(donation_ids))
        .order_by(PickupRequest.requested_at.desc())
        .limit(10)
        .all()
    ) if donation_ids else []
    recent_pickups_data = []
    for pr in recent_pickups:
        d = pr.to_dict()
        d['donation'] = pr.donation.to_dict() if pr.donation else None
        recent_pickups_data.append(d)

    return jsonify({
        'stats': {
            'todays_donations': todays_donations,
            'meals_donated_month': meals_donated_month,
            'meals_donated': meals_donated,
            'pending_pickups': pending_pickups,
            'food_waste_prevented': round(food_waste_prevented, 1),
            'carbon_reduced': carbon_reduced,
            'certificates': certificates,
            'total_donations': len(donor_donations),
            'expiring_soon': expiring_soon,
        },
        'monthly_data': monthly_data,
        'food_categories': food_categories,
        'recent_donations': [d.to_dict(include_requests=True) for d in recent],
        'recent_pickups': recent_pickups_data,
    }), 200


# ─── Receiver Dashboard ───────────────────────────────────────────────────────

@dashboard_bp.route('/receiver', methods=['GET'])
@jwt_required()
def receiver_dashboard():
    user_id = int(get_jwt_identity())
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    now = datetime.utcnow()
    month_start, month_end = _month_range(0)

    available_donations = Donation.query.filter(
        Donation.status.in_(['Available', 'AVAILABLE', 'PARTIALLY_ALLOCATED', 'partially_allocated']),
        Donation.remaining_quantity > 0,
        Donation.expiry_time > now
    ).count()

    active_requests = PickupRequest.query.filter(
        PickupRequest.receiver_id == user_id,
        PickupRequest.status.in_(['Pending', 'Approved'])
    ).count()

    todays_pickups = PickupRequest.query.filter(
        PickupRequest.receiver_id == user_id,
        PickupRequest.status == 'Approved',
        PickupRequest.approved_at >= today_start
    ).count()

    completed_prs = PickupRequest.query.options(
        joinedload(PickupRequest.donation).joinedload(Donation.donor),
        joinedload(PickupRequest.receiver),
    ).filter(
        PickupRequest.receiver_id == user_id,
        PickupRequest.status == 'Completed'
    ).all()
    completed_prs_month = [
        pr for pr in completed_prs
        if pr.completed_at and month_start <= pr.completed_at <= month_end
    ]

    donation_ids_completed = [pr.donation_id for pr in completed_prs]
    completed_donations = Donation.query.filter(Donation.id.in_(donation_ids_completed)).all() \
        if donation_ids_completed else []
    donation_ids_completed_month = [pr.donation_id for pr in completed_prs_month]
    completed_donations_month = Donation.query.filter(Donation.id.in_(donation_ids_completed_month)).all() \
        if donation_ids_completed_month else []

    meals_received = sum(
        int(d.quantity_number * 2) if d.unit == 'kg' else int(d.quantity_number or 1)
        for d in completed_donations
    )
    meals_received_month = sum(
        int(d.quantity_number * 2) if d.unit == 'kg' else int(d.quantity_number or 1)
        for d in completed_donations_month
    )
    food_waste_prevented = sum(
        (d.quantity_number or _parse_qty(d.quantity)) * (0.5 if d.unit == 'meals' else 1)
        for d in completed_donations
    )
    food_waste_prevented_month = sum(
        (d.quantity_number or _parse_qty(d.quantity)) * (0.5 if d.unit == 'meals' else 1)
        for d in completed_donations_month
    )
    carbon_reduced = round(food_waste_prevented * 2.5, 1)
    carbon_reduced_month = round(food_waste_prevented_month * 2.5, 1)

    # Monthly pickups
    monthly_data = []
    for i in range(5, -1, -1):
        start, end = _month_range(i)
        count = PickupRequest.query.filter(
            PickupRequest.receiver_id == user_id,
            PickupRequest.status == 'Completed',
            PickupRequest.completed_at >= start,
            PickupRequest.completed_at <= end
        ).count()
        monthly_data.append({'month': start.strftime('%b'), 'pickups': count})

    recent_prs = (
        PickupRequest.query.options(
            joinedload(PickupRequest.donation).joinedload(Donation.donor),
            joinedload(PickupRequest.receiver),
        )
        .filter_by(receiver_id=user_id)
        .order_by(PickupRequest.requested_at.desc())
        .limit(10)
        .all()
    )
    recent_data = []
    for pr in recent_prs:
        d = pr.to_dict()
        d['donation'] = pr.donation.to_dict() if pr.donation else None
        recent_data.append(d)

    # Acceptance rate
    total = PickupRequest.query.filter_by(receiver_id=user_id).count()
    accepted = PickupRequest.query.filter(
        PickupRequest.receiver_id == user_id,
        PickupRequest.status.in_(['Approved', 'Completed'])
    ).count()
    acceptance_rate = round((accepted / total) * 100) if total > 0 else 0

    return jsonify({
        'stats': {
            'available_donations': available_donations,
            'active_requests': active_requests,
            'todays_pickups': todays_pickups,
            'meals_received_month': meals_received_month,
            'meals_received': meals_received,
            'food_waste_prevented': round(food_waste_prevented, 1),
            'food_waste_prevented_month': round(food_waste_prevented_month, 1),
            'carbon_reduced': carbon_reduced,
            'carbon_reduced_month': carbon_reduced_month,
            'total_pickups': len(completed_prs),
            'acceptance_rate': acceptance_rate,
        },
        'monthly_data': monthly_data,
        'recent_requests': recent_data,
    }), 200


# ─── Admin Dashboard ──────────────────────────────────────────────────────────

@dashboard_bp.route('/admin', methods=['GET'])
@jwt_required()
def admin_dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ('admin', 'super_admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    status_filter = request.args.get('status')

    total_users = User.query.count()
    total_donors = User.query.filter_by(role='donor').count()
    total_receivers = User.query.filter_by(role='receiver').count()
    total_donations = Donation.query.count()
    total_pickups = PickupRequest.query.count()
    completed_pickups = PickupRequest.query.filter_by(status='Completed').count()
    pending_approvals_users = User.query.filter_by(status='pending').count()
    pending_pickup_approvals = PickupRequest.query.filter_by(status='Pending').count()
    pending_verifications = OrganizationVerification.query.filter_by(verification_status='PENDING').count()

    completed_donations = Donation.query.filter_by(status='Completed').all()
    meals_saved = sum(
        int(d.quantity_number * 2) if d.unit == 'kg' else int(d.quantity_number or 1)
        for d in completed_donations
    )
    food_waste_prevented = sum(
        (d.quantity_number or _parse_qty(d.quantity)) * (0.5 if d.unit == 'meals' else 1)
        for d in completed_donations
    )

    # Monthly data
    monthly_data = []
    for i in range(5, -1, -1):
        start, end = _month_range(i)
        d_count = Donation.query.filter(
            Donation.created_at >= start,
            Donation.created_at <= end
        ).count()
        p_count = PickupRequest.query.filter(
            PickupRequest.requested_at >= start,
            PickupRequest.requested_at <= end
        ).count()
        monthly_data.append({'month': start.strftime('%b'), 'donations': d_count, 'pickups': p_count})

    # Top donors by completed donations
    top_donors_raw = (
        db.session.query(User.id, User.name, User.organization, func.count(Donation.id).label('cnt'))
        .join(Donation, Donation.donor_id == User.id)
        .filter(Donation.status == 'Completed')
        .group_by(User.id)
        .order_by(func.count(Donation.id).desc())
        .limit(5)
        .all()
    )
    top_donors = [
        {'name': r.organization or r.name, 'meals': r.cnt * 10}
        for r in top_donors_raw
    ]

    # Users listing (filtered)
    users_q = User.query
    if status_filter:
        users_q = users_q.filter_by(status=status_filter)
    recent_users = users_q.order_by(User.created_at.desc()).limit(50).all()
    recent_donations = Donation.query.options(joinedload(Donation.donor)).order_by(Donation.created_at.desc()).limit(20).all()

    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_donors': total_donors,
            'total_receivers': total_receivers,
            'total_donations': total_donations,
            'total_pickups': total_pickups,
            'completed_pickups': completed_pickups,
            'meals_saved': meals_saved,
            'pending_approvals_users': pending_approvals_users,
            'pending_pickup_approvals': pending_pickup_approvals,
            'pending_verifications': pending_verifications,
            'food_waste_prevented': round(food_waste_prevented, 1),
        },
        'monthly_data': monthly_data,
        'top_donors': top_donors,
        'recent_users': [u.to_dict() for u in recent_users],
        'recent_donations': [d.to_dict() for d in recent_donations],
    }), 200
