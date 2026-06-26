from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.platform_detector import detect_platform

router = APIRouter()

class DetectRequest(BaseModel):
    url: str

@router.post("/integrations/detect")
async def detect_website_platform(payload: DetectRequest):
    if not payload.url:
         raise HTTPException(status_code=422, detail="URL cannot be empty")
    res = await detect_platform(payload.url)
    if "error" in res:
        raise HTTPException(status_code=422, detail=res["error"])
    return res
