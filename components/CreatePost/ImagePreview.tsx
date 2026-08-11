"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon, Pencil } from "lucide-react";

type ImagePreviewProps = {
  images: File[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  onEdit: () => void;
  aspectRatio: number;
};

export default function ImagePreview({
  images,
  currentIndex,
  setCurrentIndex,
  onEdit,
  aspectRatio,
}: ImagePreviewProps) {

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  useEffect(() => {

    if (images.length === 0) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(
      images[currentIndex]
    );

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [images, currentIndex]);


  if (images.length === 0) {
    return (
      <div className="
        flex
        aspect-square
        w-full
        flex-col
        items-center
        justify-center
        gap-3
        rounded-xl
        border
        border-foreground/25
        bg-accent/20
        text-foreground/75
      ">
        <div className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-accent/40
        ">
          <ImageIcon
            size={32}
            className="text-[#7f8480]"
          />
        </div>


        <p className="text-sm">
          No images selected
        </p>

      </div>
    );
  }

  return (
    <div
      className="
        relative
        w-full
        overflow-hidden
        rounded-xl
        bg-muted
      "
      style={{
        aspectRatio: aspectRatio,
      }}
    >

      {previewUrl && (
        <Image
          src={previewUrl}
          alt={`Preview ${currentIndex + 1}`}
          fill
          className="object-cover"
        />
      )}


      {/* Edit button */}
      <button
        type="button"
        onClick={onEdit}
        className="
          absolute
          right-3
          top-3
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-black/60
          text-white
          transition
          hover:bg-black/80
        "
      >
        <Pencil size={18}/>
      </button>



      {/* Image counter */}
      {images.length > 1 && (
        <div className="
          absolute
          bottom-3
          left-1/2
          -translate-x-1/2
          rounded-full
          bg-black/60
          px-3
          py-1
          text-xs
          text-white
        ">
          {currentIndex + 1} / {images.length}
        </div>
      )}

    </div>
  );
}