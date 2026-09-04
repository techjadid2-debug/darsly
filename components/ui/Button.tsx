import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary:
    'bg-surface text-ink border border-border hover:bg-surface-2',
  ghost: 'text-ink-soft hover:text-ink hover:bg-surface-2',
}

const sizes: Record<Size, string> = {
  // 44px / 52px tall — comfortable thumb targets on a phone.
  md: 'h-11 px-4 text-sm',
  lg: 'h-13 px-6 text-base',
}

function classes(variant: Variant, size: Size, className?: string) {
  return [base, variants[variant], sizes[size], className]
    .filter(Boolean)
    .join(' ')
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button {...props} className={classes(variant, size, className)}>
      {children}
    </button>
  )
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link {...props} className={classes(variant, size, className)}>
      {children}
    </Link>
  )
}
