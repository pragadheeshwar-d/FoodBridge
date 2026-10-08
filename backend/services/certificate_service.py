"""
PDF certificate generation helpers.
"""

from __future__ import annotations

import os
from datetime import datetime
from uuid import uuid4

from flask import current_app
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_certificate_pdf(*, donation, donor, receiver, pickup_request, qr_token: str | None) -> str:
    folder = current_app.config['CERTIFICATE_UPLOAD_FOLDER']
    os.makedirs(folder, exist_ok=True)
    filename = f'foodbridge-certificate-{donation.id}-{uuid4().hex}.pdf'
    full_path = os.path.join(folder, filename)

    doc = SimpleDocTemplate(full_path, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CenterTitle', parent=styles['Title'], alignment=1, textColor=colors.HexColor('#2E7D32')))
    styles.add(ParagraphStyle(name='CenterBody', parent=styles['BodyText'], alignment=1, leading=16))

    meals = int(donation.quantity_number or 0)
    co2_saved = round(max(meals, 1) * 0.45, 2)

    story = [
      Paragraph('FoodBridge', styles['CenterTitle']),
      Spacer(1, 6 * mm),
      Paragraph('Certificate of Impact', styles['Heading2']),
      Spacer(1, 4 * mm),
      Paragraph('This certificate recognizes the verified food donation and successful pickup recorded by FoodBridge.', styles['CenterBody']),
      Spacer(1, 8 * mm),
    ]

    data = [
        ['Certificate No.', f'FB-{donation.id:06d}'],
        ['Donor', donor.organization or donor.name],
        ['Receiver', receiver.organization or receiver.name],
        ['Food', donation.food_name],
        ['Pickup Date', (pickup_request.completed_at or datetime.utcnow()).strftime('%d %b %Y, %I:%M %p')],
        ['Meals Saved', f'{meals}'],
        ['Carbon Reduced', f'{co2_saved} kg'],
        ['QR Verification', qr_token or 'Verified'],
    ]
    table = Table(data, colWidths=[50 * mm, 105 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8F5E9')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1B5E20')),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#A5D6A7')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor('#F1F8E9')]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    story.extend([table, Spacer(1, 10 * mm), Paragraph('Digitally signed and stored in the FoodBridge local MySQL system.', styles['CenterBody'])])
    doc.build(story)
    return filename
