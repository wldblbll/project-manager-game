import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthComponent } from './AuthComponent';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return fallback || <AuthComponent />;
  }

  return <>{children}</>;
} 