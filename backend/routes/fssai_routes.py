from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.verification.verification_engine import FSSAIVerificationEngine
from models import FSSAIVerification, User, db

fssai_bp = Blueprint('fssai', __name__)

@fssai_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_fssai():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"success": False, "message": "Invalid JSON"}), 400
        
    license_number = data.get("licenseNumber")
    org_name = data.get("organizationName")
    
    if not license_number or not org_name:
        return jsonify({"success": False, "message": "Missing required fields"}), 400
        
    # Rate Limiting: basic DB check for max attempts
    recent_attempts = FSSAIVerification.query.filter_by(user_id=user_id).order_by(FSSAIVerification.created_at.desc()).limit(5).all()
    if len(recent_attempts) >= 5:
        return jsonify({"success": False, "message": "Too many verification attempts"}), 429
        
    result = FSSAIVerificationEngine.process_verification(user_id, org_name, license_number)
    
    if result.get("status") == "API_ERROR":
        return jsonify(result), 503
        
    if not result.get("success"):
        return jsonify(result), 400
        
    return jsonify(result), 200


@fssai_bp.route('/admin/reviews', methods=['GET'])
@jwt_required()
def get_pending_reviews():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({"message": "Unauthorized"}), 403
        
    reviews = FSSAIVerification.query.filter_by(verification_status='MANUAL_REVIEW').all()
    return jsonify({
        "success": True,
        "reviews": [r.to_dict() for r in reviews]
    }), 200


@fssai_bp.route('/admin/reviews/<int:review_id>/approve', methods=['POST'])
@jwt_required()
def approve_review(review_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({"message": "Unauthorized"}), 403
        
    review = FSSAIVerification.query.get_or_404(review_id)
    if review.verification_status != 'MANUAL_REVIEW':
        return jsonify({"message": "Review is not pending"}), 400
        
    review.verification_status = 'VERIFIED'
    
    target_user = User.query.get(review.user_id)
    if target_user:
        target_user.fssai_verification_status = 'VERIFIED'
        target_user.fssai_verified_at = db.func.now()
        target_user.fssai_valid_until = review.valid_until
        
    db.session.commit()
    
    return jsonify({"success": True, "message": "Verification approved"}), 200

@fssai_bp.route('/admin/reviews/<int:review_id>/reject', methods=['POST'])
@jwt_required()
def reject_review(review_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role not in ['admin', 'super_admin']:
        return jsonify({"message": "Unauthorized"}), 403
        
    review = FSSAIVerification.query.get_or_404(review_id)
    if review.verification_status != 'MANUAL_REVIEW':
        return jsonify({"message": "Review is not pending"}), 400
        
    review.verification_status = 'REJECTED'
    
    target_user = User.query.get(review.user_id)
    if target_user:
        target_user.fssai_verification_status = 'REJECTED'
        
    db.session.commit()
    
    return jsonify({"success": True, "message": "Verification rejected"}), 200
