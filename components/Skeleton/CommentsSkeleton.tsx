"use client";

type CommentsSkeletonProps = {
  count?: number;
};

export default function CommentsSkeleton({
  count = 5,
}: CommentsSkeletonProps) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: count }).map((_, index) => {
        const isReply = index === 1 || index === 4;

        return (
          <div
            key={index}
            className={`flex gap-3 py-3 ${
              isReply ? "ml-10" : ""
            }`}
          >
            {/* Avatar */}
            <div className="h-9 w-9 shrink-0 rounded-full bg-foreground/10" />

            {/* Comment */}
            <div className="min-w-0 flex-1">
              {/* Username */}
              <div className="h-3.5 w-20 rounded bg-foreground/10" />

              {/* Comment text */}
              <div className="mt-1.5 h-4 w-4/5 rounded bg-foreground/10" />

              {/* Time / reply */}
              <div className="mt-1.5 h-3 w-16 rounded bg-foreground/5" />
            </div>

            {/* More/options button */}
            <div className="h-5 w-5 shrink-0 rounded bg-foreground/5" />
          </div>
        );
      })}
    </div>
  );
}