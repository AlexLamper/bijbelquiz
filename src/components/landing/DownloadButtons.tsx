"use client";

import React from 'react';

interface DownloadButtonsProps {
  compactOnMobile?: boolean;
}

export function DownloadButtons({ compactOnMobile = false }: DownloadButtonsProps) {
  return (
    <div className={`flex w-full gap-3 sm:w-auto sm:gap-4 ${compactOnMobile ? 'flex-row' : 'flex-col sm:flex-row'}`}>
      <button 
        onClick={() => alert("De mobiele app komt binnen enkele weken!")}
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
  );
}
