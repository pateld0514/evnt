import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";
import { toast } from "sonner";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('EVNT installed! Open from your home screen.');
    }
    
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg shadow-2xl z-40 border-2 border-white">
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <p className="font-bold mb-1">Install EVNT App</p>
          <p className="text-xs text-purple-100 mb-3">
            Add to your home screen for quick access and offline viewing
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-white text-purple-600 hover:bg-purple-50 font-bold text-xs h-8"
            >
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInstall(false)}
              className="text-white hover:bg-purple-700 font-bold text-xs h-8"
            >
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShareButton({ title, text, url }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'EVNT',
          text: text || 'Check out this vendor on EVNT!',
          url: url || window.location.href
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          navigator.clipboard.writeText(url || window.location.href);
          toast.success("Link copied to clipboard!");
        }
      }
    } else {
      navigator.clipboard.writeText(url || window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className="border-2 border-black hover:bg-black hover:text-white font-bold"
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share
    </Button>
  );
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        toast.success('Notifications enabled! You\'ll get updates for bookings and messages.');
      }
    });
  }
}