"use client";

import { ReactNode, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  threshold?: number;
};

export default function PullToRefresh({
  children,
  onRefresh,
  threshold = 120,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const startY = useRef(0);
  const pulling = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (refreshing) return;

    startY.current = e.touches[0].clientY;
    pulling.current =
      (containerRef.current?.scrollTop ?? 0) <= 0;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!pulling.current || refreshing) return;

    const delta = e.touches[0].clientY - startY.current;

    const startThreshold = 15

    if (delta <= 0) {
      setPullDistance(0);
      return;
    }

    // slow the pull for a natural feel
    setPullDistance(Math.min(delta-startThreshold * 0.3, 120));
  }

  async function handleTouchEnd() {
    if (!pulling.current) return;

    if (
      pullDistance >= threshold &&
      onRefresh &&
      !refreshing
    ) {
      setRefreshing(true);

      await onRefresh();

      setRefreshing(false);
    }

    setPullDistance(0);
    pulling.current = false;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: refreshing
            ? "none"
            : "transform 0.2s ease-out",
        }}
      >
        {pullDistance > 0 && (
          <div className="flex justify-center py-3">
            {refreshing ? (
              <Loader2
                size={20}
                className="animate-spin text-foreground"
              />
            ) : (
              <ChevronDown
                size={20}
                className="text-foreground transition-transform"
                style={{
                  transform: `rotate(${Math.min(
                    pullDistance * 2,
                    180
                  )}deg)`,
                }}
              />
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}