import OshiListSkeleton from "@/components/Skeleton/OshiListSkeleton";
import PostGridSkeleton from "@/components/Skeleton/PostGridSkeleton";

export default function ProfileSkeleton() {
  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-foreground/10 bg-background pr-1 py-3">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          username
        </h1>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex h-9 w-9 items-center justify-center">
            <div className="h-5 w-5 rounded bg-foreground/10 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Profile */}
      <div className="px-4">
        {/* Avatar + Stats */}
        <div className="mt-5 flex items-center gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 shrink-0 rounded-full bg-accent animate-pulse" />

          {/* Stats */}
          <div className="flex-1">
            <div className="flex justify-around">
              {/* Posts */}
              <div className="text-center">
                <p className="font-semibold">
                  0
                </p>

                <p className="text-xs">
                  Posts
                </p>
              </div>

              {/* Followers */}
              <div className="text-center">
                <p className="font-semibold">
                  0
                </p>

                <p className="text-xs">
                  Followers
                </p>
              </div>

              {/* Following */}
              <div className="text-center">
                <p className="font-semibold">
                  0
                </p>

                <p className="text-xs">
                  Following
                </p>
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

        {/* Edit Profile */}
        <div className="mt-3 h-10 w-full rounded-lg border border-foreground/20 bg-accent/50 flex items-center justify-center text-base font-medium">
          Edit Profile
        </div>

        {/* Oshis */}
        <OshiListSkeleton />
      </div>

      {/* Profile Tabs */}
      <div className="mt-3 flex border-b border-foreground/10">
        <div className="flex flex-1 items-center justify-center py-3">
          <div className="h-5 w-16 rounded bg-foreground/10 animate-pulse" />
        </div>

        <div className="flex flex-1 items-center justify-center py-3">
          <div className="h-5 w-16 rounded bg-foreground/10 animate-pulse" />
        </div>

        <div className="flex flex-1 items-center justify-center py-3">
          <div className="h-5 w-16 rounded bg-foreground/10 animate-pulse" />
        </div>
      </div>

      {/* Posts */}
      <PostGridSkeleton />
    </div>
  );
}