export default function HashtagSkeleton() {
  return (
    <div className="animate-pulse px-2">
      {Array.from({ length: 15 }).map((_, index) => (
        <div
          key={index}
          className="flex w-full items-center rounded-lg px-3 py-4"
        >
          <div className="h-4 w-50 rounded bg-foreground/10" />
        </div>
      ))}
    </div>
  );
}