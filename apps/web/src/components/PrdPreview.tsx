import ReactMarkdown from 'react-markdown'

interface Props {
  markdown: string
}

export default function PrdPreview({ markdown }: Props) {
  if (!markdown) {
    return (
      <p className="text-sm text-gray-500 italic">
        PRD will appear here once the first session completes.
      </p>
    )
  }

  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  )
}
