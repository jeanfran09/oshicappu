"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import Link from "next/link";

type Oshi = {
  id: string;
  name: string;
  image: string;
};

type Props = {
  oshis: Oshi[];
  onAdd: () => void;
};


export default function OshiList({
  oshis,
  onAdd,
}: Props) {

  return (
    <div className="space-y-3 mt-3">
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
              flex-col
              items-center
              gap-2
              flex-shrink-0
            "
          >
            <div className="h-16 w-16 overflow-hidden rounded-full bg-accent/20">
              <Image
                src={oshi.image}
                alt={oshi.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>

            <span className="max-w-16 truncate text-xs">
              {oshi.name}
            </span>
          </Link>
        ))}



        {/* Add Oshi */}
        <button
          type="button"
          onClick={onAdd}
          className="
            flex
            flex-col
            items-center
            gap-2
            flex-shrink-0
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
            <Plus size={26}/>
          </div>

          <span className="text-xs">
            Add
          </span>

        </button>
      </div>
    </div>
  );
}