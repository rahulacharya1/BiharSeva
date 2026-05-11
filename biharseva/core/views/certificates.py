from io import BytesIO

from django.conf import settings
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from ..models import Certificate


def build_certificate_pdf_bytes(certificate):
    buffer = BytesIO()
    page_size = landscape(A4)
    pdf = canvas.Canvas(buffer, pagesize=page_size)
    width, height = page_size

    pdf.setTitle(f"Certificate {certificate.certificate_id}")
    pdf.setAuthor("BiharSeva")
    pdf.setSubject("Volunteer participation certificate")

    pdf.setLineWidth(4)
    pdf.setFillColor(colors.HexColor("#059669"))
    pdf.setStrokeColor(colors.HexColor("#059669"))
    pdf.rect(1.0 * cm, 1.0 * cm, width - 2.0 * cm, height - 2.0 * cm)

    pdf.setLineWidth(1.2)
    pdf.setStrokeColor(colors.HexColor("#34d399"))
    pdf.rect(1.4 * cm, 1.4 * cm, width - 2.8 * cm, height - 2.8 * cm)

    pdf.setFont("Helvetica-Bold", 13)
    pdf.setFillColor(colors.HexColor("#059669"))
    pdf.drawCentredString(width / 2, height - 2.2 * cm, "BIHARSEVA COMMUNITY INITIATIVE")

    pdf.setFont("Helvetica-Bold", 34)
    pdf.setFillColor(colors.HexColor("#111827"))
    pdf.drawCentredString(width / 2, height - 4.2 * cm, "CERTIFICATE OF PARTICIPATION")

    pdf.setLineWidth(1.5)
    pdf.setStrokeColor(colors.HexColor("#059669"))
    pdf.line(3.0 * cm, height - 5.0 * cm, width - 3.0 * cm, height - 5.0 * cm)

    pdf.setFont("Helvetica", 14)
    pdf.setFillColor(colors.HexColor("#374151"))
    pdf.drawCentredString(width / 2, height - 6.3 * cm, "This certificate is proudly awarded to")

    pdf.setFont("Helvetica-Bold", 36)
    pdf.setFillColor(colors.HexColor("#059669"))
    pdf.drawCentredString(width / 2, height - 8.1 * cm, certificate.volunteer.name)

    pdf.setFont("Helvetica", 14)
    pdf.setFillColor(colors.HexColor("#374151"))
    pdf.drawCentredString(width / 2, height - 9.5 * cm, "for dedicated service and successful participation in")

    pdf.setFont("Helvetica-Bold", 20)
    pdf.setFillColor(colors.HexColor("#059669"))
    pdf.drawCentredString(width / 2, height - 10.8 * cm, certificate.event.title)

    pdf.setFont("Helvetica", 11)
    pdf.setFillColor(colors.HexColor("#6b7280"))
    pdf.drawCentredString(width / 2, height - 12.1 * cm, f"Event Date: {certificate.event.date.strftime('%d %B %Y')}")
    pdf.drawCentredString(width / 2, height - 12.8 * cm, f"Issued On: {certificate.issued_date.strftime('%d %B %Y')}")
    pdf.drawCentredString(width / 2, height - 13.5 * cm, f"Certificate ID: {certificate.certificate_id}")

    pdf.setLineWidth(1)
    pdf.setStrokeColor(colors.HexColor("#94a3b8"))
    left_x = width * 0.22
    right_x = width * 0.78
    sign_y = 4.8 * cm
    pdf.line(left_x - 2.3 * cm, sign_y, left_x + 2.3 * cm, sign_y)
    pdf.line(right_x - 2.3 * cm, sign_y, right_x + 2.3 * cm, sign_y)

    event_coordinator_name = getattr(certificate.event, "program_coordinator_name", "")
    left_sign_name = event_coordinator_name or getattr(settings, "CERTIFICATE_LEFT_SIGN_NAME", "A. Kumar")
    left_sign_title = getattr(settings, "CERTIFICATE_LEFT_SIGN_TITLE", "Program Coordinator")
    right_sign_name = getattr(settings, "CERTIFICATE_RIGHT_SIGN_NAME", "Admin")
    right_sign_title = getattr(settings, "CERTIFICATE_RIGHT_SIGN_TITLE", "Admin, BiharSeva")

    pdf.setFont("Times-Italic", 20)
    pdf.setFillColor(colors.HexColor("#0f766e"))
    pdf.drawCentredString(left_x, sign_y + 0.35 * cm, left_sign_name)
    pdf.drawCentredString(right_x, sign_y + 0.35 * cm, right_sign_name)

    pdf.setFont("Helvetica-Bold", 12)
    pdf.setFillColor(colors.HexColor("#1e293b"))
    pdf.drawCentredString(left_x, sign_y - 0.65 * cm, left_sign_title)
    pdf.drawCentredString(right_x, sign_y - 0.65 * cm, right_sign_title)

    pdf.setLineWidth(0.8)
    pdf.setStrokeColor(colors.HexColor("#cbd5e1"))
    pdf.line(2.0 * cm, 3.0 * cm, width - 2.0 * cm, 3.0 * cm)
    pdf.setFont("Helvetica-Oblique", 9)
    pdf.setFillColor(colors.HexColor("#64748b"))
    pdf.drawCentredString(width / 2, 2.35 * cm, "Verified digital certificate issued by BiharSeva")
    pdf.drawCentredString(width / 2, 1.9 * cm, "Authenticity can be verified using the Certificate ID")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.read()


def build_certificate_pdf_response(certificate, as_attachment=True):
    pdf_bytes = build_certificate_pdf_bytes(certificate)
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    disposition_type = "attachment" if as_attachment else "inline"
    response["Content-Disposition"] = f'{disposition_type}; filename="certificate-{certificate.certificate_id}.pdf"'
    return response
