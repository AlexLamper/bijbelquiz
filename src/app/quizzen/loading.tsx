import { Spinner } from '@/components/bq';
import { t } from '@/i18n';

export default function QuizzesLoading() {
  return <Spinner block label={t('loadingLabels.quizzes')} className="min-h-[60vh]" />;
}
