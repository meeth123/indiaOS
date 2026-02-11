import Link from "next/link";

export function Footer() {
  return (
    <footer
      id="about"
      className="relative z-10 px-6 md:px-12 py-10 border-t-3 border-black"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-mono font-bold text-sm">
          Built by NRIs, for NRIs.
        </p>
        <div className="flex gap-6">
          <Link
            href="/blog"
            className="font-mono text-sm font-bold hover:text-pink transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/calendar"
            className="font-mono text-sm font-bold hover:text-pink transition-colors"
          >
            Deadlines
          </Link>
          <Link
            href="/privacy"
            className="font-mono text-sm font-bold hover:text-pink transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="font-mono text-sm font-bold hover:text-pink transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="font-mono text-sm font-bold hover:text-pink transition-colors"
          >
            Contact
          </Link>
        </div>
        <p className="font-sans text-xs text-gray-500">
          &copy; {new Date().getFullYear()} AlertDoc. Not legal or tax advice.
        </p>
      </div>
    </footer>
  );
}
