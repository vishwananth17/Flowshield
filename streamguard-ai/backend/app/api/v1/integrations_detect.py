from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.platform_detector import detect_platform

router = APIRouter()

class DetectRequest(BaseModel):
    url: str

@router.post("/integrations/detect")
async def detect_website_platform(payload: DetectRequest):
    if not payload.url or not payload.url.strip():
        return {
            "detected": False,
            "platform": "unknown",
            "confidence": "low",
            "store_name": "",
            "supports_oauth": False,
            "error": "URL cannot be empty"
        }
    res = await detect_platform(payload.url)
    return res
