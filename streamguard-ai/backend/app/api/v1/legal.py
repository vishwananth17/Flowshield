import uuid
import logging
from typing import Annotated, Literal
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import resend
from app.core.config import get_settings
from app.core.dependencies import CurrentUser
from app.db.session import get_db
from app.models.legal import LegalDocumentVersion, UserLegalAcceptance, PrivacyRequest

logger = logging.getLogger("streamguard")
router = APIRouter(prefix="/legal", tags=["Legal"])

# Initialize resend API key
settings = get_settings()
if settings.resend_api_key:
    resend.api_key = settings.resend_api_key

# Request and Response schemas
class DocumentAcceptRequest(BaseModel):
    document: str
    version: str

class DPARequest(BaseModel):
    company_name: str
    gstin: str
    signatory_name: str
    signatory_title: str
    email: EmailStr

class PrivacyRequestPayload(BaseModel):
    request_type: Literal["access", "erasure", "correction"]
    description: str
    email: EmailStr

@router.get("/documents")
async def get_legal_documents(db: Annotated[AsyncSession, Depends(get_db)]):
    """
    Returns list of all legal documents with their current version and last updated date.
    Checks the database for overridden versions; falls back to default 1.0 versions.
    """
    result = await db.execute(select(LegalDocumentVersion))
    versions = result.scalars().all()
    
    docs = {
        "privacy_policy": {
            "version": "1.0",
            "last_updated": "2026-04-17",
            "url": "https://flowshieldai.com/privacy"
        },
        "terms_of_service": {
            "version": "1.0",
            "last_updated": "2026-04-17",
            "url": "https://flowshieldai.com/terms"
        },
        "dpa": {
            "version": "1.0",
            "last_updated": "2026-04-17",
            "url": "https://flowshieldai.com/dpa"
        },
        "sla": {
            "version": "1.0",
            "last_updated": "2026-04-17",
            "url": "https://flowshieldai.com/sla"
        },
        "cookie_policy": {
            "version": "1.0",
            "last_updated": "2026-04-17",
            "url": "https://flowshieldai.com/cookies"
        },
        "security_policy": {
            "version": "1.0",
            "last_updated": "2026-04-17",
            "url": "https://flowshieldai.com/security"
        }
    }
    
    # Override defaults with DB configurations if present
    for v in versions:
        doc_key = v.document_type
        if doc_key in docs:
            docs[doc_key]["version"] = v.version
            docs[doc_key]["last_updated"] = v.effective_date.isoformat()
            
    return docs

@router.post("/accept")
async def accept_legal_document(
    body: DocumentAcceptRequest,
    current_user: CurrentUser,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Records that the authenticated user has accepted the specified document version.
    """
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    acceptance = UserLegalAcceptance(
        user_id=current_user.id,
        document_type=body.document,
        version=body.version,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(acceptance)
    await db.commit()
    
    return {"status": "success", "message": f"Accepted {body.document} v{body.version}"}

@router.get("/acceptances")
async def get_user_acceptances(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Returns which documents the current user has accepted and when.
    """
    result = await db.execute(
        select(UserLegalAcceptance)
        .where(UserLegalAcceptance.user_id == current_user.id)
    )
    acceptances = result.scalars().all()
    
    doc_types = ["privacy_policy", "terms_of_service", "dpa", "sla", "cookie_policy", "security_policy"]
    res = {}
    
    for doc in doc_types:
        doc_accepts = [a for a in acceptances if a.document_type == doc]
        if doc_accepts:
            # Get latest acceptance
            latest = max(doc_accepts, key=lambda a: a.accepted_at)
            res[doc] = {
                "accepted": True,
                "version": latest.version,
                "accepted_at": latest.accepted_at.isoformat() if latest.accepted_at else None
            }
        else:
            res[doc] = {
                "accepted": False,
                "version": None,
                "accepted_at": None
            }
            
    return res

@router.post("/dpa/request")
async def request_dpa_signing(
    body: DPARequest,
):
    """
    Sends a B2B DPA request notification to legal@flowshieldai.com and returns a reference.
    """
    ref_id = f"DPA-2026-{uuid.uuid4().hex[:6].upper()}"
    
    # Construct email html
    email_html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background-color: #2563eb; padding: 20px; border-radius: 8px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Flowshield AI DPA Request</h1>
        </div>
        <div style="padding: 20px;">
            <h2 style="color: #1e293b;">New DPA Signing Request</h2>
            <p><strong>Reference:</strong> {ref_id}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569;">Company Name:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">{body.company_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569;">GSTIN:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">{body.gstin}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569;">Signatory Name:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">{body.signatory_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569;">Signatory Title:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">{body.signatory_title}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #475569;">Contact Email:</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">{body.email}</td>
                </tr>
            </table>
        </div>
    </div>
    """
    
    if resend.api_key:
        try:
            resend.Emails.send({
                "from": "onboarding@resend.dev",
                "to": ["legal@flowshieldai.com"],
                "subject": f"B2B DPA Signing Request: {body.company_name} ({ref_id})",
                "html": email_html
            })
            logger.info(f"✅ DPA request email sent for reference {ref_id}")
        except Exception as e:
            logger.error(f"❌ Failed to send DPA request email: {str(e)}")
    else:
        logger.info(f"📧 [MOCK EMAIL] DPA Request to legal@flowshieldai.com: {email_html}")
        
    return {
        "reference": ref_id,
        "message": "We will send your signed DPA within 2 business days"
    }

@router.post("/privacy-request")
async def create_privacy_request(
    body: PrivacyRequestPayload,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Creates a DPDP rights request ticket, sends confirmation email to requester,
    sends notification to legal@flowshieldai.com, and returns ticket reference number.
    """
    ref_id = f"PR-2026-{uuid.uuid4().hex[:6].upper()}"
    
    # Save ticket to database
    pr = PrivacyRequest(
        reference=ref_id,
        request_type=body.request_type,
        email=body.email,
        description=body.description,
        status="pending"
    )
    db.add(pr)
    await db.commit()
    
    # 1. Requester confirmation email
    conf_html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background-color: #2563eb; padding: 20px; border-radius: 8px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Flowshield AI Privacy Team</h1>
        </div>
        <div style="padding: 20px;">
            <h2 style="color: #1e293b;">DPDP Rights Request Received</h2>
            <p>Hello,</p>
            <p>We have received your DPDP Act 2023 privacy request. Our team will review and respond to your request within 30 days of receipt.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Request Reference:</strong> {ref_id}</p>
                <p style="margin: 5px 0 0 0;"><strong>Request Type:</strong> {body.request_type.capitalize()}</p>
            </div>
            <p>If you have any questions, please reply to this email.</p>
        </div>
    </div>
    """
    
    # 2. Team notification email
    notify_html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background-color: #ef4444; padding: 20px; border-radius: 8px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Flowshield AI Legal Alert</h1>
        </div>
        <div style="padding: 20px;">
            <h2 style="color: #1e293b;">New DPDP Privacy Rights Request</h2>
            <p><strong>Reference:</strong> {ref_id}</p>
            <p><strong>Requester Email:</strong> {body.email}</p>
            <p><strong>Request Type:</strong> {body.request_type}</p>
            <p><strong>Description:</strong></p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 15px 0; white-space: pre-wrap;">{body.description}</div>
        </div>
    </div>
    """
    
    if resend.api_key:
        try:
            # Send to requester
            resend.Emails.send({
                "from": "onboarding@resend.dev",
                "to": [body.email],
                "subject": f"[Flowshield AI] Privacy Request Received — {ref_id}",
                "html": conf_html
            })
            # Send to team
            resend.Emails.send({
                "from": "onboarding@resend.dev",
                "to": ["legal@flowshieldai.com"],
                "subject": f"DPDP Rights Request Alert: {body.request_type} ({ref_id})",
                "html": notify_html
            })
            logger.info(f"✅ Privacy request emails sent for reference {ref_id}")
        except Exception as e:
            logger.error(f"❌ Failed to send privacy request email: {str(e)}")
    else:
        logger.info(f"📧 [MOCK EMAIL] Privacy Confirmation to {body.email}: {conf_html}")
        logger.info(f"📧 [MOCK EMAIL] Privacy Notification to legal@flowshieldai.com: {notify_html}")
        
    return {"reference": ref_id}
