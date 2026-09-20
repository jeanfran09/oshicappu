type PostGridSkeletonProps = {
  count?: number;
};

export default function PostGridSkeleton({
  count = 18,
}: PostGridSkeletonProps) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="aspect-square animate-pulse bg-foreground/10"
        />
      ))}
    </div>
  );
}