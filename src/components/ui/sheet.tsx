"use client";

import * as React from "react";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return <>{children}</>;
}

export function SheetTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props}>{children}</button>;
}

export function SheetContent({ 
  children, 
  side = "left",
  className = ""
}: { 
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      <div className="fixed inset-0 bg-black/50" />
      <div className={`fixed inset-y-0 ${side === "left" ? "left-0" : "right-0"} z-50 w-[280px] bg-white shadow-lg`}>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 py-4 border-b ${className}`}>{children}</div>;
}

export function SheetTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}
