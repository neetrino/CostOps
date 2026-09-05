'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UnauthorizedError } from '@/features/dashboard/api-client';

export function useUnauthorizedRedirect(error: unknown): void {
  const router = useRouter();
  useEffect(() => {
    if (error instanceof UnauthorizedError) {
      router.replace('/login');
    }
  }, [error, router]);
}
