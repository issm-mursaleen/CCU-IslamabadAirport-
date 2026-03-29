"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/90">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-4 marker:text-tactical-green/70">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-4 marker:font-mono marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed [&>p]:mb-0">{children}</li>
  ),
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 first:mt-0 font-mono text-sm font-bold tracking-wide text-tactical-green">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-3 first:mt-0 font-mono text-xs font-bold uppercase tracking-wider text-tactical-cyan/90">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-2 first:mt-0 font-mono text-[11px] font-semibold text-foreground">
      {children}
    </h3>
  ),
  hr: () => <hr className="my-3 border-border/50" />,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-tactical-green/40 pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-secondary/80 px-1 py-0.5 font-mono text-[10px] text-tactical-cyan"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md border border-border/50 bg-black/30 p-3 font-mono text-[10px] leading-relaxed text-foreground/90">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-mono text-[11px] text-tactical-cyan underline decoration-tactical-cyan/40 underline-offset-2 hover:text-tactical-green"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 w-full min-w-0 overflow-x-auto rounded-lg border border-border/60 bg-card/50 shadow-sm">
      <table className="w-full min-w-[280px] border-collapse text-left font-mono text-[11px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border/60 bg-secondary/60">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border/40">{children}</tbody>
  ),
  tr: ({ children }) => <tr className="transition-colors hover:bg-accent/25">{children}</tr>,
  th: ({ children }) => (
    <th className="whitespace-nowrap border-r border-border/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-tactical-cyan last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-r border-border/20 px-3 py-2 align-top text-muted-foreground last:border-r-0 [&_strong]:text-foreground">
      {children}
    </td>
  ),
  br: () => <br />,
};

type AssistantMessageContentProps = {
  content: string;
  className?: string;
};

export function AssistantMessageContent({
  content,
  className = "",
}: AssistantMessageContentProps) {
  return (
    <div className={`assistant-md text-[11px] text-foreground/90 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
