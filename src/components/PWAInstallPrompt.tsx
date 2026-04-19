import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA Update handling
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker registered: ${swUrl}`, r);
    },
    onOfflineReady() {
      console.log('App ready for offline use');
    },
  });

  // Install prompt handling
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowUpdatePrompt(false);
  };

  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);

  if (!showInstallPrompt && !showUpdatePrompt) return null;

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-sm">
            <Download className="text-[#1DB954] flex-shrink-0" size={24} />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Install SpotifyHelper</p>
              <p className="text-zinc-400 text-xs">Get quick access to your playlists</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              <button
                onClick={handleInstall}
                className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-4 py-2 rounded-full text-sm transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-sm">
            <Download className="text-[#1DB954] flex-shrink-0" size={24} />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">New version available</p>
              <p className="text-zinc-400 text-xs">Update to get the latest features</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUpdatePrompt(false)}
                className="p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              <button
                onClick={handleUpdate}
                className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-4 py-2 rounded-full text-sm transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
