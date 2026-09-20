"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

type Props = {
  image: string;
  aspectRatio?: number;
  initialCrop?: {
    crop: {
      x: number;
      y: number;
    };
    zoom: number;
  };
  isFirstImage?: boolean;
  /** Let the user cycle between these ratios. Omit (or pass one) to disable the switcher. */
  aspectRatioOptions?: { label: string; value: number }[];
  onCropChange?: (data: {
    crop: {
      x: number;
      y: number;
    };
    zoom: number;
  }) => void;
  onRatioChange?: (ratio: number) => void;
  onComplete: (file: File) => void;
  onCancel: () => void;
};

const DEFAULT_RATIOS = [{ label: "1:1", value: 1 }];

const GRID_IDLE_TIMEOUT = 700;

export default function ImageCropper({
  image,
  aspectRatio = 1,
  initialCrop,
  aspectRatioOptions = DEFAULT_RATIOS,
  onCropChange,
  onRatioChange,
  onComplete,
  onCancel,
}: Props) {
  const [crop, setCrop] = useState(
    initialCrop?.crop ?? {
      x: 0,
      y: 0,
    }
  );

  const [zoom, setZoom] = useState(
    initialCrop?.zoom ?? 1
  );

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Area | null>(null);

  const [ratio, setRatio] = useState(aspectRatio);
  const [showGrid, setShowGrid] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const gridTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reveal the grid on interaction, then hide it after a pause.
  const pingGrid = useCallback(() => {
    setShowGrid(true);

    if (gridTimeoutRef.current) {
      clearTimeout(gridTimeoutRef.current);
    }

    gridTimeoutRef.current = setTimeout(() => {
      setShowGrid(false);
    }, GRID_IDLE_TIMEOUT);
  }, []);

  useEffect(() => {
    return () => {
      if (gridTimeoutRef.current) {
        clearTimeout(gridTimeoutRef.current);
      }
    };
  }, []);

  /*
   * Reset the cropper whenever the image changes.
   *
   * This prevents the crop/zoom/cropped area from the
   * previous image from being reused for the new image.
   */
  useEffect(() => {
    setCrop(
      initialCrop?.crop ?? {
        x: 0,
        y: 0,
      }
    );

    setZoom(initialCrop?.zoom ?? 1);
    setCroppedAreaPixels(null);
    setRatio(aspectRatio);
    setShowGrid(false);
  }, [image]);

  function handleCropChange(
    newCrop: {
      x: number;
      y: number;
    }
  ) {
    setCrop(newCrop);
    pingGrid();

    onCropChange?.({
      crop: newCrop,
      zoom,
    });
  }

  function handleZoomChange(newZoom: number) {
    setZoom(newZoom);
    pingGrid();

    onCropChange?.({
      crop,
      zoom: newZoom,
    });
  }

  function onCropComplete(
    _: Area,
    pixels: Area
  ) {
    setCroppedAreaPixels(pixels);
  }

  function cycleRatio() {
    if (aspectRatioOptions.length < 2) {
      return;
    }

    const currentIndex =
      aspectRatioOptions.findIndex(
        (r) => r.value === ratio
      );

    const next =
      aspectRatioOptions[
        (currentIndex + 1) %
          aspectRatioOptions.length
      ];

    setRatio(next.value);
    pingGrid();
    onRatioChange?.(next.value);
  }

  async function createCroppedImage() {
    if (!croppedAreaPixels) {
      return;
    }

    const canvas =
      document.createElement("canvas");

    const imageElement =
      document.createElement("img");

    imageElement.src = image;

    await new Promise<void>((resolve, reject) => {
      imageElement.onload = () => resolve();

      imageElement.onerror = () =>
        reject(
          new Error("Failed to load image")
        );
    });

    const {
      width,
      height,
      x,
      y,
    } = croppedAreaPixels;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.drawImage(
      imageElement,
      x,
      y,
      width,
      height,
      0,
      0,
      width,
      height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        const file = new File(
          [blob],
          `cropped-${Date.now()}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        onComplete(file);
      },
      "image/jpeg"
    );
  }

  return (
    <div
      data-cropper
      className="
        fixed inset-0 z-[10000]
        bg-black
        select-none
      "
      style={{
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        setIsInteracting(true);
        pingGrid();
      }}
      onPointerMove={(e) =>
        e.stopPropagation()
      }
      onPointerUp={(e) => {
        e.stopPropagation();
        setIsInteracting(false);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        setIsInteracting(true);
        pingGrid();
      }}
      onTouchMove={(e) =>
        e.stopPropagation()
      }
      onTouchEnd={(e) => {
        e.stopPropagation();
        setIsInteracting(false);
      }}
    >
      {/* Top bar */}
      <div
        className="
          absolute top-0 left-0 right-0 z-10
          flex items-center justify-between
          px-4 py-3
          bg-gradient-to-b
          from-black/70
          to-transparent
        "
      >
        <button
          type="button"
          onClick={onCancel}
          className="
            px-2 py-1
            text-[15px]
            font-medium
            text-white
          "
        >
          Cancel
        </button>

        {aspectRatioOptions.length > 1 && (
          <button
            type="button"
            onClick={cycleRatio}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              bg-white/15
              text-xs
              font-semibold
              text-white
            "
            aria-label="Change aspect ratio"
          >
            {aspectRatioOptions.find(
              (r) => r.value === ratio
            )?.label ?? "◻"}
          </button>
        )}

        <button
          type="button"
          onClick={createCroppedImage}
          className="
            px-2 py-1
            text-[15px]
            font-semibold
            text-white
          "
        >
          Next
        </button>
      </div>

      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}
        aspect={ratio}
        cropShape="rect"
        showGrid={showGrid}
        minZoom={1}
        maxZoom={3}
        zoomWithScroll={false}
        restrictPosition={true}
        onCropChange={handleCropChange}
        onZoomChange={handleZoomChange}
        onCropComplete={onCropComplete}
        style={{
          cropAreaStyle: {
            transition: isInteracting
              ? "none"
              : "all 150ms ease-out",
          },
          mediaStyle: {
            transition: isInteracting
              ? "none"
              : "transform 150ms ease-out",
          },
        }}
      />
    </div>
  );
}