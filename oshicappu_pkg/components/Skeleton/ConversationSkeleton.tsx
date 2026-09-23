"use client";

export default function ConversationSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {/* Left message */}
      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <div className="h-14 w-40 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Right message */}
      <div className="flex justify-end">
        <div className="max-w-[75%] space-y-2">
          <div className="h-14 w-52 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Left message */}
      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <div className="h-18 w-56 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Right message */}
      <div className="flex justify-end">
        <div className="max-w-[75%] space-y-2">
          <div className="h-14 w-44 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Left message */}
      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <div className="h-14 w-48 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Right message */}
      <div className="flex justify-end">
        <div className="max-w-[75%] space-y-2">
          <div className="h-20 w-60 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Left message */}
      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <div className="h-14 w-36 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Right message */}
      <div className="flex justify-end">
        <div className="max-w-[75%] space-y-2">
          <div className="h-14 w-52 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Left message */}
      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <div className="h-30 w-52 rounded-2xl bg-foreground/10" />
        </div>
      </div>

      {/* Right message */}
      <div className="flex justify-end">
        <div className="max-w-[75%] space-y-2">
          <div className="h-14 w-52 rounded-2xl bg-foreground/10" />
        </div>
      </div>
    </div>
  );
}