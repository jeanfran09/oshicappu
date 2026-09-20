type UserListSkeletonProps = {
  showFollowButton?: boolean;
};

export default function UserListSkeleton({
  showFollowButton = true,
}: UserListSkeletonProps) {
  return (
    <div className="animate-pulse space-y-1 ml-2 mr-2">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2"
        >
          {/* User information */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Avatar */}
            <div className="h-17 w-17 shrink-0 rounded-full bg-foreground/10" />

            {/* Username + display name */}
            <div className="min-w-0">
              <div className="h-4 w-24 rounded bg-foreground/10" />

              <div className="mt-1.5 h-4 w-32 rounded bg-foreground/5" />
            </div>
          </div>

          {/* Follow button */}
          {showFollowButton && (
            <div className="h-9 w-27 shrink-0 rounded-lg bg-foreground/10" />
          )}
        </div>
      ))}
    </div>
  );
}