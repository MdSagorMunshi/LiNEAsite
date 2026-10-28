import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import { cn } from '@/lib/utils'

/* ============================================================
   LiNEA site — release notes renderer
   GitHub release bodies are markdown; rendered with strict,
   escaped, styled components (no raw HTML injection).
   ============================================================ */

const components: Components = {
  h1: ({ children }) => (
    <h3 className="mb-2 mt-5 font-mono text-[13px] font-semibold uppercase tracking-[0.12em] text-gold-400 first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h4 className="mb-2 mt-5 font-mono text-[12.5px] font-semibold uppercase tracking-[0.12em] text-gold-400 first:mt-0">
      {children}
    </h4>
  ),
  h3: ({ children }) => (
    <h5 className="mb-1.5 mt-4 font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] text-fog-200 first:mt-0">
      {children}
    </h5>
  ),
  h4: ({ children }) => (
    <h6 className="mb-1.5 mt-3.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-fog-300 first:mt-0">
      {children}
    </h6>
  ),
  p: ({ children }) => <p className="mb-2.5 text-[13px] leading-relaxed text-fog-300">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-[13px] text-fog-300">{children}</ol>,
  li: ({ children }) => (
    <li className="relative pl-4 text-[13px] leading-relaxed text-fog-300 before:absolute before:left-0 before:top-[7px] before:h-1 before:w-1 before:bg-gold-600">
      {children}
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-fog-100">{children}</strong>,
  em: ({ children }) => <em className="text-fog-200">{children}</em>,
  del: ({ children }) => <del className="text-fog-600">{children}</del>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-gold-400 underline decoration-gold-700 underline-offset-2 hover:text-gold-300"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? '')
    if (isBlock) {
      return (
        <code className="block overflow-x-auto border border-graphite-700 bg-graphite-950/80 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-fog-300">
          {children}
        </code>
      )
    }
    return (
      <code className="rounded-[2px] border border-graphite-700/70 bg-graphite-800/80 px-1 py-px font-mono text-[0.85em] text-gold-300">
        {children}
      </code>
    )
  },
  pre: ({ children }) => <pre className="mb-3">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-gold-600/70 bg-graphite-900/50 py-1 pl-3 pr-2 text-[13px] text-fog-300">
      {children}
    </blockquote>
  ),
  hr: () => <div className="my-4 h-px bg-graphite-700/70" />,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto border border-graphite-700">
      <table className="w-full border-collapse text-left font-mono text-[11px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-graphite-800/70 text-fog-200">{children}</thead>,
  th: ({ children }) => <th className="border-b border-graphite-700 px-2.5 py-1.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-graphite-800/70 px-2.5 py-1.5 text-fog-400">{children}</td>,
}

export default function ReleaseNotes({
  body,
  className,
}: {
  body: string
  className?: string
}) {
  if (!body?.trim()) {
    return <p className="font-mono text-[11px] tracking-wide text-fog-600">NO NOTES PUBLISHED FOR THIS RELEASE.</p>
  }
  return (
    <div className={cn('release-notes text-fog-300', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {body}
      </ReactMarkdown>
    </div>
  )
}
