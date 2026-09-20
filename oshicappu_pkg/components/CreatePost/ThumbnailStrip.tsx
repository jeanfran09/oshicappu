"use client";

import Image from "next/image";
import { X, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Reorder } from "framer-motion";

type CropData = {
  crop: {
    x: number;
    y: number;
  };
  zoom: number;
};

type ThumbnailStripProps = {
  images: File[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  setOriginalImages: React.Dispatch<
    React.SetStateAction<File[]>
  >;
  setCropData: React.Dispatch<
    React.SetStateAction<CropData[]>
  >;
  onSelectImages: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;

  showAddButton?: boolean;
};

export default function ThumbnailStrip({
  images,
  currentIndex,
  setCurrentIndex,
  setImages,
  setOriginalImages,
  setCropData,
  onSelectImages,
  showAddButton = true,
}: ThumbnailStripProps) {
  const [urls, setUrls] = useState<string[]>([]);

  const MAX_IMAGES = 4;

  useEffect(() => {
    const newUrls = images.map((file) =>
      URL.createObjectURL(file)
    );

    setUrls(newUrls);

    return () => {
      newUrls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [images]);

  function removeImage(index: number) {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setOriginalImages((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setCropData((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setCurrentIndex((prev) => {
      if (prev > index) {
        return prev - 1;
      }

      if (prev === index) {
        return Math.max(0, prev - 1);
      }

      return prev;
    });
  }

  function handleReorder(newOrder: File[]) {
    const currentFile = images[currentIndex];

    /*
     * Reorder originalImages using the exact same
     * order as images.
     */
    setOriginalImages((prevOriginal) =>
      newOrder.map((file) => {
        const oldIndex = images.indexOf(file);

        return prevOriginal[oldIndex];
      })
    );

    /*
     * Reorder cropData using the exact same
     * order as images.
     */
    setCropData((prevCropData) =>
      newOrder.map((file) => {
        const oldIndex = images.indexOf(file);

        return prevCropData[oldIndex];
      })
    );

    /*
     * Reorder the actual displayed images.
     */
    setImages(newOrder);

    /*
     * Keep the currently selected photo selected
     * after reordering.
     */
    const newIndex =
      newOrder.indexOf(currentFile);

    if (newIndex !== -1) {
      setCurrentIndex(newIndex);
    }
  }

  return (
    <Reorder.Group
      axis="x"
      values={images}
      onReorder={handleReorder}
      className="
        flex
        gap-3
        overflow-x-auto
        no-scrollbar
      "
    >
      {images.map((file, index) => (
        <Reorder.Item
          key={`${file.name}-${file.lastModified}`}
          value={file}
          className={`
            relative
            h-20
            w-20
            flex-shrink-0
            overflow-hidden
            rounded-xl
            border-2
            ${
              currentIndex === index
                ? "border-foreground"
                : "border-transparent"
            }
          `}
          onClick={() =>
            setCurrentIndex(index)
          }
        >
          {/* Thumbnail */}
          {urls[index] && (
            <Image
              src={urls[index]}
              alt={`Image ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          )}

          {/* Remove button */}
          <button
            type="button"
            onPointerDown={(e) =>
              e.stopPropagation()
            }
            onClick={(e) => {
              e.stopPropagation();
              removeImage(index);
            }}
            className="
              absolute
              right-1
              top-1
              z-10
              flex
              h-5
              w-5
              items-center
              justify-center
              rounded-full
              bg-black/60
              text-white
            "
          >
            <X size={12} />
          </button>
        </Reorder.Item>
      ))}

      {/* Add image */}
      {showAddButton &&
        images.length < MAX_IMAGES && (
          <label
            className="
              flex
              h-20
              w-20
              flex-shrink-0
              cursor-pointer
              items-center
              justify-center
              rounded-xl
              border-2
              border-dashed
              border-foreground/25
            "
          >
            <Plus
              size={24}
              className="text-foreground/75"
            />

            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                onSelectImages(e);

                // Allow selecting the same image again
                e.target.value = "";
              }}
            />
          </label>
        )}
    </Reorder.Group>
  );
}