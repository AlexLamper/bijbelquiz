import { Spinner } from '@/components/bq';
import { t } from '@/i18n';

export default function DashboardLoading() {
  return <Spinner block label={t('loadingLabels.dashboard')} className="min-h-[60vh]" />;
}
