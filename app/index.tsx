import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { HOME_ROUTE, LOGIN_ROUTE } from '@/utils/auth-navigation';

export default function RootIndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Redirect href={isAuthenticated ? HOME_ROUTE : LOGIN_ROUTE} />;
}
