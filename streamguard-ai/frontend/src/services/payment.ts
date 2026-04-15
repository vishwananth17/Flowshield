import axios from 'axios';
import { API_BASE_URL } from './api';

export const createPaymentOrder = async (planName: string, amount: number) => {
    const response = await axios.post(`${API_BASE_URL}/payments/order`, {
        plan_name: planName,
        amount: amount
    });
    return response.data.order;
};

export const verifyPayment = async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}) => {
    const response = await axios.post(`${API_BASE_URL}/payments/verify`, paymentData);
    return response.data;
};

export const loadRazorpayCheckout = (options: any) => {
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
};
