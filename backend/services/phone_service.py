"""
Phone OTP service. MVP: simulated (OTP logged to console).
Future: integrate with Twilio / MSG91.
"""
import random
import logging
from datetime import datetime, timedelta

from extensions import db
from models import PhoneVerification, User

logger = logging.getLogger(__name__)

OTP_EXPIRY_MINUTES = 10


def send_otp(user_id: int, phone: str) -> bool:
    """Generate and 'send' an OTP. MVP: logs to console."""
    otp_code = f'{random.randint(0, 999999):06d}'
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Invalidate previous OTPs for this user
    PhoneVerification.query.filter_by(user_id=user_id, verified=False).delete()

    record = PhoneVerification(
        user_id=user_id,
        phone=phone,
        otp_code=otp_code,
        expires_at=expires_at,
    )
    db.session.add(record)
    db.session.commit()

    # MVP: Log the OTP instead of sending via SMS
    logger.info('📱 Phone OTP for user %s (%s): %s', user_id, phone, otp_code)
    print(f'\n📱 [SIMULATED SMS] OTP for {phone}: {otp_code}\n')

    return True


def verify_otp(user_id: int, otp_code: str) -> bool:
    """Verify the OTP code for a user."""
    record = PhoneVerification.query.filter_by(
        user_id=user_id,
        otp_code=otp_code,
        verified=False,
    ).first()

    if not record:
        return False

    if record.expires_at < datetime.utcnow():
        return False

    record.verified = True
    user = User.query.get(user_id)
    if user:
        user.phone_verified = True
    db.session.commit()
    return True
