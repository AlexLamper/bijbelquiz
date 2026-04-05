"use client";

import React from 'react';

export function DownloadButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2">
      <button 
        onClick={() => alert("De mobiele app komt binnen enkele weken!")}
        className="flex items-center justify-center gap-3 bg-[#1d1d1f] hover:bg-black text-white h-14 px-6 rounded-2xl transition-colors min-w-[160px]"
      >
        <svg viewBox="0 0 384 512" className="w-8 h-8 fill-current">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
        </svg>
        <div className="text-left flex flex-col leading-tight">
          <span className="text-[10px] text-gray-300">Download in de</span>
          <span className="text-[17px] font-semibold tracking-wide">App Store</span>
        </div>
      </button>

      <button 
        onClick={() => alert("De mobiele app komt binnen enkele weken!")}
        className="flex items-center justify-center gap-3 bg-[#1d1d1f] hover:bg-black text-white h-14 px-6 rounded-2xl transition-colors min-w-[160px]"
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" alt="Google Play" className="w-8 h-8" />
        <div className="text-left flex flex-col leading-tight">
          <span className="text-[10px] text-gray-300">Ontdek het op</span>
          <span className="text-[17px] font-semibold tracking-wide">Google Play</span>
        </div>
      </button>
    </div>
  );
}
