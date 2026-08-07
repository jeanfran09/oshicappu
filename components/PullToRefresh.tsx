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

  const startX = useRef(0);
  const startY = useRef(0);

  const pulling = useRef(false);
  const decided = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function handleTouchStart(
    e: React.TouchEvent<HTMLDivElement>
  ) {
    if (refreshing) return;

    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;

    pulling.current =
      (containerRef.current?.scrollTop ?? 0) <= 0;

    decided.current = false;
  }


  function handleTouchMove(
    e: React.TouchEvent<HTMLDivElement>
  ) {
    if (!pulling.current || refreshing) return;


    const deltaY =
      e.touches[0].clientY - startY.current;

    const deltaX =
      e.touches[0].clientX - startX.current;


    // Wait until direction is obvious
    if (!decided.current) {

      if (Math.abs(deltaY) < 15) {
        return;
      }


      decided.current = true;


      // If horizontal swipe or scrolling upward,
      // cancel pull-to-refresh
      if (
        deltaY < 0 ||
        Math.abs(deltaX) > Math.abs(deltaY)
      ) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }
    }


    const startThreshold = 20;


    if (deltaY <= startThreshold) {
      setPullDistance(0);
      return;
    }


    // resistance
    setPullDistance(
      Math.min(
        (deltaY - startThreshold) * 0.3,
        120
      )
    );
  }

  async function handleTouchEnd() {
    if (!pulling.current) {
      decided.current = false;
      return;
    }


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
    decided.current = false;
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
                className="animate-spin text-accent"
              />
            ) : (
              <ChevronDown
                size={20}
                className="text-accent transition-transform"
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