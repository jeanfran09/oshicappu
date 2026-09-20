import Divider from "../Divider";

export default function NotificationSkeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index}>
          <div className="flex w-full items-center gap-3 p-4">
            {/* User Avatar */}
            <div className="h-12 w-12 shrink-0 rounded-full bg-foreground/10" />

            {/* Notification Content */}
            <div className="min-w-0 flex-1">
              <div className="h-4 w-4/5 rounded bg-foreground/10" />
              <div className="mt-1.5 h-4 w-3/5 rounded bg-foreground/5" />
              <div className="mt-2 h-3 w-12 rounded bg-foreground/5" />
            </div>

            {/* Post Preview */}
            <div className="h-[50px] w-[50px] shrink-0 rounded-md bg-foreground/10" />
          </div>

          {index < 5 && <Divider />}
        </div>
      ))}
    </div>
  );
}