'use client'

import DOMPurify from 'dompurify';
import { useAtom } from 'jotai'
import React from 'react'
import { searchValueAtom } from './search-bar'
import { api } from '@/trpc/react'
import { useDebounceValue } from 'usehooks-ts'
import useThreads from '@/hooks/use-threads';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import type { ComponentProps } from "react";

const getFormattedDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "yyyy-MM-dd");
};

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default";
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "secondary";
}

const SearchDisplay = () => {
  const [searchValue] = useAtom(searchValueAtom);
  const { setThreadId, accountId, threadId } = useThreads();

  const [debouncedSearch] = useDebounceValue(searchValue, 300);

  const { data: searchResults, isLoading, error } = api.account.searchEmails.useQuery(
    { accountId: accountId!, query: debouncedSearch },
    {
      enabled: !!debouncedSearch && !!accountId && debouncedSearch.trim().length > 1,
    }
  );

  const handleResultClick = (hit: any) => {
    if (!hit.document.threadId) {
      toast.error("This message is not part of a thread and cannot be displayed.");
      return;
    }
    setThreadId(hit.document.threadId);
  };

  const renderContent = () => {
    const isQueryTooShort = debouncedSearch.trim().length > 0 && debouncedSearch.trim().length < 2;

    if (isQueryTooShort) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p>Please type at least 2 characters to search.</p>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-8 text-center text-red-500">
          <p>Search failed: {error.message}</p>
        </div>
      );
    }

    if (searchResults && searchResults.hits.length > 0) {
      // Group search results by date, similar to ThreadList
      const groupedResults = searchResults.hits.reduce((acc: Record<string, any[]>, hit: any) => {
        const dateKey = getFormattedDate(hit.document.sentAt ?? new Date());
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(hit);
        return acc;
      }, {} as Record<string, any[]>);

      return (
        <>
          <div className="text-primary mb-4 text-sm font-bold uppercase tracking-wide">
            Search Results ({searchResults.count}) for "{debouncedSearch}"
          </div>
          
          {Object.entries(groupedResults).map(([date, hits]) => (
            <React.Fragment key={date}>
              <div className="text-primary mt-8 mb-3 text-sm font-bold uppercase tracking-wide">
                {date}
              </div>
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {hits.map((hit) => (
                    <motion.button
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleResultClick(hit)}
                      key={hit.id}
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-xl border border-border p-4 transition-all shadow-sm hover:shadow-md bg-background text-left",
                        {
                          "bg-accent border-accent shadow-md": hit.document.threadId === threadId,
                        }
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-semibold text-sm text-primary">
                          {hit.document.from || "Unknown Sender"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {hit.document.sentAt ? formatDistanceToNow(new Date(hit.document.sentAt), {
                            addSuffix: true,
                          }) : "Unknown time"}
                        </div>
                      </div>

                      <div className="text-sm font-medium text-foreground line-clamp-1 group-hover:bg-muted px-1 py-0.5 rounded-md">
                        {hit.document.subject || "(No Subject)"}
                      </div>

                      {hit.document.rawBody && (
                        <div
                          className="text-xs text-muted-foreground line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(hit.document.rawBody, {
                              USE_PROFILES: { html: true },
                            }),
                          }}
                        />
                      )}

                      {/* Add badges if available in search results */}
                      {hit.document.labels && hit.document.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {hit.document.labels.map((label: string) => (
                            <Badge
                              key={label}
                              variant={getBadgeVariantFromLabel(label)}
                              className="hover:bg-muted cursor-pointer"
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </React.Fragment>
          ))}
        </>
      );
    }
    
    if (debouncedSearch) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p>No results found for "{debouncedSearch}".</p>
        </div>
      );
    }

    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>Start typing to search your emails.</p>
      </div>
    );
  };

  return (
    <div className="max-h-[calc(100vh-120px)] overflow-y-scroll px-4 pb-4">
      {renderContent()}
    </div>
  );
}

export default SearchDisplay;