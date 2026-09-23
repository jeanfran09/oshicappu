"use client";

import Image from "next/image";
import { Plus, User as UserIcon } from "lucide-react";
import Link from "next/link";

type Oshi = {
  id: string;
  name: string;
  image: string;
};

type Props = {
  oshis: Oshi[];
  showAdd?: boolean;
  onAdd?: () => void;
};

export default function OshiList({
  oshis,
  showAdd = true,
  onAdd,
}: Props) {
  return (
    <div className="mt-3 space-y-3">
      <h3 className="text-sm font-semibold">
        Oshis
      </h3>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {oshis.map((oshi) => (
          <Link
            key={oshi.id}
            href={`/oshi/${oshi.id}`}
            className="
              flex
              flex-shrink-0
              flex-col
              items-center
              gap-2
            "
          >
            {/* Oshi Image */}
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-accent/20
              "
            >
              {oshi.image ? (
                <Image
                  src={oshi.image}
                  alt={oshi.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon
                  size={28}
                  className="text-foreground/30"
                />
              )}
            </div>

            {/* Oshi Name */}
            <span className="max-w-16 truncate text-xs">
              {oshi.name}
            </span>
          </Link>
        ))}

        {/* Add Oshi */}
        {showAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="
              flex
              flex-shrink-0
              flex-col
              items-center
              gap-2
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                border-2
                border-dashed
                border-accent
              "
            >
              <Plus size={26} />
            </div>

            <span className="text-xs">
              Add
            </span>
          </button>
        )}
      </div>
    </div>
  );
}