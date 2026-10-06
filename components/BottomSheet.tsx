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
  const isSmall = size === "small";

  return (
    <Sheet
      isOpen={true}
      onClose={onClose}
    >
      <Sheet.Container
        className={`!rounded-t-3xl !bg-background ${
          isSmall
            ? "!h-auto !max-h-[70dvh]"
            : "!h-[90dvh]"
        }`}
      >
        <Sheet.Header className={isSmall ? "!p-0" : "!p-0"}>
          <div className="flex justify-center pt-3">
            <Sheet.DragIndicator />
          </div>

          {!isSmall && (
            <div className="relative flex items-center border-b border-foreground/10 px-4 pb-3">
              <h2 className="text-lg font-semibold text-foreground">
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

        <Sheet.Content
          className={
            isSmall
              ? "!h-auto !max-h-[70dvh]"
              : "!min-h-0 !flex-1"
          }
        >
          <div
            className={`w-full px-3 py-3 text-foreground/60 ${
              isSmall
                ? "max-h-[70dvh] overflow-y-auto"
                : "h-full overflow-y-auto"
            }`}
          >
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