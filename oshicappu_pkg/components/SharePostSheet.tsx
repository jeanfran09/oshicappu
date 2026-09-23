"use client";

import { useState } from "react";
import { Copy, Share, Check } from "lucide-react";
import BottomSheet from "./BottomSheet";
import Divider from "./Divider";

type SharePostSheetProps = {
  postId: string;
  onClose: () => void;
};

export default function SharePostSheet({
  postId,
  onClose,
}: SharePostSheetProps) {
  const [copied, setCopied] = useState(false);

  const postUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${postId}`
      : "";

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(postUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  }

  async function handleShare() {
    if (!navigator.share) {
      await handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: "Share this post",
        url: postUrl,
      });

      // Native share sheet was closed/completed
      onClose();
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        // User closed/cancelled the native share sheet
        onClose();
        return;
      }

      console.error("Error sharing post:", error);
    }
  }

  return (
    <BottomSheet
      title="Share"
      onClose={onClose}
      size="small"
    >
      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={handleShare}
          className="
            flex
            w-full
            rounded-xl
            text-left
            text-base
            text-foreground
            items-center
          "
        >
          <div className="flex h-9 w-9 mr-3 items-center justify-center rounded-full bg-accent">
            <Share size={18} />
          </div>

          <span>Share</span>
        </button>

        <Divider />

        <button
          type="button"
          onClick={handleCopyLink}
          className="
            flex
            w-full
            rounded-xl
            text-left
            text-base
            text-foreground
            items-center
          "
        >
          <div className="flex h-9 w-9 mr-3 items-center justify-center rounded-full bg-accent">
            {copied ? (
              <Check size={18} />
            ) : (
              <Copy size={18} />
            )}
          </div>

          <span>
            {copied ? "Link copied!" : "Copy link"}
          </span>
        </button>
      </div>
    </BottomSheet>
  );
}