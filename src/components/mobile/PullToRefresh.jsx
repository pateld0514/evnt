import React, { useState, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pullDistance = useRef(0);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === 0) return;
    
    currentY.current = e.touches[0].clientY;
    pullDistance.current = currentY.current - startY.current;

    if (pullDistance.current > 0 && window.scrollY === 0) {
      setPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance.current > 80 && !refreshing) {
      setRefreshing(true);
      setPulling(false);
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    } else {
      setPulling(false);
    }
    
    startY.current = 0;
    pullDistance.current = 0;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {(pulling || refreshing) && (
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 z-50">
          {refreshing ? (
            <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          ) : (
            <RefreshCw className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )}
      {children}
    </div>
  );
}