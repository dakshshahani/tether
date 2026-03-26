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
      {/* Backdrop with animation */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-backdrop" />
      
      {/* Drawer with slide animation */}
      <div className={`
        fixed inset-y-0 z-50 w-[280px] 
        bg-card border-r border-border
        shadow-2xl
        animate-slide-in-left
        ${side === "left" ? "left-0" : "right-0"}
      `}>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-4 border-b border-border bg-muted/30 ${className}`}>
      {children}
    </div>
  );
}

export function SheetTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}
