'use client';

import { useState } from 'react';
import { Check, Copy, Share } from 'lucide-react';

import { Avatar, Button, Container, Modal } from '@/components/bq';
import type { MultiplayerControllerConnectionStatus } from '@/lib/multiplayer-web/useMultiplayerRoomController';
import type { RoomSnapshot } from '@/lib/multiplayer/types';
import { cn } from '@/lib/utils';
import { siteHost } from './players';
import { QuizBadge } from './QuizPicker';
import { questionCountLabel, quizDisplayTitle } from './quiz-display';
import type { ShareState } from './RoomClient';
import { t } from '@/i18n';
import { rich } from '@/i18n/rich';

interface LobbyViewProps {
  room: RoomSnapshot;
  userId: string | null;
  isHost: boolean;
  canStart: boolean;
  isStarting: boolean;
  isLeaving: boolean;
  connectionStatus: MultiplayerControllerConnectionStatus;
  categoryTitle: string | null;
  shareState: ShareState;
  codeCopied: boolean;
  onShare: () => void;
  onCopyCode: () => void;
  onStart: () => void;
  onLeave: (target?: string) => void;
  errorBar: React.ReactNode;
  debug: React.ReactNode;
}

const MIN_PLAYERS = 2;

export function LobbyView({
  room,
  userId,
  isHost,
  canStart,
  isStarting,
  isLeaving,
  connectionStatus,
  categoryTitle,
  shareState,
  codeCopied,
  onShare,
  onCopyCode,
  onStart,
  onLeave,
  errorBar,
  debug,
}: LobbyViewProps) {
  const [confirmChange, setConfirmChange] = useState(false);

  const passageLabel = room.passage?.label ?? null;
  const missing = Math.max(0, MIN_PLAYERS - room.players.length);
  const enough = missing === 0;
  const changeHref = `/samen-spelen?quiz=${encodeURIComponent(room.quizId)}`;
  const others = room.players.filter((player) => player.id !== userId).length;
  const quizMeta = [categoryTitle, questionCountLabel(room.totalQuestions)].filter(Boolean).join(' · ');

  return (
    <Container className="flex flex-col gap-7 pb-[72px] pt-10 max-m:px-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">{t('samen.lobby.title')}</h1>
        <p className="m-0 text-[17px] font-semibold leading-[26px] text-ink-soft">
          {isHost ? t('samen.lobby.subHost') : t('samen.lobby.subGuest')}
        </p>
      </div>

      {errorBar}

      <div className="grid grid-cols-1 items-start gap-8 m:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-label={t('samen.lobby.codeAria')}
            className="flex flex-col items-center gap-2 rounded-[16px] border border-line bg-card px-8 pb-8 pt-9 text-center max-m:px-6"
          >
            <span className="text-[13px] font-extrabold leading-[18px] tracking-[0.06em] text-lapis">{t('samen.lobby.codeLabel')}</span>
            <span
              className="whitespace-nowrap pl-[0.12em] text-[52px] font-extrabold leading-[1.1] tracking-[0.12em] m:text-[112px]"
              aria-label={t('samen.lobby.codeSpoken', { code: room.code.split('').join(' ') })}
            >
              {room.code}
            </span>
            <span className="text-[17px] font-semibold leading-6 text-ink-soft">
              {rich(t('samen.lobby.goTo'), { url: <span className="whitespace-nowrap font-extrabold text-ink">{siteHost()}/samen-spelen</span> })}
            </span>
            <div className="mt-4 flex w-full flex-col gap-2.5 m:w-auto m:flex-row">
              <Button variant="secondary" size="lg" className="px-5" onClick={onShare} aria-live="polite">
                {shareState === 'copied' ? (
                  <Check className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <Share className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
                )}
                {shareState === 'copied' ? t('samen.lobby.inviteCopied') : t('samen.lobby.invite')}
              </Button>
              <Button variant="secondary" size="lg" className="px-5" onClick={onCopyCode} aria-live="polite">
                {codeCopied ? (
                  <Check className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <Copy className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
                )}
                {codeCopied ? t('samen.lobby.codeCopied') : t('samen.lobby.copyCode')}
              </Button>
            </div>
          </section>

          <section aria-labelledby="spelers-titel" className="flex flex-col rounded-[16px] border border-line bg-card">
            <div className="flex items-baseline justify-between gap-3 px-6 pt-5">
              <h2 id="spelers-titel" className="m-0 text-[22px] leading-7">
                {t('samen.game.players')}
              </h2>
              <span className="text-[15px] font-bold text-ink-muted">
                {t('samen.lobby.ofMax', { count: room.players.length, max: room.maxPlayers })}
              </span>
            </div>
            <ul
              aria-live="polite"
              className="m-0 grid list-none gap-x-2 gap-y-[18px] px-6 py-5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))' }}
            >
              {room.players.map((player) => {
                const isMe = player.id === userId;
                const label = isMe ? (player.isHost ? t('samen.lobby.youHost') : t('samen.you')) : player.name;
                return (
                  <li
                    key={player.id}
                    className={cn('flex min-w-0 flex-col items-center gap-1.5', !player.isConnected && 'opacity-50')}
                    title={player.isConnected ? undefined : t('samen.lobby.isOffline', { name: player.name })}
                  >
                    <Avatar name={player.name} size={48} tone={isMe ? 'lapis' : 'auto'} title={label} />
                    <span className="max-w-full truncate text-sm font-bold leading-[18px]">{label}</span>
                    {!isMe && player.isHost && (
                      <span className="-mt-1 text-xs font-bold leading-4 text-ink-muted">{t('samen.lobby.host')}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mx-6 mb-0 mt-0 border-t border-line-soft pb-[18px] pt-3.5 text-center text-sm font-semibold leading-5 text-ink-muted">
              {connectionStatus === 'connected' || connectionStatus === 'idle'
                ? t('samen.lobby.newPlayers')
                : t('samen.lobby.reconnecting')}
            </p>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <section aria-labelledby="quiz-titel" className="flex flex-col rounded-[16px] border border-line bg-card">
            <div className="flex items-baseline justify-between px-5 pt-[18px]">
              <h2 id="quiz-titel" className="m-0 font-sans text-base font-extrabold leading-[22px]">
                {t('samen.start.quiz')}
              </h2>
              {isHost && (
                <button
                  type="button"
                  onClick={() => (others > 0 ? setConfirmChange(true) : onLeave(changeHref))}
                  className="text-[15px] font-bold text-lapis hover:text-lapis-edge"
                >
                  {t('samen.lobby.change')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 px-5 pb-[18px] pt-3">
              <QuizBadge quiz={{ title: room.quizTitle, passageLabel }} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-bold">{quizDisplayTitle(room.quizTitle, passageLabel)}</span>
                <span className="text-sm font-semibold text-ink-muted">{quizMeta}</span>
              </span>
            </div>
          </section>

          <section aria-label={t('samen.lobby.startAria')} className="flex flex-col gap-3.5 rounded-[16px] border border-line bg-card p-5">
            <div className="flex items-center gap-2.5" role="status">
              {enough ? (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green text-white" aria-hidden="true">
                  <Check className="size-4" strokeWidth={3} />
                </span>
              ) : (
                <span className="size-7 shrink-0 rounded-full border-2 border-dashed border-input-line" aria-hidden="true" />
              )}
              <span className={cn('text-base font-bold', enough ? 'text-green-text' : 'text-ink-muted')}>
                {enough
                  ? isHost
                    ? t('samen.lobby.enoughHost')
                    : t('samen.lobby.enoughGuest')
                  : t(missing === 1 ? 'samen.lobby.needOne' : 'samen.lobby.needMany', { missing })}
              </span>
            </div>
            {isHost ? (
              <Button size="xl" block onClick={onStart} disabled={!canStart} loading={isStarting}>
                {isStarting ? t('samen.lobby.starting') : t('samen.lobby.start')}
              </Button>
            ) : (
              <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-muted">
                {t('samen.lobby.guestHint')}
              </p>
            )}
            <Button variant="secondary" size="lg" block onClick={() => onLeave()} loading={isLeaving}>
              {isHost && others === 0 ? t('samen.lobby.close') : t('samen.lobby.leave')}
            </Button>
          </section>
        </aside>
      </div>

      {debug}

      <Modal
        open={confirmChange}
        onOpenChange={setConfirmChange}
        title={t('samen.lobby.changeTitle')}
        description={t('samen.lobby.changeText')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmChange(false)}>
              {t('samen.stay')}
            </Button>
            <Button
              onClick={() => {
                setConfirmChange(false);
                onLeave(changeHref);
              }}
              loading={isLeaving}
            >
              {t('samen.lobby.changeConfirm')}
            </Button>
          </>
        }
      />
    </Container>
  );
}
