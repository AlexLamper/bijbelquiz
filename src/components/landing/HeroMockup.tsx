import Image from 'next/image';

/**
 * The hero device mockup.
 *
 * The asset is a pre-rendered, transparent phone render of the app's home
 * screen - frame, screen and shadow are already baked in, so nothing is drawn
 * around it here. Replacing it means dropping a new render into
 * `public/images/screenshots/` and pointing `src` at it.
 */
export function HeroMockup() {
  return (
    <div className="landing-hero-image relative mx-auto w-full max-w-[170px] sm:max-w-[200px] lg:max-w-[250px]">
      <div className="relative aspect-3/5 w-full">
        <Image
          src="/images/screenshots/01-home-left.png"
          alt="De BijbelQuiz-app op een telefoon"
          fill
          priority
          sizes="(max-width: 640px) 170px, (max-width: 1024px) 200px, 250px"
          className="object-contain"
        />
      </div>
    </div>
  );
}
