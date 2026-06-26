import api from './api';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
        resolve(true);
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export async function subscribeToPlan(
  plan: 'basic' | 'standard' | 'premium',
  interval: 'monthly' | 'annual'
): Promise<void> {
  try {
    // 1. Create subscription on backend
    const { data } = await api.post('/billing/create-subscription', { plan, interval });

    // 2. If Razorpay returned a hosted checkout URL, use it directly.
    //    This works even when UPI Autopay / e-Mandate is not yet enabled on the
    //    merchant account (the SDK-based QR keeps loading in that case).
    if (data.short_url) {
      window.location.href = data.short_url;
      return;
    }

    // 3. Fallback: load SDK and open in-page checkout
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('Razorpay SDK failed to load. Check your internet connection.');
      throw new Error('Razorpay SDK failed to load');
    }

    const user = useAuthStore.getState().user;
    const options = {
      key: data.razorpay_key_id,
      subscription_id: data.subscription_id,
      name: 'Flowshield AI',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — ${interval}`,
      image: 'https://flowshield-ai.vercel.app/favicon.svg',
      currency: 'INR',
      theme: { color: '#6366F1' },
      prefill: {
        name:    user?.full_name  || 'Flowshield User',
        email:   user?.email      || '',
        contact: (user as any)?.phone || '9999999999',
      },
      notes: { plan, interval, org_id: user?.org_id || '' },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await api.post('/billing/verify-payment', response);
          await useAuthStore.getState().refreshUser();
          toast.success(`Upgraded to ${plan} plan successfully!`);
          window.location.href = '/dashboard';
        } catch (err: any) {
          toast.error(err.response?.data?.detail || 'Verification failed');
        }
      },
      modal: {
        ondismiss: () => toast.error('Payment cancelled.'),
        escape: true,
        animation: true,
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      const reason = response.error?.description || response.error?.reason || 'Payment failed';
      toast.error(`Payment failed: ${reason}`);
      console.error('Razorpay payment.failed:', response.error);
    });
    rzp.open();
  } catch (error: any) {
    console.error('Subscription error:', error);
    toast.error(error.response?.data?.detail || 'Failed to initiate subscription');
  }
}
