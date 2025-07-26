import Link from "next/link";
import { type ReactNode } from "react";

interface HeaderProps {
  children: ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {children}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link 
            href="https://x.com/pepealonsog" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Built by @pepealonsog
          </Link>
          <span className="text-muted-foreground/50">•</span>
          <Link 
            href="https://github.com/pepealonso95/journey/tree/main" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Open Source Repo
          </Link>
        </div>
      </div>
    </header>
  );
}