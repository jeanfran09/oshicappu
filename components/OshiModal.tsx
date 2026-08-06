"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  onClose: () => void;
};

export default function OshiModal({
  onClose,
}: Props) {

  const [closing, setClosing] = useState(false);


  function closeModal() {
    setClosing(true);

    setTimeout(() => {
      onClose();
    }, 250);
  }


  return (
    <div className="fixed inset-0 z-[200] flex items-end bg-black/50 duration-200" onClick={closeModal}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{
          y: closing ? "100%" : 0,
        }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}

        drag="y"

        dragConstraints={{
          top: 0,
          bottom: 300,
        }}

        dragElastic={0.2}

        onDragEnd={(event, info) => {

          if (info.offset.y > 120) {
            closeModal();
          }

        }}

        className="
          w-full
          rounded-t-3xl
          bg-background
          p-6
          min-h-[85vh]
        "

        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* Drag handle */}
        <div className="mx-auto h-1.5 w-12 rounded-full bg-foreground/30"/>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Add Oshi
          </h2>

          <button
            onClick={closeModal}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-accent
            "
          >
            <X size={18}/>
          </button>
        </div>

        <div className="flex h-40 items-center justify-center text-foreground/60">
          Add Oshi Form Here
        </div>
      </motion.div>
    </div>
  );
}