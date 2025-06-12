// components/search-display.tsx

'use client'
import DOMPurify from 'dompurify';
import { useAtom } from 'jotai'
import React from 'react'
import { isSearchingAtom, searchValueAtom } from './search-bar'
import { api } from '@/trpc/react'
import { useDebounceValue, useLocalStorage } from 'usehooks-ts'
import useThreads from '@/hooks/use-threads';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SearchDisplay = () => {
    const [searchValue, setSearchValue] = useAtom(searchValueAtom);
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom);
    const { setThreadId } = useThreads();

    const [debouncedSearch] = useDebounceValue(searchValue, 500);
    const [accountId] = useLocalStorage('accountId', '');

    const { data: searchResults, isLoading, error } = api.account.searchEmails.useQuery(
        { accountId, query: debouncedSearch },
        {
            enabled: !!debouncedSearch && !!accountId && debouncedSearch.trim().length > 0,
            staleTime: 1000 * 60, // 1 minute
        }
    );

    const handleResultClick = (hit: any) => {
        if (!hit.document.threadId) {
            toast.error("This message is not part of a thread");
            return;
        }

        // FIX: Clear all search-related state to exit search mode completely
        setThreadId(hit.document.threadId);
        setIsSearching(false);
        setSearchValue(''); // <-- This was the missing piece
    };

    return (
        <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-gray-600 text-sm dark:text-gray-400">
                    {searchValue ?
                        `Search results for "${searchValue}"` :
                        "Enter a search term"
                    }
                </h2>
                {isLoading && <Loader2 className="size-4 animate-spin text-gray-400" />}
            </div>

            {!searchValue && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Start typing in the search bar to see results.</p>
                </div>
            )}

            {error && (
                <div className="text-center py-8">
                    <p className="text-red-500">Search failed: {error.message}</p>
                </div>
            )}

            {searchValue && !isLoading && searchResults?.hits?.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">No results found for "{searchValue}".</p>
                </div>
            )}

            {searchResults?.hits && searchResults.hits.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">
                        Found {searchResults.hits.length} results
                    </p>
                    <ul className="flex flex-col gap-2">
                        {searchResults.hits.map((hit: any) => (
                            <li
                                onClick={() => handleResultClick(hit)}
                                key={hit.id}
                                className="border rounded-md p-4 hover:bg-gray-100 cursor-pointer transition-all dark:hover:bg-gray-900 dark:border-gray-700"
                            >
                                <h3 className="text-base font-medium mb-1">
                                    {hit.document.subject || 'No Subject'}
                                </h3>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p>From: {hit.document.from}</p>
                                    {hit.document.to && (
                                        <p>To: {Array.isArray(hit.document.to) ? hit.document.to.join(", ") : hit.document.to}</p>
                                    )}
                                    {hit.document.sentAt && (
                                        <p>Date: {new Date(hit.document.sentAt).toLocaleDateString()}</p>
                                    )}
                                </div>
                                {(hit.document.rawBody || hit.document.body) && (
                                    <div
                                        className="text-sm mt-2 line-clamp-3 text-gray-700 dark:text-gray-300"
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(
                                                hit.document.rawBody || hit.document.body || '',
                                                { USE_PROFILES: { html: true } }
                                            )
                                        }}
                                    />
                                )}
                                <div className="mt-2 text-xs text-gray-400">
                                    Relevance: {hit.score?.toFixed(2)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default SearchDisplay;