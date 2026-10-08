from typing import Dict, Any
import datetime
from services.fssai.fssai_provider import FSSAIProvider

class MockFSSAIProvider(FSSAIProvider):
    def verify_license(self, license_number: str) -> Dict[str, Any]:
        """
        Mock implementation for development and testing.
        Uses specific license numbers to simulate different scenarios.
        """
        # Define mock behaviors
        if license_number == "12345678901234":
            # Success - Active
            return {
                "success": True,
                "licenseNumber": license_number,
                "businessName": "ABC Foods Private Limited",
                "licenseStatus": "Active",
                "validFrom": "2023-01-01T00:00:00Z",
                "validUntil": (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat() + "Z",
                "address": "123 Market St, Mumbai, Maharashtra 400001",
                "referenceId": "MOCK-REF-12345",
                "rawStatus": "ACTIVE"
            }
        elif license_number == "99999999999999":
            # Success - Expired
            return {
                "success": True,
                "licenseNumber": license_number,
                "businessName": "Old Bakery Co",
                "licenseStatus": "Expired",
                "validFrom": "2020-01-01T00:00:00Z",
                "validUntil": "2022-01-01T00:00:00Z",
                "address": "456 Old Town, Delhi 110001",
                "referenceId": "MOCK-REF-99999",
                "rawStatus": "EXPIRED"
            }
        elif license_number == "55555555555555":
            # Timeout / Error Simulation
            return {
                "success": False,
                "rawStatus": "API_ERROR",
                "referenceId": "MOCK-ERR"
            }
        
        # Default fallback for unknown mocks
        return {
            "success": True,
            "licenseNumber": license_number,
            "businessName": "Generic Food Business",
            "licenseStatus": "Active",
            "validFrom": "2023-01-01T00:00:00Z",
            "validUntil": "2030-01-01T00:00:00Z",
            "address": "Unknown Location",
            "referenceId": f"MOCK-REF-{license_number}",
            "rawStatus": "ACTIVE"
        }
