import { useData } from '../lib/data'

export function TopicBadge({ topic, short = false }: { topic: string; short?: boolean }) {
  const { topicMap } = useData()
  const meta = topicMap[topic]
  const color = meta?.color ?? '#64748b'
  const label = meta ? (short ? meta.short : meta.name) : topic
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {label}
    </span>
  )
}
