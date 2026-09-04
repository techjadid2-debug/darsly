import { Spinner } from '@/components/ui/Spinner'
import { translator } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'

export default async function DashboardLoading() {
  const locale = await getLocale()
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner label={translator(locale)('common.loading')} />
    </div>
  )
}
