from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.dependencies import get_db
from app.models.waitlist import Waitlist
from pydantic import BaseModel

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])

class WaitlistRequest(BaseModel):
    email: str
    company: str | None = None

@router.post("")
async def join_waitlist(
    body: WaitlistRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    result = await db.execute(select(Waitlist).filter(Waitlist.email == body.email))
    existing = result.scalar_one_or_none()
    
    if existing:
        return {"status": "success", "message": "Already on the waitlist!"}
        
    new_entry = Waitlist(email=body.email, company=body.company)
    db.add(new_entry)
    await db.commit()
    
    return {"status": "success", "message": "Added to waitlist"}
