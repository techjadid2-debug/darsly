export function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-border border-t-brand"
      />
      {label}
    </span>
  )
}
