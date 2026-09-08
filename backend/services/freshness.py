"""
Rule-based freshness prediction for FoodBridge.
"""

from __future__ import annotations

from datetime import datetime, timedelta


def _category_lifetime_hours(category: str | None, storage_method: str | None) -> float:
    category_text = (category or '').strip().lower()
    storage_text = (storage_method or '').strip().lower()

    if 'rice' in category_text or 'curry' in category_text or 'main' in category_text:
        base = 6.0
    elif 'dessert' in category_text or 'baked' in category_text:
        base = 10.0
    elif 'fruit' in category_text or 'salad' in category_text:
        base = 12.0
    elif 'beverage' in category_text or 'drink' in category_text:
        base = 18.0
    else:
        base = 8.0

    if 'refriger' in storage_text:
        base += 4.0
    elif 'frozen' in storage_text:
        base += 12.0
    elif 'room' in storage_text:
        base -= 1.5

    return max(1.5, base)


def predict_freshness(
    *,
    food_category: str | None,
    preparation_time: datetime | None,
    storage_method: str | None,
    current_temperature: float | None,
    pickup_time: datetime | None,
) -> dict:
    now = datetime.utcnow()
    prep_time = preparation_time or now
    pickup_at = pickup_time or now
    lifetime_hours = _category_lifetime_hours(food_category, storage_method)

    if current_temperature is not None:
        if current_temperature >= 35:
            lifetime_hours -= 3
        elif current_temperature >= 30:
            lifetime_hours -= 2
        elif current_temperature >= 25:
            lifetime_hours -= 1
        elif current_temperature <= 8:
            lifetime_hours += 1

    time_since_preparation = max(0.0, (now - prep_time).total_seconds() / 3600)
    time_until_pickup = (pickup_at - now).total_seconds() / 3600

    freshness_score = int(max(0, min(100, 100 - (time_since_preparation / max(lifetime_hours, 1)) * 100)))
    freshness_score = max(0, min(100, freshness_score - max(0, int((current_temperature or 0) - 24) * 1.5)))

    safe_until = prep_time + timedelta(hours=lifetime_hours)
    if time_until_pickup > 0:
        safe_until = min(safe_until, pickup_at + timedelta(hours=max(1.0, lifetime_hours * 0.5)))

    if freshness_score >= 75:
        risk_level = 'Green'
        recommendation = 'Safe for pickup. Keep the food sealed and verify the handoff quickly.'
    elif freshness_score >= 45:
        risk_level = 'Yellow'
        recommendation = 'Pickup soon. Monitor temperature and prioritize this donation.'
    else:
        risk_level = 'Red'
        recommendation = 'Unsafe to keep listed. Expire this donation and notify the donor.'

    return {
        'freshness_score': freshness_score,
        'predicted_expiry': safe_until,
        'risk_level': risk_level,
        'ai_recommendation': recommendation,
    }
