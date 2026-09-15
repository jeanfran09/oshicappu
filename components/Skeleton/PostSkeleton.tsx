export default function PostSkeleton() {
  return (
    <article className="bg-background animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 shrink-0 rounded-full bg-foreground/10" />

          <div>
            {/* Username */}
            <div className="h-3.5 w-24 rounded bg-foreground/10" />
          </div>
        </div>

      </div>

      {/* Post Image */}
      <div className="aspect-square w-full bg-foreground/10" />


      {/* Caption */}
      <div className="space-y-2 px-3 pt-2">
        <div className="h-3.5 w-4/5 rounded bg-foreground/10" />
        <div className="h-3.5 w-3/5 rounded bg-foreground/10" />
      </div>

      {/* Oshis */}
      <div className="flex gap-2 px-3 pt-2">
        <div className="h-9 w-24 rounded-full bg-foreground/10" />
        <div className="h-9 w-28 rounded-full bg-foreground/10" />
      </div>

      {/* Hashtags */}
      <div className="flex gap-3 px-3 pt-2">
        <div className="h-3.5 w-16 rounded bg-foreground/10" />
        <div className="h-3.5 w-20 rounded bg-foreground/10" />
        <div className="h-3.5 w-14 rounded bg-foreground/10" />
      </div>

      {/* Time */}
      <div className="px-3 pb-4 pt-1">
        <div className="h-3.5 w-16 rounded bg-foreground/10" />
      </div>
    </article>
  );
}