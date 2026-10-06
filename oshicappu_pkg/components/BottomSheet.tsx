"use client";

import { ReactNode } from "react";
import { Sheet } from "react-modal-sheet";
import { X } from "lucide-react";

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
  return (
    <Sheet
      isOpen={true}
      onClose={onClose}
      snapPoints={size === "small" ? [0.67] : [0.9]}
      initialSnap={0}
    >
      <Sheet.Container className="!rounded-t-3xl !bg-background">
        <Sheet.Header>

          {size === "large" && (
            <div className="relative flex items-center justify-center border-b border-foreground/10 px-4 pb-3">
              <h2 className="text-base font-semibold text-foreground">
                {title ?? ""}
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </Sheet.Header>

        <Sheet.Content>
          <div className="h-full w-full overflow-y-auto px-3 py-3 text-foreground/60">
            {children}
          </div>
        </Sheet.Content>
      </Sheet.Container>

      <Sheet.Backdrop
        onTap={onClose}
        className="!bg-black/50"
      />
    </Sheet>
  );
}