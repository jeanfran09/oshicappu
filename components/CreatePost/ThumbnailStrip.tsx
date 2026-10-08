"use client";

import Image from "next/image";
import { Lock, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Reorder } from "framer-motion";
import type { CropData } from "@/types/crop";

type ThumbnailStripProps = {
  images: File[];
  originalImages?: File[];
  cropData?: CropData[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  setOriginalImages?: React.Dispatch<React.SetStateAction<File[]>>;
  setCropData?: React.Dispatch<React.SetStateAction<CropData[]>>;
  onSelectImages: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  showAddButton?: boolean;
  lockFirstImage?: boolean;
};

const MAX_IMAGES = 4;

export default function ThumbnailStrip({
  images,
  originalImages = [],
  cropData = [],
  currentIndex,
  setCurrentIndex,
  setImages,
  setOriginalImages,
  setCropData,
  onSelectImages,
  showAddButton = true,
  lockFirstImage = false,
}: ThumbnailStripProps) {
  const previewUrlsRef = useRef<Map<File, string>>(new Map());
  const [, setPreviewVersion] = useState(0);

  useEffect(() => {
    const currentFiles = new Set(images);
    const previewUrls = previewUrlsRef.current;

    // Create preview URLs only for newly added files.
    images.forEach((file) => {
      if (!previewUrls.has(file)) {
        previewUrls.set(file, URL.createObjectURL(file));
      }
    });

    // Revoke preview URLs for files that were removed.
    previewUrls.forEach((url, file) => {
      if (!currentFiles.has(file)) {
        URL.revokeObjectURL(url);
        previewUrls.delete(file);
      }
    });

    setPreviewVersion((version) => version + 1);
  }, [images]);

  // Clean up all remaining preview URLs when the component unmounts.
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      previewUrlsRef.current.clear();
    };
  }, []);

  function getPreviewUrl(file: File) {
    return previewUrlsRef.current.get(file);
  }

  function removeImage(index: number) {
    if (lockFirstImage && index === 0) {
      return;
    }

    const removedFile = images[index];
    const newImages = images.filter((_, i) => i !== index);

    if (setOriginalImages) {
      const newOriginalImages = newImages.map((file) => {
        const oldIndex = images.indexOf(file);
        return originalImages[oldIndex];
      });

      setOriginalImages(newOriginalImages);
    }

    if (setCropData) {
      const newCropData = newImages.map((file) => {
        const oldIndex = images.indexOf(file);
        return cropData[oldIndex];
      });

      setCropData(newCropData);
    }

    setImages(newImages);

    setCurrentIndex((prev) => {
      if (newImages.length === 0) {
        return 0;
      }

      if (index < prev) {
        return prev - 1;
      }

      if (index === prev) {
        return Math.min(prev, newImages.length - 1);
      }

      return prev;
    });

    const removedUrl = previewUrlsRef.current.get(removedFile);

    if (removedUrl) {
      URL.revokeObjectURL(removedUrl);
      previewUrlsRef.current.delete(removedFile);
    }
  }

  function handleReorder(newOrder: File[]) {
    const reorderedOriginalImages = newOrder.map((file) => {
      const oldIndex = images.indexOf(file);
      return originalImages[oldIndex];
    });

    const reorderedCropData = newOrder.map((file) => {
      const oldIndex = images.indexOf(file);
      return cropData[oldIndex];
    });

    const selectedFile = images[currentIndex];
    const newIndex = newOrder.indexOf(selectedFile);

    setImages(newOrder);

    if (setOriginalImages) {
      setOriginalImages(reorderedOriginalImages);
    }

    if (setCropData) {
      setCropData(reorderedCropData);
    }

    if (newIndex !== -1) {
      setCurrentIndex(newIndex);
    }
  }

  return (
    <div className="w-full">
      <Reorder.Group
        axis="x"
        values={images}
        onReorder={handleReorder}
        className="flex gap-3 overflow-x-auto no-scrollbar px-1 py-1"
      >
        {images.map((file, index) => {
          const isLocked = lockFirstImage && index === 0;
          const previewUrl = getPreviewUrl(file);

          return (
            <Reorder.Item
              key={`${file.name}-${file.lastModified}`}
              value={file}
              drag={!isLocked}
              className={`relative h-20 w-20 shrink-0 rounded-xl ${
                currentIndex === index
                  ? "ring-2 ring-foreground/30"
                  : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setCurrentIndex(index)}
                className="relative h-full w-full overflow-hidden rounded-xl"
              >
                {previewUrl && (
                  <Image
                    src={previewUrl}
                    alt={`Image ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </button>

              {isLocked ? (
                <div
                  className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="First photo is locked"
                >
                  <Lock size={11} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <X size={12} />
                </button>
              )}
            </Reorder.Item>
          );
        })}

        {showAddButton && images.length < MAX_IMAGES && (
          <label className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-foreground/20">
            <Plus size={22} className="text-foreground/50" />

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onSelectImages}
            />
          </label>
        )}
      </Reorder.Group>
    </div>
  );
}