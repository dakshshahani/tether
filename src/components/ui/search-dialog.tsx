"use client";

import * as React from "react";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function SearchDialog({ open, onOpenChange, children }: SearchDialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-backdrop"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-2xl animate-fade-in">
        {children}
      </div>
    </div>
  );
}

export function SearchDialogContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border-2 border-border rounded-xl shadow-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function SearchDialogHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 border-b border-border ${className}`}>{children}</div>;
}

export function SearchDialogBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`max-h-[60vh] overflow-y-auto ${className}`}>{children}</div>;
}
