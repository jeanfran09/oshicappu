import { ChevronLeft, MapPin, Share2 } from "lucide-react";

export default function PhotoSpotPageSkeleton() {
  return (
    <div className="md:hidden min-h-screen bg-background animate-pulse">
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <ChevronLeft
          size={22}
          className="ml-2"
        />

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Photo Spot
        </h1>

        <Share2
          size={20}
          className="ml-auto mr-4"
        />
      </header>

      <div className="aspect-[16/9] w-full bg-foreground/10" />

      <main className="px-4 pb-24 pt-5">
        <div className="h-7 w-3/4 rounded-md bg-foreground/10" />

        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <MapPin size={19} />
          </div>

          <div>
            <p className="text-sm text-foreground/50">
              Location
            </p>

            <div className="mt-1 h-4 w-40 rounded bg-foreground/10" />
          </div>
        </div>

        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            About this photo spot
          </h3>

          <div className="mt-3 space-y-2">
            <div className="h-4 w-full rounded bg-foreground/10" />
            <div className="h-4 w-full rounded bg-foreground/10" />
            <div className="h-4 w-4/5 rounded bg-foreground/10" />
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold">
            Added by
          </h3>

          <div className="mt-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-foreground/10" />

            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-foreground/10" />
              <div className="h-3 w-24 rounded bg-foreground/10" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}