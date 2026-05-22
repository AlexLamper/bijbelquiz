import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Inloggen | BijbelQuiz - Ga Verder met Leren',
  description: 'Log in op je BijbelQuiz account. Bekijk je statistieken, hervat openstaande quizzen en houd je streak vast.',
  alternates: {
    canonical: '/inloggen',
  },
  openGraph: {
    title: 'Inloggen bij BijbelQuiz',
    description: 'Welkom terug! Log in om verder te spelen.',
    url: 'https://www.bijbelquiz.com/inloggen',
  }
};

export default function LoginPage() {
  return <LoginForm />;
}
