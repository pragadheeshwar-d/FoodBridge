"""Atomic partial donation allocation service for FoodBridge."""
from __future__ import annotations

from sqlalchemy import text

from extensions import db
from models import Allocation, Donation, PickupRequest


def begin_allocation_transaction() -> None:
    """Acquire SQLite's write lock before reading balances; other DBs use row locks."""
    if db.engine.dialect.name == 'sqlite':
        db.session.execute(text('BEGIN IMMEDIATE'))


def recalculate_donation_state(donation: Donation) -> tuple[float, float, str]:
    """
    Recalculates allocated_quantity, remaining_quantity, and status for a donation
    based on the sum of Approved and Completed pickup requests.
    Only approved/completed requests reduce remaining quantity.
    Pending or Rejected requests do NOT reduce remaining quantity.
    """
    total = float(donation.quantity_number or 0.0)

    # Approved or Completed requests count toward allocation
    approved_requests = (
        PickupRequest.query
        .filter(PickupRequest.donation_id == donation.id)
        .filter(PickupRequest.status.in_(['Approved', 'Completed']))
        .all()
    )
    allocated = sum(float(r.requested_quantity or 0.0) for r in approved_requests)
    remaining = max(0.0, total - allocated)

    donation.remaining_quantity = remaining

    if remaining <= 0.0:
        # Check if all approved requests are marked completed
        pending_completion = [r for r in approved_requests if r.status != 'Completed']
        if not pending_completion and approved_requests:
            new_status = 'Completed'
        else:
            new_status = 'FULLY_ALLOCATED'
    elif allocated > 0.0:
        new_status = 'PARTIALLY_ALLOCATED'
    else:
        new_status = 'AVAILABLE'

    donation.status = new_status
    return allocated, remaining, new_status


def allocate_pending_requests() -> list[PickupRequest]:
    """Retained for backward compatibility as a safe no-op."""
    return []

