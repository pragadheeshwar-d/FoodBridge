"""
Organization verification service with pluggable provider architecture.
"""
import re
from datetime import datetime
from extensions import db
from models import OrganizationVerification, VerificationAuditLog, User


class FSSAIProvider:
    """FSSAI-specific validation. MVP: format validation only.
    Future: integrate with official FSSAI API."""

    FSSAI_PATTERN = re.compile(r'^\d{14}$')

    @staticmethod
    def validate_format(fssai_number: str) -> bool:
        if not fssai_number:
            return False
        cleaned = fssai_number.strip().replace(' ', '').replace('-', '')
        return bool(FSSAIProvider.FSSAI_PATTERN.match(cleaned))

    @staticmethod
    def clean_number(fssai_number: str) -> str:
        return fssai_number.strip().replace(' ', '').replace('-', '')

    @staticmethod
    def verify_with_api(id_number: str, org_name: str) -> dict:
        # Mock API behavior
        if id_number.startswith('1'):
            return {
                'valid': True,
                'status': 'ACTIVE',
                'official_name': 'Test Org Pvt Ltd'
            }
        return {
            'valid': True,
            'status': 'ACTIVE',
            'official_name': 'Mismatch Name'
        }


class NGODarpanProvider:
    """NGO Darpan / organization registration validation. MVP: basic format check."""

    @staticmethod
    def validate_format(registration_id: str) -> bool:
        if not registration_id or len(registration_id.strip()) < 3:
            return False
        return True

    @staticmethod
    def verify_with_api(id_number: str, org_name: str) -> dict:
        return {
            'valid': True,
            'status': 'ACTIVE',
            'official_name': 'Test NGO' if id_number.startswith('N') else 'Mismatch NGO'
        }


def _log_audit(verification_id: int, action: str, actor_id: int | None = None, details: str | None = None):
    log = VerificationAuditLog(
        verification_id=verification_id,
        action=action,
        actor_id=actor_id,
        details=details,
    )
    db.session.add(log)


def submit_verification(
    user_id: int,
    organization_type: str,
    verification_method: str,
    government_id_type: str,
    government_id_number: str,
    document_path: str | None = None,
) -> OrganizationVerification:
    """Create or update an organization verification submission."""
    existing = OrganizationVerification.query.filter_by(user_id=user_id).first()
    if existing and existing.verification_status == 'VERIFIED':
        raise ValueError('Organization is already verified.')

    if existing and existing.verification_status not in ('REJECTED', 'NOT_SUBMITTED'):
        raise ValueError('A verification request is already pending.')

    now = datetime.utcnow()

    if existing:
        existing.organization_type = organization_type
        existing.verification_method = verification_method
        existing.government_id_type = government_id_type
        existing.government_id_number = government_id_number
        if document_path:
            existing.document_url = document_path
        existing.verification_status = 'PENDING'
        existing.submitted_at = now
        existing.rejection_reason = None
        existing.reviewed_at = None
        existing.reviewed_by = None
        existing.updated_at = now
        verification = existing
        _log_audit(verification.id, 'RESUBMITTED', actor_id=user_id)
    else:
        verification = OrganizationVerification(
            user_id=user_id,
            organization_type=organization_type,
            verification_status='PENDING',
            verification_method=verification_method,
            government_id_type=government_id_type,
            government_id_number=government_id_number,
            document_url=document_path,
            submitted_at=now,
        )
        db.session.add(verification)
        db.session.flush()
        _log_audit(verification.id, 'SUBMITTED', actor_id=user_id)

    user = User.query.get(user_id)
    if user:
        user.org_verification_status = 'PENDING'

    db.session.commit()
    return verification


def get_verification_status(user_id: int) -> dict | None:
    verification = OrganizationVerification.query.filter_by(user_id=user_id).first()
    if not verification:
        return None
    return verification.to_dict(mask_id=True)


def admin_review(
    verification_id: int,
    admin_id: int,
    action: str,
    reason: str | None = None,
) -> OrganizationVerification:
    verification = OrganizationVerification.query.get(verification_id)
    if not verification:
        raise ValueError('Verification request not found.')

    now = datetime.utcnow()

    if action == 'approve':
        verification.verification_status = 'VERIFIED'
        verification.reviewed_at = now
        verification.reviewed_by = admin_id
        verification.rejection_reason = None
        _log_audit(verification.id, 'APPROVED', actor_id=admin_id)

        user = User.query.get(verification.user_id)
        if user:
            user.org_verification_status = 'VERIFIED'
            user.status = 'approved'

    elif action == 'reject':
        if not reason:
            raise ValueError('Rejection reason is required.')
        verification.verification_status = 'REJECTED'
        verification.reviewed_at = now
        verification.reviewed_by = admin_id
        verification.rejection_reason = reason
        _log_audit(verification.id, 'REJECTED', actor_id=admin_id, details=reason)

        user = User.query.get(verification.user_id)
        if user:
            user.org_verification_status = 'REJECTED'

    elif action == 'under_review':
        verification.verification_status = 'UNDER_REVIEW'
        _log_audit(verification.id, 'UNDER_REVIEW', actor_id=admin_id)

        user = User.query.get(verification.user_id)
        if user:
            user.org_verification_status = 'UNDER_REVIEW'

    else:
        raise ValueError(f'Invalid action: {action}')

    db.session.commit()
    return verification


def mask_government_id(id_number: str | None) -> str | None:
    if not id_number:
        return None
    if len(id_number) > 4:
        return '********' + id_number[-4:]
    return '****'
