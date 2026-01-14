import { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Inloggen - BijbelQuiz',
  description: 'Log in op je BijbelQuiz account en bekijk je voortgang.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
