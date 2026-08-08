import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { ArrowLink, PIGMENT_TEXT, SectionHead, type Pigment } from '@/components/editorial';

const categories: {
  title: string;
  questions: string;
  href: string;
  pigment: Pigment;
}[] = [
  {
    title: 'Oude Testament',
    questions: '60+ vragen',
    href: '/quizzen?category=oude-testament',
    pigment: 'neutral',
  },
  {
    title: 'Nieuwe Testament',
    questions: '50+ vragen',
    href: '/quizzen?category=nieuwe-testament',
    pigment: 'lapis',
  },
  {
    title: 'Bijbelse Figuren',
    questions: '40+ vragen',
    href: '/quizzen?category=bijbelse-figuren',
    pigment: 'vermilion',
  },
  {
    title: "Thema's & Verhalen",
    questions: '30+ vragen',
    href: '/quizzen?category=verhalen',
    pigment: 'verdigris',
  },
];

export function FeaturesSection() {
  return (
    <section id="categorieen" className="bg-paper">
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-12 sm:px-8 lg:px-10 lg:pt-20">
        <SectionHead
          eyebrow="Categorieën"
          title="Ontdek de rijkdom van Gods Woord"
          lead="Met meer dan 200 vragen verdeeld over 4 categorieën is er altijd iets nieuws te ontdekken in de Statenvertaling."
          action={<ArrowLink href="/quizzen">Alle categorieën</ArrowLink>}
        />

        <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
          {categories.map((category, index) => (
            <Link
              key={category.title}
              href={category.href}
              className="group flex items-center gap-4 bg-paper-raised p-5 transition-colors hover:bg-paper-sunken sm:gap-5"
            >
              <span
                className={`font-display text-sm tabular-nums ${PIGMENT_TEXT[category.pigment]}`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-display text-base leading-snug text-ink sm:text-lg">
                  {category.title}
                </span>
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                  {category.questions}
                </span>
              </span>

              <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          ))}
        </div>

        <p className="mt-5 text-xs text-ink-muted">
          Alle vragen gebaseerd op de Statenvertaling
        </p>
      </div>
    </section>
  );
}
