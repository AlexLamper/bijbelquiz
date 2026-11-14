'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';

import { Button, TextDivider } from '@/components/bq';
import { AppleIcon, GoogleIcon } from '@/components/bq/icons';
import { t } from '@/i18n';

/**
 * "Doorgaan met Apple" (only when the server has Apple configured) and
 * "Doorgaan met Google", then the "of met e-mail" divider.
 */
export function SocialButtons({ callbackUrl, appleEnabled }: { callbackUrl: string; appleEnabled: boolean }) {
  const [pending, setPending] = React.useState<'apple' | 'google' | null>(null);

  const start = (provider: 'apple' | 'google') => {
    setPending(provider);
    void signIn(provider, { callbackUrl });
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {appleEnabled && (
          <Button variant="dark" size="xl" block loading={pending === 'apple'} onClick={() => start('apple')}>
            {pending !== 'apple' && <AppleIcon size={18} />}
            {t('account.social.apple')}
          </Button>
        )}
        <Button variant="secondary" size="xl" block loading={pending === 'google'} onClick={() => start('google')}>
          {pending !== 'google' && <GoogleIcon size={18} />}
          {t('account.social.google')}
        </Button>
      </div>
      <TextDivider>{t('account.social.or')}</TextDivider>
    </>
  );
}
