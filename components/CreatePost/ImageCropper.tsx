"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Cropper, { Area } from "react-easy-crop";

import type { CropData } from "@/types/crop";

type Props = {
  image: string;
  aspectRatio?: number;
  initialCrop?: CropData;
  isFirstImage?: boolean;
  aspectRatioOptions?: {
    label: string;
    value: number;
  }[];
  onCropChange?: (data: CropData) => void;
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
    useState<Area | null>(
      initialCrop?.croppedAreaPixels ?? null
    );

  const [ratio, setRatio] = useState(aspectRatio);
  const [showGrid, setShowGrid] = useState(false);
  const [isInteracting, setIsInteracting] =
    useState(false);

  const gridTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /*
   * Reveal the grid when the user interacts
   * with the cropper.
   */
  const pingGrid = useCallback(() => {
    setShowGrid(true);

    if (gridTimeoutRef.current) {
      clearTimeout(gridTimeoutRef.current);
    }

    gridTimeoutRef.current = setTimeout(() => {
      setShowGrid(false);
    }, GRID_IDLE_TIMEOUT);
  }, []);

  /*
   * Clean up the grid timeout.
   */
  useEffect(() => {
    return () => {
      if (gridTimeoutRef.current) {
        clearTimeout(gridTimeoutRef.current);
      }
    };
  }, []);

  /*
   * Reset the cropper whenever the image or
   * initial crop changes.
   */
  useEffect(() => {
    setCrop(
      initialCrop?.crop ?? {
        x: 0,
        y: 0,
      }
    );

    setZoom(initialCrop?.zoom ?? 1);

    setCroppedAreaPixels(
      initialCrop?.croppedAreaPixels ?? null
    );

    setRatio(aspectRatio);
    setShowGrid(false);
  }, [
    image,
    aspectRatio,
    initialCrop?.crop?.x,
    initialCrop?.crop?.y,
    initialCrop?.zoom,
    initialCrop?.croppedAreaPixels?.x,
    initialCrop?.croppedAreaPixels?.y,
    initialCrop?.croppedAreaPixels?.width,
    initialCrop?.croppedAreaPixels?.height,
  ]);

  /*
   * Update crop position.
   */
  function handleCropChange(
    newCrop: {
      x: number;
      y: number;
    }
  ) {
    setCrop(newCrop);
    pingGrid();

    if (!croppedAreaPixels) {
      return;
    }

    onCropChange?.({
      crop: newCrop,
      zoom,
      croppedAreaPixels,
    });
  }

  /*
   * Update zoom.
   */
  function handleZoomChange(
    newZoom: number
  ) {
    setZoom(newZoom);
    pingGrid();

    if (!croppedAreaPixels) {
      return;
    }

    onCropChange?.({
      crop,
      zoom: newZoom,
      croppedAreaPixels,
    });
  }

  /*
   * Save the calculated crop area.
   */
  function handleCropComplete(
    _: Area,
    pixels: Area
  ) {
    setCroppedAreaPixels(pixels);

    onCropChange?.({
      crop,
      zoom,
      croppedAreaPixels: pixels,
    });
  }

  /*
   * Cycle through available aspect ratios.
   */
  function cycleRatio() {
    if (aspectRatioOptions.length < 2) {
      return;
    }

    const currentIndex =
      aspectRatioOptions.findIndex(
        (item) => item.value === ratio
      );

    const next =
      aspectRatioOptions[
        (currentIndex + 1) %
          aspectRatioOptions.length
      ];

    setRatio(next.value);

    /*
     * The crop area will be recalculated by
     * react-easy-crop after the ratio changes.
     */
    setCroppedAreaPixels(null);

    pingGrid();

    onRatioChange?.(next.value);
  }

  /*
   * Create the final cropped image.
   */
  async function createCroppedImage() {
    if (!croppedAreaPixels) {
      return;
    }

    const canvas =
      document.createElement("canvas");

    const imageElement =
      document.createElement("img");

    imageElement.crossOrigin = "anonymous";
    imageElement.src = image;

    await new Promise<void>(
      (resolve, reject) => {
        imageElement.onload = () => resolve();

        imageElement.onerror = () =>
          reject(
            new Error(
              "Failed to load image"
            )
          );
      }
    );

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
      "image/jpeg",
      0.95
    );
  }

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>
  ) {
    e.stopPropagation();
    setIsInteracting(true);
    pingGrid();
  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLDivElement>
  ) {
    e.stopPropagation();
  }

  function handlePointerUp(
    e: React.PointerEvent<HTMLDivElement>
  ) {
    e.stopPropagation();
    setIsInteracting(false);
  }

  return (
    <div
      data-cropper
      className="
        fixed
        inset-0
        z-[10000]
        bg-black
        select-none
      "
      style={{
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={(e) => {
        e.stopPropagation();
        setIsInteracting(false);
      }}
    >
      {/* Top bar */}
      <div
        className="
          absolute
          left-0
          right-0
          top-0
          z-10
          flex
          items-center
          justify-between
          bg-gradient-to-b
          from-black/70
          to-transparent
          px-4
          py-3
        "
      >
        <button
          type="button"
          onClick={onCancel}
          className="
            px-2
            py-1
            text-[15px]
            font-medium
            text-white
          "
        >
          Cancel
        </button>

        {aspectRatioOptions.length > 1 ? (
          <button
            type="button"
            onClick={cycleRatio}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-white/15
              text-xs
              font-semibold
              text-white
            "
            aria-label="Change aspect ratio"
          >
            {aspectRatioOptions.find(
              (item) =>
                item.value === ratio
            )?.label ?? "◻"}
          </button>
        ) : (
          <div className="w-9" />
        )}

        <button
          type="button"
          onClick={createCroppedImage}
          disabled={!croppedAreaPixels}
          className="
            px-2
            py-1
            text-[15px]
            font-semibold
            text-white
            disabled:opacity-50
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
        onCropComplete={handleCropComplete}
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