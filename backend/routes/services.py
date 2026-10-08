"""
Miscellaneous services: QR, certificates, and admin user management.
"""
from datetime import datetime
import json
import csv
import io
import os

from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from geopy.distance import geodesic
from geopy.geocoders import Nominatim
from openpyxl import Workbook
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from extensions import db
from models import User, Donation, PickupRequest, Certificate
from services.qr_service import generate_qr_token, render_qr_base64, verify_qr_token
from services.map_service import geocode_address as resolve_address

services_bp = Blueprint('services', __name__)


def _reverse_geocoder() -> Nominatim:
    try:
        user_agent = current_app.config.get(
            'NOMINATIM_USER_AGENT',
            'FoodBridge/1.0 (+https://foodbridge.local; contact=support@foodbridge.local)',
        )
    except RuntimeError:
        user_agent = 'FoodBridge/1.0 (+https://foodbridge.local; contact=support@foodbridge.local)'
    return Nominatim(user_agent=user_agent)


@services_bp.route('/qr/generate', methods=['POST'])
@jwt_required()
def api_generate_qr():
    data = request.get_json(silent=True) or {}
    pickup_request_id = data.get('pickup_request_id') or data.get('pickupRequestId')
    if not pickup_request_id:
        return jsonify({'success': False, 'message': 'pickup_request_id is required'}), 400
    result = generate_qr_token(int(pickup_request_id))
    status = 200 if result.get('valid') else 400
    return jsonify(result), status


@services_bp.route('/qr/verify', methods=['POST'])
@jwt_required()
def api_verify_qr():
    data = request.get_json(silent=True) or {}
    token = data.get('token') or data.get('qr_token') or data.get('qrToken')
    if not token:
        return jsonify({'success': False, 'message': 'token is required'}), 400
    result = verify_qr_token(str(token))
    status = 200 if result.get('valid') else 400
    return jsonify(result), status


@services_bp.route('/qr/<int:pickup_request_id>', methods=['GET'])
@jwt_required()
def api_get_qr(pickup_request_id: int):
    pickup = PickupRequest.query.get_or_404(pickup_request_id)
    qr = pickup.pickup_qr
    if not qr:
        return jsonify({'success': False, 'message': 'QR code has not been generated yet'}), 404
    return jsonify({
        'success': True,
        'message': 'QR code loaded',
        'data': {
            'pickup_request': pickup.to_dict(),
            'qr': {
                **qr.to_dict(),
                'qr_image': f"data:image/png;base64,{render_qr_base64(qr.qr_token)}",
            },
        },
    }), 200


# ─── Certificates ─────────────────────────────────────────────────────────────

@services_bp.route('/certificates', methods=['GET'])
@jwt_required()
def get_certificates():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if user.role == 'donor':
        certs = Certificate.query.filter_by(donor_id=user_id).order_by(Certificate.generated_at.desc()).all()
    elif user.role == 'receiver':
        certs = Certificate.query.filter_by(receiver_id=user_id).order_by(Certificate.generated_at.desc()).all()
    else:
        certs = Certificate.query.order_by(Certificate.generated_at.desc()).all()

    return jsonify({'certificates': [c.to_dict() for c in certs], 'metrics': {
        'count': len(certs),
        'total_meals': sum(
            (Donation.query.get(c.donation_id).quantity_number or 0)
            for c in certs
            if Donation.query.get(c.donation_id)
        ),
    }}), 200


@services_bp.route('/certificates/<int:certificate_id>/download', methods=['GET'])
@jwt_required()
def download_certificate(certificate_id: int):
    cert = Certificate.query.get_or_404(certificate_id)
    if cert.certificate_url:
        filename = os.path.basename(cert.certificate_url)
        cert_dir = current_app.config['CERTIFICATE_UPLOAD_FOLDER']
        path = os.path.join(cert_dir, filename)
        if os.path.exists(path):
            return send_file(path, as_attachment=True, download_name=filename)
    return jsonify({'success': False, 'message': 'Certificate file not found'}), 404


@services_bp.route('/geocode', methods=['GET'])
@jwt_required(optional=True)
def geocode_address():
    query = (request.args.get('q') or request.args.get('address') or '').strip()
    if not query:
        return jsonify({'success': False, 'message': 'q is required'}), 400
    try:
        resolved = resolve_address(query)
    except LookupError:
        return jsonify({'success': False, 'message': 'Location not found'}), 404
    except Exception:
        return jsonify({'success': False, 'message': 'Geocoding failed'}), 502
    return jsonify({
        'success': True,
        'data': {
            'latitude': resolved['latitude'],
            'longitude': resolved['longitude'],
            'address': resolved['address'],
        },
    }), 200


@services_bp.route('/reverse-geocode', methods=['GET'])
@jwt_required(optional=True)
def reverse_geocode():
    lat = request.args.get('lat')
    lng = request.args.get('lng') or request.args.get('lon')
    if lat is None or lng is None:
        return jsonify({'success': False, 'message': 'lat and lng are required'}), 400
    try:
        lat_float = float(lat)
        lng_float = float(lng)
    except ValueError:
        return jsonify({'success': False, 'message': 'lat and lng must be valid numbers'}), 400

    try:
        geocoder = _reverse_geocoder()
        location = geocoder.reverse((lat_float, lng_float), exactly_one=True, timeout=10)
    except Exception:
        location = None
    if not location:
        coordinate_address = f'{lat_float:.6f}, {lng_float:.6f}'
        return jsonify({
            'success': True,
            'data': {
                'latitude': lat_float,
                'longitude': lng_float,
                'address': coordinate_address,
                'city': None,
                'state': None,
                'pincode': None,
                'country': None,
            },
        }), 200
    raw = location.raw.get('address', {}) if getattr(location, 'raw', None) else {}
    return jsonify({
        'success': True,
        'data': {
            'latitude': lat_float,
            'longitude': lng_float,
            'address': location.address,
            'city': raw.get('city') or raw.get('town') or raw.get('village') or raw.get('suburb'),
            'state': raw.get('state'),
            'pincode': raw.get('postcode'),
            'country': raw.get('country'),
        },
    }), 200


@services_bp.route('/distance', methods=['GET'])
@jwt_required(optional=True)
def calculate_distance():
    try:
        origin_lat = float(request.args.get('origin_lat'))
        origin_lng = float(request.args.get('origin_lng'))
        dest_lat = float(request.args.get('dest_lat'))
        dest_lng = float(request.args.get('dest_lng'))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'origin_lat, origin_lng, dest_lat, and dest_lng are required'}), 400

    km = geodesic((origin_lat, origin_lng), (dest_lat, dest_lng)).km
    minutes = max(1, int(round(km * 3.5)))
    return jsonify({
        'success': True,
        'data': {
            'distance_km': round(km, 1),
            'travel_minutes': minutes,
            'label': f'{round(km, 1)} km Away',
        },
    }), 200


@services_bp.route('/settings', methods=['GET', 'PUT'])
@jwt_required()
def account_settings():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify({
            'success': True,
            'data': {
                'settings': _load_settings(user),
            },
        }), 200

    payload = request.get_json(silent=True) or {}
    settings = _load_settings(user)
    settings.update({
        'notification_preferences': payload.get('notification_preferences', settings.get('notification_preferences', 'all')),
        'pickup_reminder': payload.get('pickup_reminder', settings.get('pickup_reminder', '30')),
        'dark_mode': bool(payload.get('dark_mode', settings.get('dark_mode', False))),
        'language': payload.get('language', settings.get('language', 'en')),
    })
    user.settings_json = json.dumps(settings)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Settings saved', 'data': {'settings': settings}}), 200


@services_bp.route('/settings/delete-account', methods=['POST'])
@jwt_required()
def delete_account():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Account deleted', 'data': {}}), 200


def _load_settings(user: User) -> dict:
    try:
        return json.loads(user.settings_json or '{}')
    except Exception:
        return {}


def _report_rows(period: str):
    now = datetime.utcnow()
    if period == 'weekly':
        since = now.timestamp() - 7 * 24 * 3600
    elif period == 'monthly':
        since = now.timestamp() - 30 * 24 * 3600
    else:
        since = now.timestamp() - 24 * 3600

    donations = Donation.query.filter(Donation.created_at >= datetime.fromtimestamp(since)).all()
    pickups = PickupRequest.query.filter(PickupRequest.requested_at >= datetime.fromtimestamp(since)).all()
    certificates = Certificate.query.filter(Certificate.generated_at >= datetime.fromtimestamp(since)).all()
    return donations, pickups, certificates


@services_bp.route('/reports', methods=['GET'])
@jwt_required()
def export_report():
    period = (request.args.get('period') or 'daily').lower()
    fmt = (request.args.get('format') or 'pdf').lower()
    donations, pickups, certificates = _report_rows(period)

    if fmt == 'csv':
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(['Type', 'ID', 'Status', 'Created At'])
        for donation in donations:
            writer.writerow(['Donation', donation.id, donation.status, donation.created_at.isoformat() if donation.created_at else ''])
        for pickup in pickups:
            writer.writerow(['Pickup', pickup.id, pickup.status, pickup.requested_at.isoformat() if pickup.requested_at else ''])
        for certificate in certificates:
            writer.writerow(['Certificate', certificate.id, 'Issued', certificate.generated_at.isoformat() if certificate.generated_at else ''])
        output = io.BytesIO(buffer.getvalue().encode('utf-8'))
        output.seek(0)
        return send_file(output, mimetype='text/csv', as_attachment=True, download_name=f'foodbridge-{period}-report.csv')

    if fmt == 'xlsx':
        wb = Workbook()
        ws = wb.active
        ws.title = 'Report'
        ws.append(['Type', 'ID', 'Status', 'Created At'])
        for donation in donations:
            ws.append(['Donation', donation.id, donation.status, donation.created_at.isoformat() if donation.created_at else ''])
        for pickup in pickups:
            ws.append(['Pickup', pickup.id, pickup.status, pickup.requested_at.isoformat() if pickup.requested_at else ''])
        for certificate in certificates:
            ws.append(['Certificate', certificate.id, 'Issued', certificate.generated_at.isoformat() if certificate.generated_at else ''])
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', as_attachment=True, download_name=f'foodbridge-{period}-report.xlsx')

    output = io.BytesIO()
    c = canvas.Canvas(output, pagesize=A4)
    c.setFont('Helvetica-Bold', 16)
    c.drawString(40, 800, f'FoodBridge {period.title()} Report')
    c.setFont('Helvetica', 11)
    y = 770
    for label, count in [('Donations', len(donations)), ('Pickups', len(pickups)), ('Certificates', len(certificates))]:
        c.drawString(40, y, f'{label}: {count}')
        y -= 18
    c.save()
    output.seek(0)
    return send_file(output, mimetype='application/pdf', as_attachment=True, download_name=f'foodbridge-{period}-report.pdf')


# ─── Admin: Users ─────────────────────────────────────────────────────────────

@services_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def admin_get_users():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    if admin.role not in ('admin', 'super_admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    role_filter = request.args.get('role')
    status_filter = request.args.get('status')
    q = User.query
    if role_filter:
        q = q.filter_by(role=role_filter)
    if status_filter:
        q = q.filter_by(status=status_filter)

    users = q.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@services_bp.route('/admin/users/<int:uid>', methods=['PUT'])
@jwt_required()
def admin_update_user(uid):
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    if admin.role not in ('admin', 'super_admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    target = User.query.get_or_404(uid)
    data = request.get_json(force=True) or {}

    if 'verified' in data:
        target.verified = bool(data['verified'])
    if 'status' in data and data['status'] in ('pending', 'approved', 'rejected', 'suspended'):
        target.status = data['status']
    if 'role' in data and data['role'] in ('donor', 'receiver', 'admin', 'super_admin'):
        target.role = data['role']

    db.session.commit()
    return jsonify({'message': 'User updated', 'user': target.to_dict()}), 200


@services_bp.route('/admin/users/<int:uid>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(uid):
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    if admin.role not in ('admin', 'super_admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    target = User.query.get_or_404(uid)
    db.session.delete(target)
    db.session.commit()
    return jsonify({'message': 'User deleted'}), 200


# ─── Admin: Donations ─────────────────────────────────────────────────────────

@services_bp.route('/admin/donations', methods=['GET'])
@jwt_required()
def admin_get_donations():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    if admin.role not in ('admin', 'super_admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    donations = Donation.query.order_by(Donation.created_at.desc()).all()
    return jsonify([d.to_dict() for d in donations]), 200


# ─── Admin: Pickup Requests ───────────────────────────────────────────────────

@services_bp.route('/admin/pickups', methods=['GET'])
@jwt_required()
def admin_get_pickups():
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    if admin.role not in ('admin', 'super_admin'):
        return jsonify({'message': 'Unauthorized'}), 403

    prs = PickupRequest.query.order_by(PickupRequest.requested_at.desc()).all()
    result = []
    for pr in prs:
        d = pr.to_dict()
        d['donation'] = pr.donation.to_dict() if pr.donation else None
        result.append(d)
    return jsonify(result), 200
