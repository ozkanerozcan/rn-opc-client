import { useEffect } from 'react';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Global Authentication Guard
 * 
 * Protection Strategy:
 * - By DEFAULT, ALL routes are PROTECTED (require authentication)
 * - Only routes explicitly listed in PUBLIC_ROUTES are accessible without auth
 * - This ensures any new page added is automatically protected
 * 
 * Public Routes (no auth required):
 * - /login
 * - /register
 * - / (index) - redirects based on auth state
 */
export default function AuthGuard({ children }) {
  const { user, initializing } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    // PUBLIC ROUTES - Only these routes are accessible without authentication
    // Add any new public route here (e.g., 'forgot-password', 'terms', etc.)
    const PUBLIC_ROUTES = [
      'login',
      'register',
      'index',
      '', // root
    ];

    // Get the first segment of the route
    const currentRoute = segments[0] || '';
    
    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);

    console.log('[AuthGuard]', {
      user: user ? user.email : 'none',
      currentRoute,
      isPublicRoute,
      segments,
      pathname
    });

    if (!user && !isPublicRoute) {
      // USER NOT AUTHENTICATED + TRYING TO ACCESS PROTECTED ROUTE
      // → Redirect to login
      console.log('[AuthGuard] Redirecting unauthenticated user to /login');
      router.replace('/login');
    } else if (user && (currentRoute === 'login' || currentRoute === 'register')) {
      // USER AUTHENTICATED + TRYING TO ACCESS LOGIN/REGISTER
      // → Redirect to home
      console.log('[AuthGuard] Redirecting authenticated user to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [user, initializing, segments, pathname]);

  // Show loading indicator during initialization
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return children;
}
