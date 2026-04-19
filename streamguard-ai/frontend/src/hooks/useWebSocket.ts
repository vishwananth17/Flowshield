import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAlertStore } from '../stores/alertStore';
import { useTransactionStore } from '../stores/transactionStore';
import { toast } from 'sonner';

export const useWebSocket = () => {
    const addAlertFromSocket = useAlertStore(state => state.addAlertFromSocket);
    const addTransactionFromSocket = useTransactionStore(state => state.addTransactionFromSocket);
    const { accessToken } = useAuthStore();

    useEffect(() => {
        const isProduction = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('flowshieldai.com');
        const defaultBaseURL = isProduction 
            ? 'https://flowshield-backend-ani8.onrender.com' 
            : 'http://localhost:8000';

        const baseUrl = import.meta.env.VITE_API_URL || defaultBaseURL;
        const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsBase = baseUrl.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}://${wsBase}/api/v1/feed/ws${accessToken ? `?token=${accessToken}` : ''}`;
            
        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'new_alert') {
                    const alert = payload.alert;
                    addAlertFromSocket(alert);
                    
                    // Toast notifications disabled for a cleaner developer experience
                    /*
                    if (alert.severity === 'critical' || alert.severity === 'high') {
                        toast.error(`New ${alert.severity} alert: ${alert.title}`, {
                            description: alert.description,
                            action: {
                                label: 'Review',
                                onClick: () => window.location.href = '/dashboard/alerts'
                            },
                        });
                        
                        // play sound if critical
                        if (alert.severity === 'critical') {
                            const audio = new Audio('/alert.mp3');
                            audio.play().catch(() => {});
                        }
                    } else {
                        toast(`New Alert: ${alert.title}`, {
                            description: alert.description
                        });
                    }
                    */
                } else if (payload.type === 'new_transaction') {
                    addTransactionFromSocket(payload.data);
                }
            } catch (err) {
                console.error("WS message error", err);
            }
        };

        // Ping interval mechanism to keep connection alive across proxy layers like Railway
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            ws.close();
        };
    }, [addAlertFromSocket, addTransactionFromSocket, accessToken]);
};

