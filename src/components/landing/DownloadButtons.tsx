"use client";

import React, { useState } from 'react';

interface DownloadButtonsProps {
  compactOnMobile?: boolean;
}

export function DownloadButtons({ compactOnMobile = false }: DownloadButtonsProps) {
  const [showTesterModal, setShowTesterModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const androidLink = 'https://play.google.com/store/apps/details?id=com.bijbelquiz.app';
  const webTestingLink = 'https://play.google.com/apps/testing/com.bijbelquiz.app';

  async function handleTesterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Vul je e-mailadres in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          source: 'play-store-tester',
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || 'Opslaan mislukt, probeer opnieuw.');
      }

      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Er ging iets mis.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openTesterPopup() {
    setShowTesterModal(true);
    setSubmitted(false);
    setErrorMessage('');
  }

  function closeTesterPopup() {
    setShowTesterModal(false);
    setIsSubmitting(false);
  }

  return (
    <>
      <div className={`flex w-full gap-3 sm:w-auto sm:gap-4 ${compactOnMobile ? 'flex-row' : 'flex-col sm:flex-row'}`}>
      <button 
        onClick={openTesterPopup}
        className={`flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#1d1d1f] text-white transition-colors hover:bg-black dark:border dark:border-zinc-700 dark:bg-[#16181d] ${
          compactOnMobile ? 'min-w-0 flex-1 px-3 sm:min-w-46 sm:px-5 lg:min-w-48 lg:px-6' : 'min-w-40 px-6'
        }`}
      >
        <img src="/icon/Google_Play_Arrow_logo.svg" alt="Google Play" className="w-8 h-8" />
        <div className="flex flex-col text-left leading-tight">
          <span className="whitespace-nowrap text-[10px] text-gray-300">Ontdek het op</span>
          <span className={`${compactOnMobile ? 'text-[15px] sm:text-[17px]' : 'text-[17px]'} whitespace-nowrap font-semibold`}>Google Play</span>
        </div>
      </button>

      <button 
        onClick={() => alert("De mobiele app komt binnen enkele weken!")}
        className={`flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#1d1d1f] text-white transition-colors hover:bg-black dark:border dark:border-zinc-700 dark:bg-[#16181d] ${
          compactOnMobile ? 'min-w-0 flex-1 px-3 sm:min-w-46 sm:px-5 lg:min-w-48 lg:px-6' : 'min-w-40 px-6'
        }`}
      >
        <svg viewBox="0 0 384 512" className="w-8 h-8 fill-current">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
        </svg>
        <div className="flex flex-col text-left leading-tight">
          <span className="whitespace-nowrap text-[10px] text-gray-300">Download in de</span>
          <span className={`${compactOnMobile ? 'text-[15px] sm:text-[17px]' : 'text-[17px]'} whitespace-nowrap font-semibold`}>App Store</span>
        </div>
      </button>
      </div>

      {showTesterModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#d7e1ee] bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-[#1f2f4b] dark:text-zinc-100">
              Help ons de app live te krijgen
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ik heb 12 testers nodig voordat de app officieel live kan. Laat je e-mailadres achter en ik stuur je direct de testlink.
            </p>

            {!submitted ? (
              <form className="mt-4 space-y-3" onSubmit={handleTesterSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="jij@email.com"
                  className="h-11 w-full rounded-md border border-[#d7e1ee] px-3 text-sm outline-none focus:border-[#6f8ed4] dark:border-zinc-700 dark:bg-zinc-950"
                  required
                />
                {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-md bg-[#6f8ed4] text-sm font-semibold text-white hover:bg-[#5f81cc] disabled:opacity-70"
                >
                  {isSubmitting ? 'Opslaan...' : 'Stuur mij de testlink'}
                </button>
              </form>
            ) : (
              <div className="mt-4 space-y-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                <p className="font-medium text-emerald-700 dark:text-emerald-300">
                  Top, je staat op de testerslijst.
                </p>
                <a className="block text-[#355384] underline dark:text-[#9db5dc]" href={androidLink} target="_blank" rel="noopener noreferrer">
                  Test op Android (Play Store)
                </a>
                <a className="block text-[#355384] underline dark:text-[#9db5dc]" href={webTestingLink} target="_blank" rel="noopener noreferrer">
                  Test op internet (Google Testing)
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={closeTesterPopup}
              className="mt-4 w-full rounded-md border border-[#d7e1ee] px-3 py-2 text-sm font-medium text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </>
  );
}
