/**
 * ProBadge — visual indicator for Pro subscription users.
 * Use on profile headers, tool cards, and anywhere creator status is shown.
 */
export default function ProBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const styles =
    size === 'md'
      ? 'text-xs px-2.5 py-1'
      : 'text-[10px] px-2 py-0.5'

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full bg-doom-accent/20 text-doom-accent-light ${styles}`}
    >
      PRO
    </span>
  )
}
