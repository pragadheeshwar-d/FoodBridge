import os
from uuid import uuid4
from flask import Blueprint, current_app, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from extensions import db
from models import User, OrganizationVerification
from services import verification_service, phone_service

verification_bp = Blueprint('verification', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def _store_verification_document(file_storage) -> str:
    if not file_storage or not file_storage.filename:
        raise ValueError('Document file is required')

    original = secure_filename(file_storage.filename)
    extension = original.rsplit('.', 1)[-1].lower() if '.' in original else ''
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError('Invalid document type')

    upload_dir = current_app.config['VERIFICATION_UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    filename = f'{uuid4().hex}.{extension}'
    file_storage.save(os.path.join(upload_dir, filename))
    return f'/uploads/verification/{filename}'

@verification_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit():
    user_id = int(get_jwt_identity())
    
    data = request.form.to_dict()
    document = request.files.get('document')
    
    org_type = data.get('organization_type')
    ver_method = data.get('verification_method')
    gov_id_type = data.get('government_id_type')
    gov_id_number = data.get('government_id_number')
    
    doc_path = None
    if document:
        try:
            doc_path = _store_verification_document(document)
        except ValueError as exc:
            return jsonify({'success': False, 'message': str(exc)}), 400

    try:
        verification = verification_service.submit_verification(
            user_id=user_id,
            organization_type=org_type,
            verification_method=ver_method,
            government_id_type=gov_id_type,
            government_id_number=gov_id_number,
            document_path=doc_path
        )
        return jsonify({'success': True, 'message': 'Verification submitted successfully', 'data': {'verification': verification.to_dict(mask_id=True)}}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@verification_bp.route('/status', methods=['GET'])
@jwt_required()
def get_status():
    user_id = int(get_jwt_identity())
    status_data = verification_service.get_verification_status(user_id)
    if not status_data:
        return jsonify({'success': False, 'message': 'No verification found'}), 404
    return jsonify({'success': True, 'message': 'Status retrieved', 'data': {'verification': status_data}}), 200


@verification_bp.route('/resubmit', methods=['PUT'])
@jwt_required()
def resubmit():
    user_id = int(get_jwt_identity())
    
    data = request.form.to_dict()
    document = request.files.get('document')
    
    org_type = data.get('organization_type')
    ver_method = data.get('verification_method')
    gov_id_type = data.get('government_id_type')
    gov_id_number = data.get('government_id_number')
    
    doc_path = None
    if document:
        try:
            doc_path = _store_verification_document(document)
        except ValueError as exc:
            return jsonify({'success': False, 'message': str(exc)}), 400

    try:
        verification = verification_service.submit_verification(
            user_id=user_id,
            organization_type=org_type,
            verification_method=ver_method,
            government_id_type=gov_id_type,
            government_id_number=gov_id_number,
            document_path=doc_path
        )
        return jsonify({'success': True, 'message': 'Verification resubmitted successfully', 'data': {'verification': verification.to_dict(mask_id=True)}}), 200
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@verification_bp.route('/document/<int:id>', methods=['GET'])
@jwt_required()
def get_document(id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    verification = OrganizationVerification.query.get(id)
    
    if not verification:
        return jsonify({'success': False, 'message': 'Not found'}), 404
        
    if verification.user_id != user_id and user.role not in ('admin', 'super_admin'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
    if not verification.document_url:
        return jsonify({'success': False, 'message': 'No document attached'}), 404
        
    filename = os.path.basename(verification.document_url)
    return send_from_directory(current_app.config['VERIFICATION_UPLOAD_FOLDER'], filename)


@verification_bp.route('/admin/requests', methods=['GET'])
@jwt_required()
def admin_requests():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.role not in ('admin', 'super_admin'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
    requests = OrganizationVerification.query.all()
    return jsonify({
        'success': True,
        'message': 'Requests retrieved',
        'data': {'requests': [r.to_dict() for r in requests]}
    }), 200


@verification_bp.route('/admin/requests/<int:id>', methods=['GET'])
@jwt_required()
def admin_request_detail(id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.role not in ('admin', 'super_admin'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
    verification = OrganizationVerification.query.get(id)
    if not verification:
        return jsonify({'success': False, 'message': 'Not found'}), 404
        
    return jsonify({
        'success': True,
        'message': 'Request retrieved',
        'data': {'verification': verification.to_dict()}
    }), 200


@verification_bp.route('/admin/requests/<int:id>/review', methods=['PUT'])
@jwt_required()
def admin_review(id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.role not in ('admin', 'super_admin'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
    data = request.get_json(silent=True) or {}
    action = data.get('action')
    reason = data.get('reason')
    
    try:
        verification = verification_service.admin_review(
            verification_id=id,
            admin_id=user_id,
            action=action,
            reason=reason
        )
        return jsonify({'success': True, 'message': 'Review submitted', 'data': {'verification': verification.to_dict()}}), 200
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@verification_bp.route('/phone/send-otp', methods=['POST'])
@jwt_required()
def send_otp():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    phone = data.get('phone')
    if not phone:
        return jsonify({'success': False, 'message': 'Phone number required'}), 400
        
    phone_service.send_otp(user_id, phone)
    return jsonify({'success': True, 'message': 'OTP sent'}), 200


@verification_bp.route('/phone/verify-otp', methods=['POST'])
@jwt_required()
def verify_otp():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    otp_code = data.get('otp_code')
    if not otp_code:
        return jsonify({'success': False, 'message': 'OTP code required'}), 400
        
    success = phone_service.verify_otp(user_id, otp_code)
    if not success:
        return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400
        
    return jsonify({'success': True, 'message': 'Phone verified successfully'}), 200
