from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_db
from app.models.waitlist import Waitlist
from app.services.email import email_service
from pydantic import BaseModel

router = APIRouter(tags=["Waitlist"])

class WaitlistRequest(BaseModel):
    email: str
    company: str | None = None

@router.post("")
async def join_waitlist(
    body: WaitlistRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    background_tasks: BackgroundTasks
):
    result = await db.execute(select(Waitlist).filter(Waitlist.email == body.email))
    existing = result.scalar_one_or_none()
    
    if existing:
        return {"status": "success", "message": "Already on the waitlist!"}
        
    new_entry = Waitlist(email=body.email, company=body.company)
    db.add(new_entry)
    await db.commit()
    
    # Send welcome email to new subscribers
    background_tasks.add_task(email_service.send_welcome_email, body.email)
    
    return {"status": "success", "message": "Added to waitlist"}
    
@router.get("/debug-list")
async def get_waitlist_debug(
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Temporary debug endpoint to see signed up emails"""
    result = await db.execute(select(Waitlist))
    entries = result.scalars().all()
    return {
        "count": len(entries),
        "entries": [{"email": e.email, "company": e.company, "created_at": e.created_at} for e in entries]
    }
