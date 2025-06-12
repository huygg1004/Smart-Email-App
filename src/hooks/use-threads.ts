/* File: src/hooks/use-threads.ts */
import { api, type RouterOutputs } from '@/trpc/react';
import { useLocalStorage } from 'usehooks-ts';
import React, { useState, useEffect } from 'react';
import { atom, useAtom } from 'jotai';

export const threadIdAtom = atom<string | null>(null);

// ✅ Define a type for a single thread based on your router output
type Thread = RouterOutputs["account"]["getThreads"][0];

const useThreads = () => {
  const { data: accounts } = api.account.getAccounts.useQuery();
  const { data: accountId } = api.account.getAccountIdByUser.useQuery();
  const [tab] = useLocalStorage('normalhuman-tab', 'inbox');
  const [done] = useLocalStorage('normalhuman-done', false);
  const [threadId, setThreadId] = useAtom(threadIdAtom);
  const [searchSelectedThread, setSearchSelectedThread] = useState<Thread | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  const isEnabled = !!accountId && !!tab;

  const { data: threads, isFetching, refetch } = api.account.getThreads.useQuery(
    isEnabled
      ? {
          accountId,
          tab,
          done,
        }
      : (undefined as any),
    {
      enabled: isEnabled,
      placeholderData: (e) => e,
      refetchInterval: 5000,
    }
  );

  // ✅ Hook to fetch a thread directly when threadId changes
  const { data: fetchedThreadById, isFetching: isFetchingById } =
    api.account.getThreadById.useQuery(
      { accountId: accountId!, threadId: threadId! },
      {
        enabled: !!accountId && !!threadId,
      }
    );

  // ✅ Clear loading state when thread fetch settles
  useEffect(() => {
    if (!isFetchingById) {
      setIsLoadingThread(false);
    }
  }, [isFetchingById]);

  // ✅ Set loading state when threadId changes
  useEffect(() => {
    if (threadId) {
      const existingThread = threads?.find((t) => t.id === threadId);
      const hasSearchSelectedThread = searchSelectedThread && searchSelectedThread.id === threadId;

      if (!existingThread && !hasSearchSelectedThread) {
        setIsLoadingThread(true);
      }
    } else {
      setIsLoadingThread(false);
    }
  }, [threadId, threads, searchSelectedThread]);

  useEffect(() => {
    if (fetchedThreadById) {
      setSearchSelectedThread(fetchedThreadById as Thread);
    }
  }, [fetchedThreadById]);

  const activeThread = React.useMemo(() => {
    if (!threadId) return null;
    if (searchSelectedThread && searchSelectedThread.id === threadId) {
      return searchSelectedThread;
    }
    return threads?.find((t) => t.id === threadId) ?? null;
  }, [threadId, threads, searchSelectedThread]);

  const handleSetThreadId = React.useCallback(
    (newThreadId: string | null) => {
      if (newThreadId !== threadId) {
        setThreadId(newThreadId);
        // Loading is handled via useEffect
      }
    },
    [threadId, setThreadId]
  );

  return {
    threads,
    isFetching: isFetching || isFetchingById,
    refetch,
    accountId,
    threadId,
    setThreadId: handleSetThreadId,
    thread: activeThread,
    account: accounts?.find((e) => e.id === accountId),
    isLoadingThread,
  };
};

export default useThreads;
