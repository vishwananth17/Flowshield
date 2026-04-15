import razorpay
from app.core.config import get_settings
import logging

logger = logging.getLogger("streamguard")

class PaymentService:
    def __init__(self):
        settings = get_settings()
        self.key_id = settings.razorpay_key_id
        self.key_secret = settings.razorpay_key_secret
        
        if self.key_id and self.key_secret:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
        else:
            self.client = None
            logger.warning("⚠️ Razorpay keys not found in settings!")

    async def create_order(self, amount: int, currency: str = "INR"):
        """
        Creates a Razorpay order. Amount should be in paise (e.g., 50000 for ₹500).
        """
        if not self.client:
            raise ValueError("Razorpay client not initialized. Check your credentials.")

        try:
            data = {
                "amount": amount,
                "currency": currency,
                "payment_capture": 1 # Auto-capture payment
            }
            order = self.client.order.create(data=data)
            return order
        except Exception as e:
            logger.error(f"❌ Razorpay Order Error: {str(e)}")
            raise e

    def verify_signature(self, payment_id: str, order_id: str, signature: str):
        """
        Verifies that the payment actually came from Razorpay.
        """
        try:
            params_dict = {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            }
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except Exception:
            return False

payment_service = PaymentService()
