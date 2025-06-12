/* File: src/components/search-display.tsx */
'use client'

import DOMPurify from 'dompurify';
import { useAtom } from 'jotai'
import React from 'react'
import { searchValueAtom, isSearchingAtom } from './search-bar'
import { api } from '@/trpc/react'
import { useDebounceValue } from 'usehooks-ts'
import useThreads from '@/hooks/use-threads';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const SearchDisplay = () => {
  const [searchValue, setSearchValue] = useAtom(searchValueAtom);
  const [, setIsSearching] = useAtom(isSearchingAtom);
  const { setThreadId, accountId } = useThreads();

  const [debouncedSearch] = useDebounceValue(searchValue, 300);

  const { data: searchResults, isLoading, error } = api.account.searchEmails.useQuery(
    { accountId: accountId!, query: debouncedSearch },
    {
      // The query will only run when all these conditions are true
      enabled: !!debouncedSearch && !!accountId && debouncedSearch.trim().length > 1,
    }
  );

  const handleResultClick = (hit: any) => {
    if (!hit.document.threadId) {
      toast.error("This message is not part of a thread and cannot be displayed.");
      return;
    }
    setThreadId(hit.document.threadId);
    setIsSearching(false);
    setSearchValue('');
  };

  // This function will now determine what to render based on the request's state
  const renderContent = () => {
    const isQueryTooShort = debouncedSearch.trim().length > 0 && debouncedSearch.trim().length < 2;

    if (isQueryTooShort) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Please type at least 2 characters to search.</p>
        </div>
      );
    }
    
    // State 1: Show a loader while the query is in flight.
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      );
    }

    // State 2: Show an error message if the query fails.
    if (error) {
      return (
        <div className="text-center py-8 text-red-500">
          <p>Search failed: {error.message}</p>
        </div>
      );
    }

    // State 3: If we have results, display them.
    if (searchResults && searchResults.hits.length > 0) {
      return (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Found {searchResults.count} results for "{debouncedSearch}"
          </p>
          <ul className="flex flex-col gap-2">
            {searchResults.hits.map((hit: any) => (
              <li
                onClick={() => handleResultClick(hit)}
                key={hit.id}
                className="border rounded-md p-4 hover:bg-muted/50 cursor-pointer transition-all dark:border-gray-700"
              >
                <h3 className="text-base font-medium mb-1 line-clamp-1">
                  {hit.document.subject || 'No Subject'}
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>From: {hit.document.from}</p>
                  {hit.document.sentAt && (
                    <p>Date: {new Date(hit.document.sentAt).toLocaleDateString()}</p>
                  )}
                </div>
                {hit.document.rawBody && (
                  <div
                    className="text-sm mt-2 line-clamp-2 text-foreground/80"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(hit.document.rawBody, { USE_PROFILES: { html: false } })
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      );
    }
    
    // State 4: Default state, or when query ran and found nothing.
    // We check debouncedSearch to avoid showing this message before a search is even attempted.
    if (debouncedSearch) {
       return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No results found for "{debouncedSearch}".</p>
        </div>
      );
    }

    // Fallback: Initial state before any search is typed
    return (
       <div className="text-center py-8 text-muted-foreground">
          <p>Start typing to search your emails.</p>
        </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {renderContent()}
      </div>
    </ScrollArea>
  );
}

export default SearchDisplay;