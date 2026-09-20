"use client";

import Divider from "@/components/Divider";

type MessagesSkeletonProps = {
  count?: number;
};

export default function MessagesSkeleton({
  count = 10,
}: MessagesSkeletonProps) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <div className="flex w-full items-center gap-3 p-4">
            {/* Avatar */}
            <div className="h-12 w-12 shrink-0 rounded-full bg-foreground/10" />

            {/* Name + message */}
            <div className="min-w-0 flex-1">
              <div className="h-4 w-32 rounded bg-foreground/10" />

              <div className="mt-2 h-4 w-4/5 rounded bg-foreground/5" />
            </div>

            {/* Time*/}
            <div className="flex shrink-0 flex-col items-end gap-2">
              <div className="h-3 w-10 rounded bg-foreground/5" />
            </div>
          </div>

          {index < count - 1 && <Divider />}
        </div>
      ))}
    </div>
  );
}