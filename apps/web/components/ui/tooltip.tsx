"use client";
import { cn } from "./lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

const isMac =
  typeof window !== "undefined"
    ? /macintosh|mac os x|mac_powerpc/i.test(navigator.userAgent.toLowerCase())
    : false;

const ShortcutKey = ({ children }: { children: string }) => {
  const className =
    "inline-flex bg-foreground items-center justify-center w-5 h-5 p-1 text-[0.625rem] rounded font-semibold leading-none text-background shadow-[inset_0px_0px_0px_0.5px_rgb(255_255_255_/_0.02),inset_0px_0.5px_0px_rgb(255_255_255_/_0.30),_inset_0px_0px_0px_1px_rgb(255_255_255_/_0.08),_0px_0px_0px_0.5px_rgb(0_0_0_/_0.24)]";
  if (children === "Mod") {
    return <kbd className={className}>{isMac ? "⌘" : "Ctrl"}</kbd>;
  }
  if (children === "Shift") {
    return <kbd className={className}>⇧</kbd>;
  }
  if (children === "Alt") {
    return <kbd className={className}>{isMac ? "⌥" : "Alt"}</kbd>;
  }
  return <kbd className={className}>{children}</kbd>;
};

export interface TooltipProps {
  children?: React.ReactNode;
  enabled?: boolean;
  title?: string;
  shortcut?: string[];
  delayDuration?: number;
  className?: string;
}

export function TooltipProvider({
  children,
  delayDuration = 500,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({
  children,
  enabled = true,
  title,
  shortcut,
  delayDuration = 500,
  className,
}: TooltipProps) {
  if (!enabled) {
    return <>{children}</>;
  }
  if (!title && !shortcut) {
    return <>{children}</>;
  }

  const content = (
    <>
      {title && <span className="text-xs font-medium text-muted">{title}</span>}
      {shortcut && (
        <span className={cn("flex items-center gap-0.5", title && "ml-2")}>
          {shortcut.map((key, index) => (
            <React.Fragment key={key}>
              <ShortcutKey>{key}</ShortcutKey>
              {index < shortcut.length - 1 && (
                <span className="text-[0.625rem] text-muted-foreground mx-0.5">
                  +
                </span>
              )}
            </React.Fragment>
          ))}
        </span>
      )}
    </>
  );

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span>{children}</span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={8}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 bg-foreground border border-border/20 rounded-lg shadow-xs z-[999]",
              !title && shortcut && "px-1.5 gap-0.5", // Tighter spacing for shortcut-only
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
}

export default Tooltip;
