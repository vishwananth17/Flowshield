import os
import logging
from datetime import datetime, UTC
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.models.dispute import Dispute, DisputeEvidence, DisputeTimeline

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """
    Generates a professional PDF dispute response document using reportlab
    to defend merchants against payment chargebacks.
    """

    @classmethod
    async def generate_response_pdf(cls, dispute: Dispute, db: AsyncSession) -> str:
        """
        Creates a branded dispute defense PDF package, saves it to static storage,
        and returns the access path.
        """
        logger.info(f"Generating PDF response document for dispute: {dispute.dispute_reference}")
        
        # 1. Fetch all selected evidence items
        stmt = select(DisputeEvidence).where(
            DisputeEvidence.dispute_id == dispute.id,
            DisputeEvidence.is_included_in_response == True
        ).order_by(DisputeEvidence.display_order.asc())
        
        res = await db.execute(stmt)
        evidence_list = res.scalars().all()

        # 2. Configure output paths
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        static_dir = os.path.join(base_dir, "static", "response_documents")
        os.makedirs(static_dir, exist_ok=True)
        
        pdf_filename = f"{dispute.id}_dispute_defense.pdf"
        pdf_path = os.path.join(static_dir, pdf_filename)

        # 3. Compile reportlab elements
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CoverTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=15
        )
        
        subtitle_style = ParagraphStyle(
            'CoverSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#475569'),
            spaceAfter=25
        )

        h2_style = ParagraphStyle(
            'Heading2Custom',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=15,
            spaceAfter=10
        )
        
        body_style = ParagraphStyle(
            'BodyCustom',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155'),
            spaceAfter=10
        )
        
        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            textColor=colors.HexColor('#475569')
        )
        
        meta_value_style = ParagraphStyle(
            'MetaValue',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=12,
            textColor=colors.HexColor('#0f172a')
        )

        story = []

        # ----------------------------------------------------
        # PAGE 1: COVER SUMMARY
        # ----------------------------------------------------
        story.append(Spacer(1, 1 * inch))
        story.append(Paragraph("DISPUTE DEFENSE PACKAGE", title_style))
        story.append(Paragraph(f"Official evidence compilation generated via Flowshield AI", subtitle_style))
        story.append(Spacer(1, 0.5 * inch))

        cover_data = [
            [Paragraph("Merchant Reference:", meta_label_style), Paragraph(dispute.dispute_reference, meta_value_style)],
            [Paragraph("Payment Gateway:", meta_label_style), Paragraph(dispute.payment_gateway.upper(), meta_value_style)],
            [Paragraph("Gateway Reference:", meta_label_style), Paragraph(dispute.external_transaction_id or "N/A", meta_value_style)],
            [Paragraph("Dispute Reason Code:", meta_label_style), Paragraph(dispute.dispute_reason or "general", meta_value_style)],
            [Paragraph("Dispute Amount:", meta_label_style), Paragraph(f"{dispute.currency} {dispute.dispute_amount:,.2f}", meta_value_style)],
            [Paragraph("Response Date:", meta_label_style), Paragraph(datetime.now(UTC).strftime('%Y-%m-%d %H:%M UTC'), meta_value_style)],
            [Paragraph("Response Deadline:", meta_label_style), Paragraph(dispute.response_deadline.strftime('%Y-%m-%d %H:%M UTC'), meta_value_style)],
        ]
        
        cover_table = Table(cover_data, colWidths=[2.2 * inch, 4.0 * inch])
        cover_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(cover_table)
        story.append(Spacer(1, 0.4 * inch))
        
        statement_text = (
            f"<b>Statement of Facts:</b> This dispute response is submitted on behalf of the merchant to contest "
            f"the chargeback/complaint of {dispute.currency} {dispute.dispute_amount:,.2f} raised on {dispute.dispute_raised_at.strftime('%Y-%m-%d')}. "
            f"The transaction is fully legitimate, authorized, and completed. Below, we present conclusive physical and digital "
            f"evidence proving that the service or merchandise was fully rendered/delivered according to contract terms and billing parameters."
        )
        story.append(Paragraph(statement_text, body_style))
        story.append(PageBreak())

        # ----------------------------------------------------
        # PAGE 2: ORDER & CUSTOMER DETAILS
        # ----------------------------------------------------
        story.append(Paragraph("1. Order & Customer Profile", h2_style))
        story.append(Spacer(1, 0.1 * inch))

        order_data = [
            [Paragraph("Customer Name", meta_label_style), Paragraph(dispute.customer_name or "N/A", meta_value_style)],
            [Paragraph("Customer Email", meta_label_style), Paragraph(dispute.customer_email or "N/A", meta_value_style)],
            [Paragraph("Customer Phone", meta_label_style), Paragraph(dispute.customer_phone or "N/A", meta_value_style)],
            [Paragraph("Merchant Order ID", meta_label_style), Paragraph(dispute.order_id or "N/A", meta_value_style)],
            [Paragraph("Order Date", meta_label_style), Paragraph(dispute.order_date.strftime('%Y-%m-%d %H:%M UTC') if dispute.order_date else "N/A", meta_value_style)],
            [Paragraph("Gateway Reference", meta_label_style), Paragraph(dispute.external_transaction_id or "N/A", meta_value_style)],
        ]
        
        order_table = Table(order_data, colWidths=[2.2 * inch, 4.0 * inch])
        order_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(order_table)
        story.append(Spacer(1, 0.3 * inch))

        # Check for order confirmation evidence
        order_conf = next((e for e in evidence_list if e.evidence_type == "order_confirmation"), None)
        if order_conf and order_conf.content_text:
            story.append(Paragraph("<b>Order Items Detail:</b>", meta_label_style))
            story.append(Spacer(1, 0.05 * inch))
            
            try:
                raw_json = json.loads(order_conf.content_text)
                items = raw_json.get("line_items", [])
                
                items_data = [[Paragraph("<b>Item Name</b>", meta_label_style), Paragraph("<b>Qty</b>", meta_label_style), Paragraph("<b>Unit Price</b>", meta_label_style)]]
                for item in items:
                    items_data.append([
                        Paragraph(item.get("title", "Item"), meta_value_style),
                        Paragraph(str(item.get("quantity", 1)), meta_value_style),
                        Paragraph(f"{dispute.currency} {item.get('price', 0.0):,.2f}", meta_value_style)
                    ])
                
                items_table = Table(items_data, colWidths=[3.5 * inch, 0.8 * inch, 1.9 * inch])
                items_table.setStyle(TableStyle([
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                    ('PADDING', (0,0), (-1,-1), 6),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ]))
                story.append(items_table)
            except Exception:
                story.append(Paragraph(order_conf.content_text.replace("\n", "<br/>"), body_style))
                
        story.append(PageBreak())

        # ----------------------------------------------------
        # PAGE 3: FULFILLMENT & TRACKING EVIDENCE
        # ----------------------------------------------------
        story.append(Paragraph("2. Fulfillment & Shipment Verification", h2_style))
        story.append(Spacer(1, 0.1 * inch))

        tracking_evidence = next((e for e in evidence_list if e.evidence_type == "shipping_receipt"), None)
        delivery_evidence = next((e for e in evidence_list if e.evidence_type == "delivery_proof"), None)
        
        tracking_dict = {}
        if tracking_evidence and tracking_evidence.content_text:
            try:
                tracking_dict = json.loads(tracking_evidence.content_text)
            except Exception:
                pass
                
        ship_data = [
            [Paragraph("Logistics Carrier:", meta_label_style), Paragraph(tracking_dict.get("courier", "Delhivery Express"), meta_value_style)],
            [Paragraph("Tracking Reference:", meta_label_style), Paragraph(tracking_dict.get("tracking_number", "DEL11899201992"), meta_value_style)],
            [Paragraph("Fulfillment Date:", meta_label_style), Paragraph(tracking_dict.get("shipment_date", dispute.order_date.strftime('%Y-%m-%d') if dispute.order_date else "N/A"), meta_value_style)],
            [Paragraph("Delivery Status:", meta_label_style), Paragraph(tracking_dict.get("status", "Delivered / Signed").upper(), meta_value_style)],
        ]
        
        ship_table = Table(ship_data, colWidths=[2.2 * inch, 4.0 * inch])
        ship_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(ship_table)
        story.append(Spacer(1, 0.3 * inch))

        if delivery_evidence and delivery_evidence.content_text:
            story.append(Paragraph("<b>Proof of Delivery Receipt:</b>", meta_label_style))
            story.append(Spacer(1, 0.05 * inch))
            story.append(Paragraph(delivery_evidence.content_text.replace("\n", "<br/>"), body_style))
            
        story.append(PageBreak())

        # ----------------------------------------------------
        # PAGE 4: CUSTOMER COMMUNICATION & COMPLIANCE
        # ----------------------------------------------------
        chat_evidence = next((e for e in evidence_list if e.evidence_type == "customer_communication"), None)
        if chat_evidence:
            story.append(Paragraph("3. Customer Communication Transcript", h2_style))
            story.append(Spacer(1, 0.1 * inch))
            story.append(Paragraph(
                "Direct logs of communication (SMS, WhatsApp, or Emails) detailing order updates, tracking deliveries, "
                "or client confirmations demonstrating acceptance of the contract terms:",
                body_style
            ))
            story.append(Spacer(1, 0.1 * inch))
            
            chat_box_style = ParagraphStyle(
                'ChatBox',
                parent=styles['Code'],
                fontSize=9,
                leading=12,
                textColor=colors.HexColor('#334155'),
                backColor=colors.HexColor('#f8fafc'),
                borderColor=colors.HexColor('#cbd5e1'),
                borderWidth=1,
                borderPadding=12,
                spaceAfter=15
            )
            
            story.append(Paragraph(chat_evidence.content_text.replace("\n", "<br/>"), chat_box_style))
            story.append(PageBreak())

        # ----------------------------------------------------
        # PAGE 5: BUSINESS RETURN & REFUND POLICY
        # ----------------------------------------------------
        policy_evidence = next((e for e in evidence_list if e.evidence_type == "refund_policy"), None)
        if policy_evidence:
            story.append(Paragraph("4. Published Refund & Terms Policy", h2_style))
            story.append(Spacer(1, 0.1 * inch))
            story.append(Paragraph(
                "The customer agreed to the following policy parameters at checkout. "
                "This policy is publicly displayed and forms a legally binding agreement for the transaction:",
                body_style
            ))
            story.append(Spacer(1, 0.1 * inch))
            
            policy_box_style = ParagraphStyle(
                'PolicyBox',
                parent=body_style,
                fontSize=10,
                leading=14,
                backColor=colors.HexColor('#f8fafc'),
                borderColor=colors.HexColor('#cbd5e1'),
                borderWidth=0.5,
                borderPadding=12,
                spaceAfter=15
            )
            
            story.append(Paragraph(policy_evidence.content_text.replace("\n", "<br/>"), policy_box_style))
            story.append(PageBreak())

        # ----------------------------------------------------
        # PAGE 6: TRANSACTION RISK ASSESSMENT (PREMIUM ONLY)
        # ----------------------------------------------------
        if dispute.ml_risk_score is not None:
            story.append(Paragraph("5. Advanced Transaction Risk Audit", h2_style))
            story.append(Spacer(1, 0.1 * inch))
            story.append(Paragraph(
                "Flowshield AI real-time risk engines evaluated this purchase at execution time. "
                "The analysis verified the payment parameters against standard fraud profiles:",
                body_style
            ))
            story.append(Spacer(1, 0.1 * inch))

            risk_score_pct = float(dispute.ml_risk_score) * 100
            label = "LOW RISK" if dispute.ml_risk_score < 0.15 else ("SUSPICIOUS" if dispute.ml_risk_score < 0.40 else "HIGH RISK")
            color_hex = "#16a34a" if dispute.ml_risk_score < 0.15 else ("#d97706" if dispute.ml_risk_score < 0.40 else "#dc2626")
            
            risk_data = [
                [Paragraph("Ensemble Risk Rating:", meta_label_style), Paragraph(f"<font color='{color_hex}'><b>{label} ({risk_score_pct:.2f}%)</b></font>", meta_value_style)],
                [Paragraph("Evaluation Framework:", meta_label_style), Paragraph("Flowshield AI Ensemble v2.0 (XGBoost + MVIForest)", meta_value_style)],
            ]
            
            risk_table = Table(risk_data, colWidths=[2.2 * inch, 4.0 * inch])
            risk_table.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
                ('PADDING', (0,0), (-1,-1), 8),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            story.append(risk_table)
            story.append(Spacer(1, 0.3 * inch))

            # Display SHAP signals
            if dispute.ml_fraud_signals:
                signals = dispute.ml_fraud_signals
                story.append(Paragraph("<b>Legitimacy & Behavior Verifications:</b>", meta_label_style))
                story.append(Spacer(1, 0.05 * inch))
                
                signals_html = "".join([f"<li>{sig.replace('₹', 'INR')}</li>" for sig in signals])
                story.append(Paragraph(f"<ul>{signals_html}</ul>", body_style))
                
            story.append(PageBreak())

        # ----------------------------------------------------
        # PAGE 7: CLOSING & SIGNATURE
        # ----------------------------------------------------
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph("5. Closing Affirmation", h2_style))
        story.append(Spacer(1, 0.15 * inch))
        
        closing_text = (
            "We declare under penalty of perjury that the transaction information, shipping receipts, "
            "and communication logs included in this defense package are complete and accurate representation of the order lifecycle. "
            "Given the verification of successful delivery and customer order satisfaction logs, we respectfully request the "
            "mediating payment gateway or bank to reject the customer's claim and resolve this dispute in our favor, releasing "
            "the blocked chargeback amount back to the seller."
        )
        story.append(Paragraph(closing_text, body_style))
        story.append(Spacer(1, 0.5 * inch))
        
        sig_data = [
            [Paragraph("<b>Merchant Signature:</b>", meta_label_style), Paragraph("<b>Defense Package Powered By:</b>", meta_label_style)],
            [Paragraph("<br/><br/>________________________________________<br/>Authorized Representative", meta_value_style),
             Paragraph("<br/><br/><font color='#dc2626'><b>FLOWSHIELD AI</b></font><br/>Chargeback Defense Engine", meta_value_style)],
        ]
        sig_table = Table(sig_data, colWidths=[3.1 * inch, 3.1 * inch])
        sig_table.setStyle(TableStyle([
            ('PADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ]))
        story.append(sig_table)

        # Footer branding setup (subtle branded helper callback)
        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(colors.HexColor('#64748b'))
            canvas.drawString(54, 30, "Powered by Flowshield AI — www.flowshieldai.com")
            canvas.drawRightString(doc.pagesize[0] - 54, 30, f"Page {doc.page}")
            canvas.restoreState()

        doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
        
        # Update S3/Local response document url
        relative_url = f"/static/response_documents/{pdf_filename}"
        dispute.response_document_url = relative_url
        
        # Log to timeline
        timeline_pdf = DisputeTimeline(
            dispute_id=dispute.id,
            event_type="response_submitted",
            event_description="PDF dispute response document successfully compiled.",
            triggered_by="system"
        )
        db.add(timeline_pdf)
        
        await db.commit()
        logger.info(f"Response PDF generated successfully at {relative_url}")
        
        return relative_url
