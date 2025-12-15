import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Snackbar, Button, Box, Typography, Slide } from '@mui/material';
import { Refresh, Download, WifiOff, CheckCircle } from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [showOfflineNotification, setShowOfflineNotification] = useState(false);
    const [installSuccess, setInstallSuccess] = useState(false);

    // Register service worker with auto-update
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        offlineReady: [offlineReady, setOfflineReady],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, registration) {
            console.log('[PWA] Service Worker registrado:', swUrl);

            // Check for updates every hour
            if (registration) {
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.error('[PWA] Erro no registro do SW:', error);
        },
    });

    // Listen for install prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show install prompt after a delay (don't interrupt user immediately)
            setTimeout(() => {
                setShowInstallPrompt(true);
            }, 3000);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setShowInstallPrompt(false);
            setInstallSuccess(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Listen for online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowOfflineNotification(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setShowOfflineNotification(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('[PWA] Usuário aceitou a instalação');
        } else {
            console.log('[PWA] Usuário recusou a instalação');
        }

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    const handleCloseOfflineReady = () => {
        setOfflineReady(false);
    };

    return (
        <>
            {/* Update Available Notification */}
            <Snackbar
                open={needRefresh}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                TransitionComponent={Slide}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 3,
                        py: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(50, 240, 140, 0.15) 0%, rgba(50, 240, 140, 0.05) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(50, 240, 140, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <Refresh sx={{ color: '#32F08C', animation: 'spin 2s linear infinite' }} />
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                            Nova versão disponível
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Clique para atualizar o OnliOps
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleUpdate}
                        sx={{
                            ml: 2,
                            background: 'linear-gradient(135deg, #32F08C 0%, #28C76F 100%)',
                            color: '#0A0B0D',
                            fontWeight: 600,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #28C76F 0%, #32F08C 100%)',
                            },
                        }}
                    >
                        Atualizar
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setNeedRefresh(false)}
                        sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 'auto', px: 1 }}
                    >
                        ✕
                    </Button>
                </Box>
            </Snackbar>

            {/* Install Prompt */}
            <Snackbar
                open={showInstallPrompt && !!deferredPrompt}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                TransitionComponent={Slide}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 3,
                        py: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <Download sx={{ color: '#6366F1' }} />
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                            Instalar OnliOps
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Acesse mais rápido e use offline
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleInstall}
                        sx={{
                            ml: 2,
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            fontWeight: 600,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                            },
                        }}
                    >
                        Instalar
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setShowInstallPrompt(false)}
                        sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 'auto', px: 1 }}
                    >
                        ✕
                    </Button>
                </Box>
            </Snackbar>

            {/* Offline Ready Notification */}
            <Snackbar
                open={offlineReady}
                autoHideDuration={4000}
                onClose={handleCloseOfflineReady}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                TransitionComponent={Slide}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 3,
                        py: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(50, 240, 140, 0.15) 0%, rgba(50, 240, 140, 0.05) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(50, 240, 140, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <CheckCircle sx={{ color: '#32F08C' }} />
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                        App pronto para uso offline!
                    </Typography>
                </Box>
            </Snackbar>

            {/* Offline Status Notification */}
            <Snackbar
                open={showOfflineNotification && isOffline}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                TransitionComponent={Slide}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 3,
                        py: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <WifiOff sx={{ color: '#F59E0B' }} />
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                            Você está offline
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Algumas funcionalidades podem estar limitadas
                        </Typography>
                    </Box>
                    <Button
                        size="small"
                        onClick={() => setShowOfflineNotification(false)}
                        sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 'auto', px: 1 }}
                    >
                        ✕
                    </Button>
                </Box>
            </Snackbar>

            {/* Install Success Notification */}
            <Snackbar
                open={installSuccess}
                autoHideDuration={4000}
                onClose={() => setInstallSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                TransitionComponent={Slide}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 3,
                        py: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(50, 240, 140, 0.15) 0%, rgba(50, 240, 140, 0.05) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(50, 240, 140, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                >
                    <CheckCircle sx={{ color: '#32F08C' }} />
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                        OnliOps instalado com sucesso! 🎉
                    </Typography>
                </Box>
            </Snackbar>

            {/* CSS Animation for refresh icon */}
            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
}
