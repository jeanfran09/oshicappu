export default function EventListSkeleton() {
  return (
    <section className="space-y-3 px-4">
      {Array.from({ length: 3 }).map(
        (_, index) => (
          <div
            key={index}
            className="w-full overflow-hidden rounded-2xl border border-foreground/10 bg-accent/10"
          >
            {/* Image */}
            <div className="h-40 w-full animate-pulse bg-foreground/10" />

            {/* Information */}
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-foreground/10" />

              <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/10" />

              <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />

              <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 px-4 pb-4">
              <div className="h-10 flex-1 animate-pulse rounded-full bg-foreground/10" />

              <div className="h-10 flex-1 animate-pulse rounded-full bg-foreground/10" />

              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-foreground/10" />
            </div>
          </div>
        )
      )}
    </section>
  );
}