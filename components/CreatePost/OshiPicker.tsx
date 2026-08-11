"use client";

import Image from "next/image";
import { Check, Plus } from "lucide-react";

export type Oshi = {
  id: string;
  name: string;
  image: string;
};

type OshiPickerProps = {
  oshis: Oshi[];
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  onAdd: () => void;
};

export default function OshiPicker({
  oshis,
  selected,
  setSelected,
  onAdd,
}: OshiPickerProps) {
  function toggleOshi(id: string) {
    if (selected.includes(id)) {
      setSelected((prev) =>
        prev.filter((item) => item !== id)
      );
    } else {
      setSelected((prev) => [...prev, id]);
    }
  }

  function selectNone() {
    setSelected([]);
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">
        Oshis
      </label>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">

        {/* None */}
        <button
          type="button"
          onClick={selectNone}
          className="flex flex-col items-center gap-2 flex-shrink-0"
        >
          <div
            className={`
              relative
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              border-2
              transition
              ${
                selected.length === 0
                  ? "border-accent bg-accent/35"
                  : "border-accent/50"
              }
            `}
          >
            <span className="text-xl font-semibold text-foreground">
              —
            </span>

            {selected.length === 0 && (
              <div
                className="
                  absolute
                  bottom-0
                  right-0
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-accent
                  border-2
                  border-background
                "
              >
                <Check
                  size={12}
                  className="text-white"
                />
              </div>
            )}
          </div>

          <span className="text-xs">
            None
          </span>
        </button>

        {/* Oshis */}
        {oshis.map((oshi) => {
          const isSelected =
            selected.includes(oshi.id);

          return (
            <button
              key={oshi.id}
              type="button"
              onClick={() =>
                toggleOshi(oshi.id)
              }
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className={`
                  relative
                  h-16
                  w-16
                  rounded-full
                  border-2
                  transition
                  ${
                    isSelected
                      ? "border-accent"
                      : "border-transparent"
                  }
                `}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full">
                    <Image
                    src={oshi.image}
                    alt={oshi.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    />
                </div>

                {isSelected && (
                  <div
                    className="
                      absolute
                      bottom-0
                      right-0
                      flex
                      h-5
                      w-5
                      items-center
                      justify-center
                      rounded-full
                      bg-accent
                      border-2
                      border-background
                    "
                  >
                    <Check
                      size={12}
                      className="text-white"
                    />
                  </div>
                )}
              </div>

              <span className="max-w-16 truncate text-xs">
                {oshi.name}
              </span>
            </button>
          );
        })}

        {/* Add */}
        <button
          type="button"
          onClick={onAdd}
          className="flex flex-col items-center gap-2 flex-shrink-0"
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
              transition
              hover:bg-accent/10
            "
          >
            <Plus size={26} />
          </div>

          <span className="text-xs">
            Add
          </span>
        </button>

      </div>
    </div>
  );
}