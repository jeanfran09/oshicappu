"use client";

import { useEffect, useRef } from "react";

type CaptionInputProps = {
  caption: string;
  setCaption: React.Dispatch<React.SetStateAction<string>>;
};

export default function CaptionInput({
  caption,
  setCaption,
}: CaptionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;

  }, [caption]);


  return (
  <div className="space-y-2">
    <label className="text-sm font-semibold">
      Caption
    </label>

    <div className="relative">
    <textarea
        ref={textareaRef}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={500}
        placeholder="Share your oshikatsu..."
        rows={1}
        className="
        w-full
        resize-none
        overflow-hidden
        rounded-xl
        border
        border-foreground/25
        bg-background
        p-4
        pb-8
        text-base
        outline-none
        transition
        focus:border-accent
        "
    />

    <span
        className="
        pointer-events-none
        absolute
        bottom-3
        right-4
        text-xs
        text-foreground/50
        "
    >
        {caption.length}/500
    </span>
    </div>
  </div>
);
}