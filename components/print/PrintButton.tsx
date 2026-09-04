'use client'

import { useTranslate } from '@/components/LocaleProvider'
import { Button } from '@/components/ui/Button'

/** Screen-only: hidden by `print:hidden` so it never lands on the paper. */
export function PrintButton() {
  const tt = useTranslate()
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      {tt('print.button')}
    </Button>
  )
}
