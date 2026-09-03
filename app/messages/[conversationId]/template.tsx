"use client";

import { motion } from "framer-motion";
import { useRef, type ReactNode } from "react";

export default function ConversationTemplate({
  children,
}: {
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      transition={{
        type: "tween",
        duration: 0.28,
        ease: [0.32, 0.72, 0, 1],
      }}
      onAnimationComplete={() => {
        // Once the slide-in finishes, drop the transform so
        // fixed-position children (the composer bar, the
        // image viewer) go back to being positioned relative
        // to the real viewport instead of this element.
        if (ref.current) {
          ref.current.style.transform = "none";
        }
      }}
      className="min-h-screen bg-background"
    >
      {children}
    </motion.div>
  );
}