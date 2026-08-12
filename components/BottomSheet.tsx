"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  size?: "small" | "large";
};

export default function BottomSheet({
  title,
  children,
  onClose,
  size = "large",
}: Props) {
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Small sheets close with a shorter drag.
  const closeThreshold = size === "small" ? 10 : 120;

  function closeModal() {
    if (closing) return;

    setClosing(true);

    setTimeout(() => {
      onClose();
    }, 150);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end bg-black/50"
      onClick={closeModal}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{
          y: closing ? "100%" : 0,
        }}
        transition={{
          duration: 0.15,
          ease: "easeOut",
        }}
        drag="y"
        dragConstraints={{
          top: 0,
          bottom: 300,
        }}
        dragElastic={0.1}
        onDragEnd={(event, info) => {
          if (info.offset.y > closeThreshold) {
            closeModal();
          }
        }}
        className={`
          w-full
          rounded-t-3xl
          bg-background
          ${
            size === "small"
              ? "h-auto"
              : "min-h-[90vh]"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex cursor-grab justify-center pb-1 pt-3 active:cursor-grabbing">
          <div className="h-1.5 w-12 rounded-full bg-foreground/30" />
        </div>

        {/* Header */}
        {size === "large" && (
          <div className="flex items-center justify-between border-b border-foreground/30 px-3 pb-3">
            <h2 className="text-xl font-semibold">
              {title ?? ""}
            </h2>

            <button
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="w-full px-3 py-3 text-foreground/60">
          {children}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}