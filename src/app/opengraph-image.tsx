import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'BijbelQuiz – Gratis Bijbelquizzen Spelen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a2f52 0%, #243a68 60%, #1e3260 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'rgba(111, 142, 212, 0.15)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(111, 142, 212, 0.1)',
            display: 'flex',
          }}
        />

        {/* Logo mark — book shape rendered inline */}
        <div
          style={{
            width: 110,
            height: 110,
            background: '#ffffff',
            borderRadius: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          }}
        >
          {/* Simple open-book icon drawn with divs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 34,
                height: 46,
                background: '#192942',
                borderRadius: '3px 0 0 3px',
                display: 'flex',
              }}
            />
            <div style={{ width: 3, height: 50, background: '#6f8ed4', borderRadius: 2, display: 'flex' }} />
            <div
              style={{
                width: 34,
                height: 46,
                background: '#192942',
                borderRadius: '0 3px 3px 0',
                display: 'flex',
              }}
            />
          </div>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-1px',
            lineHeight: 1,
            display: 'flex',
          }}
        >
          BijbelQuiz
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 30,
            color: '#a8c0e8',
            marginTop: 18,
            fontWeight: 400,
            letterSpacing: 0.3,
            display: 'flex',
          }}
        >
          Gratis Bijbelquizzen Spelen &amp; Bijbelkennis Testen
        </div>

        {/* CTA pill */}
        <div
          style={{
            marginTop: 40,
            background: '#6f8ed4',
            color: '#ffffff',
            fontSize: 22,
            fontWeight: 600,
            padding: '12px 36px',
            borderRadius: 50,
            display: 'flex',
            letterSpacing: 0.5,
          }}
        >
          Begin nu op bijbelquiz.com
        </div>
      </div>
    ),
    { ...size },
  );
}
