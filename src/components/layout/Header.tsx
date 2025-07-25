import Link from "next/link";
import { type ReactNode } from "react";

interface HeaderProps {
  children: ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {children}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <Link 
            href="https://x.com/pepealonsog" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 underline transition-colors"
          >
            Built by @pepealonsog
          </Link>
          <span className="text-gray-300">•</span>
          <Link 
            href="https://github.com/pepealonso95/journey/tree/main" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 underline transition-colors"
          >
            Open Source Repo
          </Link>
        </div>
      </div>
    </header>
  );
}