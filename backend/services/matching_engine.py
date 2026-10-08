import re

class MatchingEngine:
    @staticmethod
    def normalize_string(s: str) -> str:
        if not s:
            return ""
        s = s.lower()
        s = re.sub(r'[^\w\s]', '', s)
        words_to_remove = ['pvt', 'ltd', 'private', 'limited', 'inc', 'corp', 'llc']
        words = s.split()
        words = [w for w in words if w not in words_to_remove]
        return " ".join(words).strip()

    @staticmethod
    def compare_names(user_submitted_name: str, official_name: str) -> str:
        if not user_submitted_name or not official_name:
            return 'NO_MATCH'
        
        norm_user = MatchingEngine.normalize_string(user_submitted_name)
        norm_official = MatchingEngine.normalize_string(official_name)
        
        if norm_user == norm_official:
            return 'HIGH_CONFIDENCE_MATCH'
        
        if norm_user in norm_official or norm_official in norm_user:
            return 'PARTIAL_MATCH'
            
        return 'NO_MATCH'
