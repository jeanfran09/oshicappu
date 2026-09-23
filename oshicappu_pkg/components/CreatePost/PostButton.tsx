"use client";

import { Loader2 } from "lucide-react";

type PostButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export default function PostButton({
  disabled = false,
  loading = false,
  onClick,
}: PostButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/30 bg-background p-4">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="
          flex
          h-12
          w-full
          items-center
          justify-center
          rounded-full
          bg-[#b8d8be]/90
          font-semibold
          text-foreground
          transition
          active:scale-[0.98]
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {loading ? (
          <Loader2
            size={20}
            className="animate-spin"
          />
        ) : (
          "Post"
        )}
      </button>
    </div>
  );
}