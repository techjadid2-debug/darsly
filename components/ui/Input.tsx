import type { ComponentProps } from 'react'

type InputProps = ComponentProps<'input'> & {
  label: string
  /** Rendered below the field and wired up via aria-describedby. */
  error?: string | undefined
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          'h-11 rounded-xl border bg-surface px-3 text-base text-ink',
          'placeholder:text-ink-soft/70',
          error ? 'border-danger' : 'border-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
