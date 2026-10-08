class DecisionEngine:
    @staticmethod
    def evaluate(is_id_valid: bool, official_status: str, match_result: str) -> dict:
        if not is_id_valid or official_status != 'ACTIVE':
            return {
                'verification_status': 'FAILED',
                'account_status': 'LOCKED'
            }
        
        if match_result == 'HIGH_CONFIDENCE_MATCH':
            return {
                'verification_status': 'VERIFIED',
                'account_status': 'ACTIVE'
            }
        elif match_result == 'PARTIAL_MATCH':
            return {
                'verification_status': 'REVIEW_REQUIRED',
                'account_status': 'PENDING_VERIFICATION'
            }
        else: # NO_MATCH
            return {
                'verification_status': 'FAILED',
                'account_status': 'LOCKED'
            }
