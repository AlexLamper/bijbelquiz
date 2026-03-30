# Plan for Using Images across Web and Mobile in the Bijbelquiz Monorepo

## Problem
Images (like quiz thumbnails, category icons, themes, and badges) need to be displayed correctly and performantly on both the Next.js Web Application (`apps/web`) and the Expo React Native Application (`apps/mobile`).

## Proposed Solution: Cloud Storage with Remote URLs
Since this is a production-style application used across platforms, bundling all images locally in the app packages will increase bundle size significantly and require app updates every time a new quiz image is added. 

The ideal solution is to use **Cloud Storage** (such as AWS S3, Cloudflare R2, Vercel Blob, or Supabase Storage). 
Instead of local files (`require('../../assets/images/quiz.png')`), your database (`quizzes.json` / MongoDB) will store full URLs to the remote images.

### Structure
```json
// Example database document
{
  "_id": "123",
  "title": "Het Oude Testament",
  "imageUrl": "https://your-bucket-name.s3.eu-central-1.amazonaws.com/quizzes/oude-testament.png"
}
```

### 1. Implementation for Web (Next.js)
In Next.js, you'll use the `next/image` component to handle automatic optimization, WebP formatting, and responsive sizing. 
- You will need to add the domain to your `next.config.ts` so Next.js allows optimizing those images:
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-bucket-name.s3.eu-central-1.amazonaws.com',
      },
    ],
  },
};
```
- In the frontend component (`QuizCard.tsx`):
```tsx
import Image from 'next/image';

<Image src={quiz.imageUrl} alt={quiz.title} width={400} height={300} className="rounded-xl object-cover" />
```

### 2. Implementation for Mobile (Expo)
In Expo (React Native), you'll use the `Image` component from `react-native` or `expo-image` for high-performance caching.
- Using `expo-image` (Recommended!):
```bash
# In apps/mobile
npx expo install expo-image
```
- In the frontend component:
```tsx
import { Image } from 'expo-image';

<Image 
  source={quiz.imageUrl} 
  style={{ width: '100%', height: 200 }} 
  contentFit="cover" 
  transition={200} // nice fade-in effect
/>
```

### Temporary Development Setup (Before Cloud Storage is ready)
If you don't have an Amazon S3/Cloudflare bucket ready today:
1. Place all images in `apps/web/public/images/`.
2. Locally, the Next.js app will read them via `/images/quiz.png`.
3. In the mobile app during dev, you can fetch them from your local Next.js server (e.g. `http://192.168.x.x:3000/images/quiz.png`) or duplicate the assets temporarily into `apps/mobile/assets/images/` and use them dynamically.
*We strongly recommend going straight to a Vercel Blob or S3 bucket, to keep the `quizzes.json` structure pointing to standard `https://...` links.*

## Action Items
1. [ ] Choose a storage provider (Cloudflare R2 is the cheapest/free, Vercel Blob is the easiest if using Next.js).
2. [ ] Upload initial images (e.g., standard placeholders) to the bucket.
3. [ ] Add string property `imageUrl` in the `Category` and `Quiz` Mongoose / JSON models.
4. [ ] Install `expo-image` in the mobile app to handle caching natively. 
5. [ ] Update `apps/web/next.config.ts` with the remote pattern.