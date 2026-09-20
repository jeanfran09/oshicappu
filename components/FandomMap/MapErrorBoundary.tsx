"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Leaflet/react-leaflet errors (e.g. a mount race in dev mode) would
 * otherwise unmount silently, leaving a blank box with no clue why.
 * This surfaces the actual error message on the page instead.
 */
export default class MapErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Fandom Map crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-foreground/5 p-6 text-center">
          <p className="text-sm font-semibold">
            The map couldn&apos;t load.
          </p>

          <p className="max-w-xs text-xs text-foreground/50">
            {this.state.error.message || "Unknown error"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
