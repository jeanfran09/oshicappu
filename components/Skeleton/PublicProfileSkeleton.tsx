import OshiListSkeleton from "@/components/Skeleton/OshiListSkeleton";
import PostGridSkeleton from "@/components/Skeleton/PostGridSkeleton";

export default function PublicProfileSkeleton() {
  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full">
          <div className="h-5 w-5 rounded bg-foreground/10 animate-pulse" />
        </div>

        {/* Username */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          username
        </h1>
      </header>

      {/* Banner */}
      <div className="h-32 w-full bg-foreground/10 animate-pulse" />

      {/* Profile Content */}
      <div className="px-4">
        <div className="relative z-10 -mt-12 flex items-center gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 shrink-0 rounded-full border-4 border-background bg-foreground/10 animate-pulse" />

          {/* Stats */}
          <div className="flex-1 translate-y-8">
            <div className="flex justify-around">
              {/* Posts */}
              <div className="text-center">
                <p className="font-semibold">0</p>
                <p className="text-xs">Posts</p>
              </div>

              {/* Followers */}
              <div className="text-center">
                <p className="font-semibold">0</p>
                <p className="text-xs">Followers</p>
              </div>

              {/* Following */}
              <div className="text-center">
                <p className="font-semibold">0</p>
                <p className="text-xs">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Name + Bio */}
        <div className="mt-2 space-y-1">
          <p className="font-semibold">
            display name
          </p>

          <p className="whitespace-pre-line text-sm text-foreground/70">
            bio.
          </p>
        </div>

        {/* Follow + Message Buttons */}
        <div className="mt-3 flex gap-2">
        <div className="flex h-9 flex-1 items-center justify-center rounded-lg bg-accent px-4 text-base font-medium">
            Follow
        </div>

        <div className="flex h-9 flex-1 items-center justify-center rounded-lg border border-foreground/20 px-4 text-base font-medium">
            Message
        </div>
        </div>

        {/* Oshis */}
        <OshiListSkeleton showAdd={false} />
      </div>

      {/* Post Divider */}
      <div className="mt-2 border-t border-foreground/10" />

      {/* Posts */}
      <PostGridSkeleton />
    </div>
  );
}