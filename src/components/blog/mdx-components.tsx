import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="font-mono font-bold text-3xl md:text-4xl mt-10 mb-4">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-mono font-bold text-2xl md:text-3xl mt-10 mb-4 leading-[1.6]">
      <span className="highlight-yellow">{children}</span>
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-mono font-bold text-xl md:text-2xl mt-8 mb-3">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-mono font-bold text-lg mt-6 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="font-sans text-[#1a1a1a] leading-relaxed mb-4 text-base md:text-lg">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="font-sans text-[#1a1a1a] leading-relaxed mb-4 ml-6 list-disc space-y-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="font-sans text-[#1a1a1a] leading-relaxed mb-4 ml-6 list-decimal space-y-2">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-base md:text-lg">{children}</li>
  ),
  a: ({ href, children }) => {
    const isInternal = href?.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={href}
          className="font-bold text-pink underline decoration-2 underline-offset-2 hover:bg-pink hover:text-black transition-colors"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-purple underline decoration-2 underline-offset-2 hover:bg-purple hover:text-black transition-colors"
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="why-applies-box my-6 font-sans italic text-base">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-[#1a1a1a]">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="font-mono text-sm bg-yellow/30 px-1.5 py-0.5 border border-black/20 rounded-none">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="brutal-card p-4 my-6 overflow-x-auto text-sm font-mono">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-3 border-black font-sans text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-yellow font-mono font-bold text-sm uppercase">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="border-3 border-black px-4 py-3 text-left">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-3 border-black px-4 py-3">{children}</td>
  ),
  tr: ({ children }) => <tr className="even:bg-gray-50">{children}</tr>,
  hr: () => <hr className="border-t-3 border-black my-10" />,
};
