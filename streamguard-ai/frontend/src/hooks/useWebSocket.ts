import { useAuthStore } from '../store/authStore';

export const useWebSocket = () => {
    const addAlertFromSocket = useAlertStore(state => state.addAlertFromSocket);
    const { accessToken } = useAuthStore();

    useEffect(() => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
