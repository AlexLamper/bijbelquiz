const quizImages: Record<string, any> = {
  img1: require('../assets/images/quizzes/img1.png'),
  img2: require('../assets/images/quizzes/img2.png'),
  img3: require('../assets/images/quizzes/img3.png'),
  img4: require('../assets/images/quizzes/img4.png'),
  img5: require('../assets/images/quizzes/img5.png'),
  img6: require('../assets/images/quizzes/img6.png'),
  img7: require('../assets/images/quizzes/img7.png'),
  img8: require('../assets/images/quizzes/img8.png'),
};

export function getQuizImage(imageUrl?: string): any {
  if (!imageUrl) return null;
  const filename = imageUrl.split('/').pop();
  const key = filename?.replace('.png', '');
  return key ? (quizImages[key] ?? null) : null;
}

export default quizImages;
