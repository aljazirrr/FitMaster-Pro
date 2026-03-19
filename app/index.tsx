import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/useAuthStore';

export default function Index() {
  const isOnboarded = useAuthStore((s) => s.isOnboarded);
  return <Redirect href={isOnboarded ? '/(tabs)' : '/onboarding'} />;
}
