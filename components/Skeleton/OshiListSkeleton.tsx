import { Plus } from "lucide-react";

type OshiListSkeletonProps = {
  showAdd?: boolean;
};

export default function OshiListSkeleton({
  showAdd = true,
}: OshiListSkeletonProps) {
  return (
    <div className="mt-3 space-y-3">
      <h3 className="text-sm font-semibold">
        Oshis
      </h3>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 animate-pulse">
        {/* Oshi Skeletons */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-shrink-0 flex-col items-center gap-2 pb-2"
          >
            <div className="h-16 w-16 rounded-full bg-foreground/10" />
          </div>
        ))}

        {/* Add Oshi */}
        {showAdd && (
          <div className="flex flex-shrink-0 flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-foreground/10">
              <Plus
                size={26}
                className="text-foreground/20"
              />
            </div>

            <span className="text-xs">
              Add
            </span>
          </div>
        )}
      </div>
    </div>
  );
}