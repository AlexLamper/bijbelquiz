export const BIJBEL_STUDIE_BASE_URL = 'https://www.bijbel-studie.com';
export const BIJBEL_API_BASE_URL = 'https://www.bijbelapi.com';

const TOPIC_SLUGS: Array<{ keywords: string[]; slug: string; label: string }> = [
  { keywords: ['mozes', 'exodus'], slug: 'mozes', label: 'Mozes' },
  { keywords: ['paulus'], slug: 'paulus', label: 'Paulus' },
  { keywords: ['david'], slug: 'koning-david', label: 'Koning David' },
  { keywords: ['abraham'], slug: 'abraham', label: 'Abraham' },
  { keywords: ['jezus', 'christus'], slug: 'jezus', label: 'Jezus' },
  { keywords: ['noach'], slug: 'noach', label: 'Noach' },
  { keywords: ['petrus'], slug: 'petrus', label: 'Petrus' },
  { keywords: ['openbaring'], slug: 'openbaring', label: 'Openbaring' },
  { keywords: ['psalm', 'psalmen'], slug: 'psalmen', label: 'Psalmen' },
];

export interface StudyTopicLink {
  href: string;
  label: string;
}

export function getStudyTopicLinkForQuizTitle(quizTitle: string): StudyTopicLink {
  const normalizedTitle = quizTitle.toLowerCase();
  const topic = TOPIC_SLUGS.find((candidate) =>
    candidate.keywords.some((keyword) => normalizedTitle.includes(keyword))
  );

  if (!topic) {
    return {
      href: BIJBEL_STUDIE_BASE_URL,
      label: 'dit Bijbelonderwerp',
    };
  }

  return {
    // Bijbel Studie ondersteunt op dit moment geen stabiele publieke onderwerp-slugs.
    // Daarom linken we altijd naar de homepage met contextuele labeltekst.
    href: BIJBEL_STUDIE_BASE_URL,
    label: topic.label,
  };
}
