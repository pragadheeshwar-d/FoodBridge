from datetime import datetime, timezone
from thefuzz import fuzz
from models import FSSAIVerification, User, db
from config import Config
from services.fssai.fssai_provider import FSSAIProvider
from services.fssai.mock_fssai_provider import MockFSSAIProvider
from utils.name_normalizer import normalize_organization_name

def get_fssai_provider() -> FSSAIProvider:
    # Always return mock since AuthBridge is removed
    return MockFSSAIProvider()

class FSSAIVerificationEngine:
    @staticmethod
    def _calculate_name_match_score(submitted_name: str, provider_name: str) -> float:
        if not submitted_name or not provider_name:
            return 0.0
            
        norm_sub = normalize_organization_name(submitted_name)
        norm_prov = normalize_organization_name(provider_name)
        
        if norm_sub == norm_prov:
            return 100.0
            
        return fuzz.token_sort_ratio(norm_sub, norm_prov)

    @staticmethod
    def process_verification(user_id: int, submitted_org_name: str, license_number: str) -> dict:
        """
        Orchestrates the verification process.
        """
        user = User.query.get(user_id)
        if not user:
            return {"success": False, "status": "ERROR", "message": "User not found"}
            
        # Check for duplicates (same license used by another verified account)
        existing = FSSAIVerification.query.filter(
            FSSAIVerification.license_number == license_number,
            FSSAIVerification.verification_status == 'VERIFIED',
            FSSAIVerification.user_id != user_id
        ).first()
        
        if existing:
            # Create a manual review record due to duplicate
            ver_record = FSSAIVerification(
                user_id=user_id,
                organization_name_submitted=submitted_org_name,
                license_number=license_number,
                provider="internal",
                verification_status="MANUAL_REVIEW",
                failure_reason="Duplicate license found in system"
            )
            db.session.add(ver_record)
            db.session.commit()
            
            user.fssai_verification_status = "MANUAL_REVIEW"
            user.fssai_verification_id = ver_record.id
            db.session.commit()
            
            return {
                "success": True, 
                "status": "MANUAL_REVIEW", 
                "message": "License is already in use. Sent for manual review."
            }

        provider = get_fssai_provider()
        provider_name_str = "mock"
        
        # Call provider
        result = provider.verify_license(license_number)
        
        if not result.get("success"):
            return {
                "success": False,
                "status": "API_ERROR",
                "message": "Verification service temporarily unavailable"
            }
            
        # Analyze results
        license_status = result.get("licenseStatus", "").upper()
        provider_org_name = result.get("businessName", "")
        
        name_score = FSSAIVerificationEngine._calculate_name_match_score(submitted_org_name, provider_org_name)
        
        status = "PENDING"
        failure_reason = None
        
        if license_status not in ["ACTIVE", "VALID"]:
            status = "EXPIRED" if license_status == "EXPIRED" else "REJECTED"
            failure_reason = f"License status is {license_status}"
        else:
            if name_score >= 85:
                status = "VERIFIED"
            elif name_score >= 60:
                status = "MANUAL_REVIEW"
            else:
                status = "REJECTED"
                failure_reason = f"Organization name mismatch (Score: {name_score})"
                
        # Create verification record
        valid_from_str = result.get("validFrom")
        valid_until_str = result.get("validUntil")
        
        def parse_date(d_str):
            if not d_str:
                return None
            try:
                # Remove Z and parse
                clean = d_str.replace("Z", "")
                if "T" in clean:
                    return datetime.fromisoformat(clean)
                return datetime.strptime(clean, "%Y-%m-%d")
            except:
                return None
                
        valid_until_date = parse_date(valid_until_str)
        
        ver_record = FSSAIVerification(
            user_id=user_id,
            organization_name_submitted=submitted_org_name,
            license_number=license_number,
            provider=provider_name_str,
            provider_reference_id=result.get("referenceId"),
            verified_business_name=provider_org_name,
            license_status=license_status,
            valid_from=parse_date(valid_from_str),
            valid_until=valid_until_date,
            verified_address=result.get("address"),
            name_match_score=name_score,
            verification_status=status,
            failure_reason=failure_reason
        )
        db.session.add(ver_record)
        db.session.commit()
        
        # Update User
        user.fssai_verification_status = status
        user.fssai_verification_id = ver_record.id
        if status == "VERIFIED":
            user.fssai_verified_at = datetime.utcnow()
            user.fssai_valid_until = valid_until_date
        db.session.commit()
        
        response_msg = "Successfully verified" if status == "VERIFIED" else "Verification sent for review" if status == "MANUAL_REVIEW" else "Verification failed"
        
        return {
            "success": status in ["VERIFIED", "MANUAL_REVIEW"],
            "status": status,
            "verificationScore": name_score,
            "organizationName": provider_org_name,
            "licenseStatus": license_status,
            "validUntil": valid_until_str,
            "message": response_msg
        }
