import { useEffect } from 'react';
import { useAlertStore } from '../stores/alertStore';
import { toast } from 'sonner';

export const useWebSocket = () => {
    const addAlertFromSocket = useAlertStore(state => state.addAlertFromSocket);

    useEffect(() => {
        const wsUrl = import.meta.env.VITE_API_URL 
            ? import.meta.env.VITE_API_URL.replace('http', 'ws') + '/api/v1/feed/ws'
            : 'ws://localhost:8000/api/v1/feed/ws';
            
        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'new_alert') {
                    const alert = payload.alert;
                    addAlertFromSocket(alert);
                    
                    // Show toast
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
                            audio.play().catch(() => {}); // system may block auto-play
                        }
                    } else {
                        toast(`New Alert: ${alert.title}`, {
                            description: alert.description
                        });
                    }
                }
            } catch (err) {
                console.error("WS message error", err);
            }
        };

        return () => ws.close();
    }, [addAlertFromSocket]);
};
