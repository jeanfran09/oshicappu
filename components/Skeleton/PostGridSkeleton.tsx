export default function PostGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: 18 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square animate-pulse bg-foreground/10"
        />
      ))}
    </div>
  );
}