"use client";

interface WelcomeProps {
  totalNotes: number;
}

export function Welcome({ totalNotes }: WelcomeProps) {
  return (
    <div className="animate-fade-in bg-card rounded-xl p-12 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] border border-border">
      <div className="text-center space-y-6">
        {/* Brain Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-muted flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.08)]">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              className="text-foreground"
            >
              <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2z" />
              <path d="M12 2c-1.5 0-2.5 1.5-2.5 4s1 4 2.5 4 2.5-1.5 2.5-4-1-4-2.5-4z" />
              <path d="M12 10c-1.5 0-2.5 1.5-2.5 4s1 4 2.5 4 2.5-1.5 2.5-4-1-4-2.5-4z" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="16" cy="8" r="1.5" />
              <circle cx="8" cy="16" r="1.5" />
              <circle cx="16" cy="16" r="1.5" />
            </svg>
          </div>
        </div>

        {/* Greeting */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Hello daksh's digital brain
          </h1>
          <p className="text-muted-foreground text-lg">
            Your personal knowledge vault
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 pt-6">
          <div className="bg-accent/30 rounded-lg px-8 py-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="text-3xl font-bold text-foreground mb-1">
              {totalNotes}
            </div>
            <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
              Total Notes
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="pt-6 text-sm text-muted-foreground space-y-2">
          <p className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono mx-1 shadow-sm border border-border">⌘K</kbd> to search
          </p>
          <p className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            Select a note from the sidebar to begin
          </p>
        </div>
      </div>
    </div>
  );
}
