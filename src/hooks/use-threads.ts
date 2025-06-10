import { api } from '@/trpc/react';
import { useLocalStorage } from 'usehooks-ts';
import React from 'react';
import { atom, useAtom } from 'jotai'


export const threadIdAtom =atom<string|null>(null)


const useThreads = () => {
  const { data: accounts } = api.account.getAccounts.useQuery();
  const { data: accountId } = api.account.getAccountIdByUser.useQuery();
  const [tab] = useLocalStorage('normalhuman-tab', 'inbox');
  const [done] = useLocalStorage('normalhuman-done', false);
  const [threadId, setThreadId] = useAtom(threadIdAtom)

  const isEnabled = !!accountId && !!tab;

  const { data: threads, isFetching, refetch } = api.account.getThreads.useQuery(
    isEnabled
      ? {
          accountId,
          tab,
          done,
        }
      :
        (undefined as any),
    {
      enabled: isEnabled,
      placeholderData: (e) => e,
      refetchInterval: 5000,
    }
  );

  return {
    threads,
    isFetching,
    refetch,
    accountId,
    threadId, setThreadId,
    account: accounts?.find((e) => e.id === accountId),
  };
};

export default useThreads;
