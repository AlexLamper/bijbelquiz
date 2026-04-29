import type { Metadata } from 'next'
import { Bug } from 'lucide-react'

import BugReportForm from '@/components/contact/BugReportForm'

export const metadata: Metadata = {
  title: 'Bug report | BijbelQuiz Support',
  description: 'Meld technische problemen of fouten in BijbelQuiz zodat we ze snel kunnen oplossen.',
  alternates: { canonical: '/bug-report' },
}

export default function BugReportPage() {
  const supportEmail = process.env.NEXT_PUBLIC_BUG_REPORT_EMAIL || 'devlamper06@gmail.com'

  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-12 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#e9eff8] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#355384] dark:bg-zinc-800 dark:text-zinc-200">
          <Bug className="h-3.5 w-3.5" />
          Support
        </div>
        <h1 className="mt-4 text-4xl text-[#1f2f4b] dark:text-zinc-100">Bug report</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#5f7297] dark:text-zinc-300">
          Beschrijf wat er misgaat, hoe we het kunnen reproduceren en op welke pagina je het probleem zag.
        </p>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
        <div className="max-w-3xl">
          <BugReportForm supportEmail={supportEmail} />
        </div>
      </section>
    </div>
  )
}
