import ReactMarkdown, { type Components } from 'react-markdown'

interface Props {
  markdown: string
}

// Maersk-styled markdown renderers (Tailwind replica — no @tailwindcss/typography dep).
// Inter headings, readable measure, steel rules, Fira Code for code.
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 border-b border-maersk-steel/50 pb-2 text-2xl font-bold text-maersk-ink first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 border-b border-maersk-steel/40 pb-1.5 text-xl font-semibold text-maersk-ink first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold text-maersk-ink first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 text-base font-semibold text-maersk-ink first:mt-0">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="my-3 leading-relaxed text-maersk-ink/90">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-6 text-maersk-ink/90 marker:text-maersk-slate">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-6 text-maersk-ink/90 marker:text-maersk-slate">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-medium text-primary-700 underline decoration-maersk-blue/40 underline-offset-2 hover:text-maersk-blue"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-maersk-blue bg-primary-50 py-1 pl-4 text-maersk-slate">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-maersk-steel/50" />,
  code: ({ className, children }) => {
    const isBlock = (className ?? '').includes('language-')
    if (isBlock) {
      return <code className={`${className ?? ''} font-mono text-sm`}>{children}</code>
    }
    return (
      <code className="rounded bg-maersk-surface px-1.5 py-0.5 font-mono text-[0.85em] text-primary-800">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-mds border border-maersk-steel/50 bg-maersk-ink p-4 font-mono text-sm text-maersk-surface">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-maersk-steel/50 bg-maersk-surface px-3 py-2 text-left font-semibold text-maersk-ink">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-maersk-steel/40 px-3 py-2 text-maersk-ink/90">{children}</td>
  ),
  strong: ({ children }) => <strong className="font-semibold text-maersk-ink">{children}</strong>,
}

export default function PrdPreview({ markdown }: Props) {
  if (!markdown) {
    return (
      <p className="text-sm text-maersk-slate italic">
        PRD will appear here once the first session completes.
      </p>
    )
  }

  return (
    <div className="max-w-prose text-[0.95rem]">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  )
}
