/**
 * What `/quizzen` shows, read from its query string. Shared by the server page
 * (first render, no flash) and the client browser (chips, search, back/forward).
 *
 *   /quizzen                          overview (populair, OT, NT, thema's)
 *   /quizzen?filter=oude-testament    the Old Testament books with quizzes
 *   /quizzen?filter=nieuwe-testament  the New Testament books
 *   /quizzen?filter=themas            every theme
 *   /quizzen?filter=populair          the most played quizzes
 *   /quizzen?boek=johannes            every quiz about one book
 *   /quizzen?thema=algemeen           every quiz of one theme (category)
 *   /quizzen?q=jona                   search
 *
 * `?category=` / `?categorie=` (old dashboard links, the season pack) map
 * onto the testament filters or a theme.
 */

export type QuizzenChip = 'alles' | 'oude-testament' | 'nieuwe-testament' | 'themas';

export type QuizzenView =
  | { kind: 'overview' }
  | { kind: 'testament'; testament: 'OT' | 'NT' }
  | { kind: 'themes' }
  | { kind: 'popular' }
  | { kind: 'book'; slug: string }
  | { kind: 'theme'; key: string };

export interface QuizzenState {
  view: QuizzenView;
  query: string;
}

type ParamSource = { get(name: string): string | null };

export function readQuizzenState(params: ParamSource): QuizzenState {
  const query = (params.get('q') ?? '').slice(0, 80);
  const book = params.get('boek');
  if (book) return { view: { kind: 'book', slug: book.toLowerCase() }, query };

  const category = params.get('thema') ?? params.get('categorie') ?? params.get('category');
  if (category === 'oude-testament') return { view: { kind: 'testament', testament: 'OT' }, query };
  if (category === 'nieuwe-testament') return { view: { kind: 'testament', testament: 'NT' }, query };
  if (category) return { view: { kind: 'theme', key: category }, query };

  switch (params.get('filter')) {
    case 'oude-testament':
      return { view: { kind: 'testament', testament: 'OT' }, query };
    case 'nieuwe-testament':
      return { view: { kind: 'testament', testament: 'NT' }, query };
    case 'themas':
      return { view: { kind: 'themes' }, query };
    case 'populair':
      return { view: { kind: 'popular' }, query };
    default:
      return { view: { kind: 'overview' }, query };
  }
}

export function quizzenHref(view: QuizzenView, query = ''): string {
  const params = new URLSearchParams();
  switch (view.kind) {
    case 'testament':
      params.set('filter', view.testament === 'OT' ? 'oude-testament' : 'nieuwe-testament');
      break;
    case 'themes':
      params.set('filter', 'themas');
      break;
    case 'popular':
      params.set('filter', 'populair');
      break;
    case 'book':
      params.set('boek', view.slug);
      break;
    case 'theme':
      params.set('thema', view.key);
      break;
    default:
      break;
  }
  if (query.trim()) params.set('q', query.trim());
  const search = params.toString();
  return search ? `/quizzen?${search}` : '/quizzen';
}
