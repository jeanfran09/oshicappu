"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

type TagInputProps = {
  label: string;
  placeholder: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  maxItems?: number;
  maxLength?: number;
  prefix?: string;
};

export default function TagInput({
  label,
  placeholder,
  items,
  setItems,
  maxItems = 10,
  maxLength = 30,
  prefix = "",
}: TagInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function addItem() {
    let text = value.trim();

    if (!text) return;

    if (prefix === "#") {
        text = text.replace(/^#/, "");
    }


    // Max limit check
    if (items.length >= maxItems) {
        setError(
        `Maximum of ${maxItems} ${label.toLowerCase()} allowed.`
        );
        return;
    }


    // Duplicate check
    if (
        items.some(
        (item) =>
            item.toLowerCase() === text.toLowerCase()
        )
    ) {
        setError(
        `${text} is already added.`
        );
        return;
    }


    setItems((prev) => [
        ...prev,
        text,
    ]);

    setValue("");
    setError("");
    }

  function removeItem(item: string) {
    setItems((prev) =>
      prev.filter((i) => i !== item)
    );

    setError("");
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          className="
            flex-1
            rounded-xl
            border
            bg-background
            border-foreground/50
            px-4
            py-3
            text-sm
            outline-none
            focus:border-accent
          "
        />

        <button
          type="button"
          onClick={addItem}
          className="
            rounded-xl
            bg-accent
            px-5
            font-medium
            transition
            hover:bg-accent/80
            active:scale-95
          "
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="
              flex
              items-center
              gap-2
              rounded-full
              bg-accent
              px-3
              py-1.5
              text-sm
            "
          >
            <span>
              {prefix}
              {item}
            </span>

            <button
              type="button"
              onClick={() => removeItem(item)}
              className="opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {error && (
            <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}