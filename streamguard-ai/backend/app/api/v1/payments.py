from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.payment import payment_service
import logging

router = APIRouter()
logger = logging.getLogger("streamguard")

class OrderCreateRequest(BaseModel):
    plan_name: str
    amount: int  # Amount in paise (e.g. 9900 for ₹99)

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/order")
async def create_payment_order(request: OrderCreateRequest):
    """Creates a new Razorpay order for the frontend checkout"""
    try:
        order = await payment_service.create_order(
            amount=request.amount,
            currency="INR"
        )
        return {"status": "success", "order": order}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_payment(request: PaymentVerifyRequest):
    """Verifies a successful Razorpay payment signature"""
    is_valid = payment_service.verify_signature(
        payment_id=request.razorpay_payment_id,
        order_id=request.razorpay_order_id,
        signature=request.razorpay_signature
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    # 🏆 SUCCESS! Here you would normally update the user's status in the database
    logger.info(f"✅ Payment Verified! Order: {request.razorpay_order_id}, Payment: {request.razorpay_payment_id}")
    
    return {"status": "success", "message": "Payment verified successfully"}
