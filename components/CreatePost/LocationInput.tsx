"use client";

import { MapPin } from "lucide-react";

type LocationInputProps = {
  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
};

export default function LocationInput({
  location,
  setLocation,
}: LocationInputProps) {
  return (
    <div className="space-y-2 pb-2">
      <label className="text-sm font-semibold">Location</label>

      <div className="relative">
        <MapPin
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"
        />

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
          placeholder="Add a location"
          className="
            w-full
            rounded-xl
            border
            border-foreground/50
            bg-background
            py-3
            pl-11
            pr-4
            text-sm
            outline-none
            transition
            focus:border-accent
          "
        />
      </div>
    </div>
  );
}