"""
QR code generation and verification for pickup handoffs.
"""

from __future__ import annotations

import base64
import io
from datetime import datetime, timedelta
from uuid import uuid4

import qrcode

from extensions import db
from extensions import socketio
from models import Certificate, Donation, Notification, PickupQR, PickupRequest
from services.certificate_service import generate_certificate_pdf
from services.realtime import emit_dashboard_update, emit_notification, emit_pickup_update, emit_qr_update

QR_TTL_HOURS = 24


def render_qr_base64(token: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(token)
    qr.make(fit=True)
    image = qr.make_image(fill_color='black', back_color='white')

    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')


def generate_qr_token(pickup_request_id: int):
    pickup_request = PickupRequest.query.get(pickup_request_id)
    if not pickup_request:
        return {'valid': False, 'message': 'Pickup request not found'}

    existing = PickupQR.query.filter_by(pickup_request_id=pickup_request_id).first()
    if existing and existing.status == 'Active' and existing.expires_at > datetime.utcnow():
        token = existing.qr_token
        qr_record = existing
    else:
        token = str(uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=QR_TTL_HOURS)
        if existing:
            existing.qr_token = token
            existing.generated_at = datetime.utcnow()
            existing.expires_at = expires_at
            existing.scanned_at = None
            existing.status = 'Active'
            qr_record = existing
        else:
            qr_record = PickupQR(
                pickup_request_id=pickup_request_id,
                qr_token=token,
                generated_at=datetime.utcnow(),
                expires_at=expires_at,
                status='Active',
            )
            db.session.add(qr_record)

    pickup_request.qr_token = token
    pickup_request.qr_used = False
    db.session.commit()

    payload = {
        'token': token,
        'qr_image': f"data:image/png;base64,{render_qr_base64(token)}",
        'pickup_request_id': pickup_request_id,
        'expires_at': qr_record.expires_at.isoformat() if qr_record.expires_at else None,
        'status': qr_record.status,
    }
    qr_notif_receiver = Notification(
        user_id=pickup_request.receiver_id,
        title='QR Generated',
        message=f'QR code is ready for {pickup_request.donation.food_name}.',
        type='qr_generated',
        link='/receiver/schedule',
    )
    qr_notif_donor = Notification(
        user_id=pickup_request.donation.donor_id,
        title='QR Generated',
        message=f'QR code generated for {pickup_request.donation.food_name}.',
        type='qr_generated',
        link='/donor/pickups',
    )
    db.session.add(qr_notif_receiver)
    db.session.add(qr_notif_donor)
    db.session.commit()
    emit_notification(qr_notif_receiver)
    emit_notification(qr_notif_donor)
    emit_qr_update([pickup_request.receiver_id, pickup_request.donation.donor_id], payload)
    socketio.emit('qr_generated', {
        'pickup_request_id': pickup_request_id,
        'token': token,
        'status': 'Active',
        'qr_image': payload['qr_image'],
    }, room=f'user_{pickup_request.receiver_id}')
    socketio.emit('qr_generated', {
        'pickup_request_id': pickup_request_id,
        'token': token,
        'status': 'Active',
        'qr_image': payload['qr_image'],
    }, room=f'user_{pickup_request.donation.donor_id}')
    emit_dashboard_update([pickup_request.receiver_id, pickup_request.donation.donor_id], {
        'reason': 'qr_generated',
        'pickup_request_id': pickup_request_id,
    })
    return {'valid': True, 'message': 'QR code generated successfully', **payload}


def verify_qr_token(token: str):
    qr_record = PickupQR.query.filter_by(qr_token=token).first()
    if not qr_record:
        return {'valid': False, 'message': 'Invalid QR code token'}

    now = datetime.utcnow()
    if qr_record.status == 'Used':
        return {'valid': False, 'message': 'Already used QR code'}
    if qr_record.expires_at and qr_record.expires_at < now:
        qr_record.status = 'Expired'
        db.session.commit()
        emit_qr_update([qr_record.pickup_request.receiver_id, qr_record.pickup_request.donation.donor_id], {
            'pickup_request_id': qr_record.pickup_request_id,
            'token': token,
            'status': 'Expired',
        })
        return {'valid': False, 'message': 'Expired QR code'}
    if qr_record.status != 'Active':
        return {'valid': False, 'message': 'Invalid QR code status'}

    pickup_request = qr_record.pickup_request
    donation = pickup_request.donation if pickup_request else None
    if not pickup_request or not donation:
        return {'valid': False, 'message': 'Pickup request not found'}
    if pickup_request.status != 'Approved':
        return {'valid': False, 'message': 'Pickup request is not in approved state'}

    qr_record.status = 'Used'
    qr_record.scanned_at = now
    pickup_request.status = 'Completed'
    pickup_request.completed_at = now
    pickup_request.qr_used = True
    donation.status = 'Completed'

    donor_notif = Notification(
        user_id=donation.donor_id,
        title='Pickup Completed',
        message=f'Pickup for {donation.food_name} has been verified and completed.',
        type='pickup_completed',
        link='/donor/pickups',
    )
    receiver_notif = Notification(
        user_id=pickup_request.receiver_id,
        title='Pickup Completed',
        message=f'Your pickup of {donation.food_name} is complete.',
        type='pickup_completed',
        link='/receiver/schedule',
    )
    qr_notif = Notification(
        user_id=donation.donor_id,
        title='QR Verified',
        message=f'QR scan verified for {donation.food_name}.',
        type='qr_verified',
        link='/donor/pickups',
    )

    db.session.add(donor_notif)
    db.session.add(receiver_notif)
    db.session.add(qr_notif)

    certificate_path = None
    try:
        donor = donation.donor
        receiver = pickup_request.receiver
        if donor and receiver:
            filename = generate_certificate_pdf(
                donation=donation,
                donor=donor,
                receiver=receiver,
                pickup_request=pickup_request,
                qr_token=token,
            )
            certificate_path = f'/uploads/certificates/{filename}'
            existing_certificate = Certificate.query.filter_by(donation_id=donation.id).first()
            if existing_certificate:
                existing_certificate.certificate_url = certificate_path
                certificate_record = existing_certificate
            else:
                certificate_record = Certificate(
                    donation_id=donation.id,
                    donor_id=donation.donor_id,
                    receiver_id=pickup_request.receiver_id,
                    certificate_url=certificate_path,
                )
                db.session.add(certificate_record)
    except Exception:
        certificate_path = None

    db.session.commit()

    emit_notification(donor_notif)
    emit_notification(receiver_notif)
    emit_notification(qr_notif)
    emit_pickup_update([pickup_request.receiver_id, donation.donor_id], {
        'pickup_request': pickup_request.to_dict(),
        'donation': donation.to_dict(),
        'status': 'Completed',
    })
    socketio.emit('qr_verified', {
        'pickup_request_id': pickup_request.id,
        'token': token,
        'status': 'Used',
    }, room=f'user_{pickup_request.receiver_id}')
    socketio.emit('qr_verified', {
        'pickup_request_id': pickup_request.id,
        'token': token,
        'status': 'Used',
    }, room=f'user_{donation.donor_id}')
    emit_dashboard_update([pickup_request.receiver_id, donation.donor_id], {
        'reason': 'qr_verified',
        'pickup_request_id': pickup_request.id,
    })
    emit_qr_update([pickup_request.receiver_id, donation.donor_id], {
        'pickup_request_id': pickup_request.id,
        'token': token,
        'status': 'Used',
    })

    return {
        'valid': True,
        'message': 'Pickup verified and completed successfully',
        'pickup_request': pickup_request.to_dict(),
        'donation': donation.to_dict(),
        'qr': qr_record.to_dict(),
        'certificate_url': certificate_path,
    }
