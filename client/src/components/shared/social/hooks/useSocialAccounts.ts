/**
 * useSocialAccounts Hook
 * ═══════════════════════════════════════════════════════════════════════════
 * Manages social media account connections for the current workspace
 */

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/contexts/workspace-context';
import { lateApi, type LateAccount, type LatePlatform } from '@/lib/api/late';
import type { UseSocialAccountsResult } from '../types';

export function useSocialAccounts(): UseSocialAccountsResult {
  const { currentWorkspace } = useWorkspace();
  const [accounts, setAccounts] = useState<LateAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch connected accounts
  const fetchAccounts = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedAccounts = await lateApi.getConnectedAccounts(currentWorkspace.id);
      setAccounts(fetchedAccounts);
      console.log('[useSocialAccounts] Fetched accounts:', fetchedAccounts.length);
    } catch (err) {
      console.error('[useSocialAccounts] Failed to fetch accounts:', err);
      setError('Failed to load connected accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  // Initial fetch
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Check if a platform is connected
  const isConnected = useCallback((platform: LatePlatform): boolean => {
    return accounts.some(acc => acc.platform === platform && acc.isActive);
  }, [accounts]);

  // Get OAuth connect URL for a platform
  const getConnectUrl = useCallback(async (platform: LatePlatform): Promise<string | null> => {
    if (!currentWorkspace?.id) return null;

    try {
      const { connectUrl } = await lateApi.getConnectUrl(
        currentWorkspace.id,
        platform,
        window.location.href // Return to current page after OAuth
      );
      return connectUrl;
    } catch (err) {
      console.error('[useSocialAccounts] Failed to get connect URL:', err);
      return null;
    }
  }, [currentWorkspace?.id]);

  return {
    accounts,
    isLoading,
    error,
    refetch: fetchAccounts,
    isConnected,
    getConnectUrl,
  };
}

