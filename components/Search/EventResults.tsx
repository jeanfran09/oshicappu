"use client";

type EventResultsProps = {
  query?: string;
};

export default function EventResults({
  query = "",
}: EventResultsProps) {
  return (
    <div className="flex h-40 items-center justify-center">
      <p className="text-sm text-foreground/40">
        No events found for "{query}"
      </p>
    </div>
  );
}