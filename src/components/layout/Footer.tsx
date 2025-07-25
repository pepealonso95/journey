import Link from "next/link";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm z-10">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <Link 
            href="https://x.com/pepealonsog" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition-colors"
          >
            Created by @pepealonsog
          </Link>
          <span className="text-gray-300">•</span>
          <Link 
            href="https://github.com/pepealonso95/journey/tree/main" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition-colors"
          >
            Open Source on GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}