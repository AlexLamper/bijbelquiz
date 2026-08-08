import type { Metadata } from 'next'
import { Bug } from 'lucide-react'

import BugReportForm from '@/components/contact/BugReportForm'
import { supportEmail } from '@/lib/support-email'

const email = supportEmail()

export const metadata: Metadata = {
  title: 'Bug report | BijbelQuiz Support',
  description: 'Meld technische problemen of fouten in BijbelQuiz zodat we ze snel kunnen oplossen.',
  alternates: { canonical: '/bug-report' },
}

export default function BugReportPage() {
  return (
    <div className="min-h-screen bg-paper pb-12 pt-10">
      <section className="mx-auto max-w-[1180px] px-4 pt-10 sm:px-5 lg:px-4">
        <div className="inline-flex items-center gap-2 rounded-md bg-paper-sunken px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
          <Bug className="h-3.5 w-3.5" />
          Support
        </div>
        <h1 className="mt-4 text-4xl text-ink">Bug report</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          Mail ons op <span className="font-medium text-ink">{email}</span>{' '}
          met wat er misgaat, hoe we het kunnen reproduceren en op welke pagina je het zag.
        </p>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pt-8 sm:px-5 lg:px-4">
        <div className="max-w-3xl">
          <BugReportForm supportEmail={email} />
        </div>
      </section>
    </div>
  )
}
