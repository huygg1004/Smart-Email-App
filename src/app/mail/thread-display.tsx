/* File: src/components/ThreadDisplay.tsx */
"use client";
import React, { useState } from "react";
import useThreads from "@/hooks/use-threads";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveX, Trash2, Clock, MoreVertical, Pencil, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import EmailDisplay from "./email-display";
import ReplyBox from "./reply-box";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ThreadDisplay = () => {
  const { thread, threadId, isLoadingThread } = useThreads();
  const [isReplying, setIsReplying] = useState(false);

  React.useEffect(() => {
    setIsReplying(false);
  }, [thread?.id]);

  // Show loading state when we have a threadId but no thread data yet
  const showLoading = threadId && !thread && isLoadingThread;

  return (
    <div className="flex h-full flex-col">
      {/* <div className="flex flex-shrink-0 items-center justify-between p-2"> */}
        {/* <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled={!thread}>
            <Archive className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!thread}>
            <ArchiveX className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" disabled={!thread}>
            <Trash2 className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon" disabled={!thread}>
            <Clock className="size-4" />
          </Button>
        </div> */}

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={!thread}>
            <Button variant="ghost" size="icon" className="ml-2">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          {thread && (
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thread Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Mark As Unread</DropdownMenuItem>
              <DropdownMenuItem>Star Thread</DropdownMenuItem>
              <DropdownMenuItem>Add Label</DropdownMenuItem>
              <DropdownMenuItem>Mute Thread</DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu> */}
      {/* </div> */}
      {/* <Separator className="flex-shrink-0" /> */}

      {showLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Loading thread...</p>
            <p className="text-xs text-muted-foreground">
              Fetching messages from search result
            </p>
          </div>
        </div>
      ) : thread ? (
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <div className="flex flex-shrink-0 items-center overflow-hidden p-4">
            <div className="flex flex-1 items-center gap-4 overflow-hidden text-sm">
              <Avatar>
                <AvatarImage alt="avatar" />
                <AvatarFallback>
                  {//@ts-ignore
                  thread.emails[0]?.from?.name
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 gap-1 overflow-hidden">
                <div className="line-clamp-1 font-semibold">
                  {thread.emails[0]?.from?.name}
                </div>
                <div className="line-clamp-1 text-xs">
                  {thread.emails[0]?.subject}
                </div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Reply-To:</span>{" "}
                  {thread.emails[0]?.from?.address}
                </div>
              </div>
            </div>
            {thread.emails[0]?.sentAt && (
              <div className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
                {format(new Date(thread.emails[0].sentAt), "PPpp")}
              </div>
            )}
          </div>
          <Separator className="flex-shrink-0" />

          <div className="flex flex-grow flex-col gap-4 overflow-x-hidden p-6">
            {thread.emails.map((email) => (
              <EmailDisplay key={email.id} email={email} />
            ))}
          </div>

          <Separator className="mt-auto flex-shrink-0" />

          <div className="flex-shrink-0 p-4">
            {isReplying ? (
              <ReplyBox onClose={() => setIsReplying(false)} />
            ) : (
              <div className="flex items-start">
                <Button onClick={() => setIsReplying(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Reply
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  );
};

export default ThreadDisplay;