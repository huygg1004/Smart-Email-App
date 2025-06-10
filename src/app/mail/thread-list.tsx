import useThreads from "@/hooks/use-threads";
import React from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { Badge } from "@/components/ui/badge";
import type { ComponentProps } from "react";
import { motion, AnimatePresence } from "framer-motion";

const getFormattedDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "yyyy-MM-dd");
};

const ThreadList = () => {
  const { threads, threadId, setThreadId } = useThreads();

  const groupedThreads = threads?.reduce(
    (acc, thread) => {
      const dateKey = getFormattedDate(thread.emails[0]?.sentAt ?? new Date());
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(thread);
      return acc;
    },
    {} as Record<string, typeof threads>
  );

  return (
    <div className="max-h-[calc(100vh-120px)] overflow-y-scroll px-4 pb-4">
      {Object.entries(groupedThreads ?? {}).map(([date, threads]) => (
        <React.Fragment key={date}>
          <div className="text-primary mt-8 mb-3 text-sm font-bold uppercase tracking-wide">
            {date}
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {threads.map((thread) => (
                <motion.button
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setThreadId(thread.id)}
                  key={thread.id}
                  className={cn(
                    "group relative flex flex-col gap-2 rounded-xl border border-border p-4 transition-all shadow-sm hover:shadow-md bg-background text-left",
                    {
                      "bg-accent border-accent shadow-md": thread.id === threadId,
                    }
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-sm text-primary">
                      {thread.emails.at(-1)?.from?.name || "Unknown Sender"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(thread.emails.at(-1)?.sentAt ?? new Date(), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <div className="text-sm font-medium text-foreground line-clamp-1 group-hover:bg-muted px-1 py-0.5 rounded-md">
                    {thread.subject || "(No Subject)"}
                  </div>

                  <div
                    className="text-xs text-muted-foreground line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(thread.emails.at(-1)?.bodySnippet ?? "", {
                        USE_PROFILES: { html: true },
                      }),
                    }}
                  />

                  {thread.emails[0]?.sysLabels.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {thread.emails[0]?.sysLabels.map((label) => (
                        <Badge
                          key={label}
                          variant={getBadgeVariantFromLabel(label)}
                          className="hover:bg-muted cursor-pointer"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
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

export default ThreadList;
