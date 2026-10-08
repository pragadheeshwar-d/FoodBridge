from abc import ABC, abstractmethod
from typing import Dict, Any

class FSSAIProvider(ABC):
    @abstractmethod
    def verify_license(self, license_number: str) -> Dict[str, Any]:
        """
        Verify the FSSAI license number.
        Must return a standardized dictionary matching FSSAIProviderResult:
        {
            "success": bool,
            "licenseNumber": str,
            "businessName": str,
            "licenseStatus": str,
            "validFrom": str,
            "validUntil": str,
            "address": str,
            "referenceId": str,
            "rawStatus": str
        }
        """
        pass
