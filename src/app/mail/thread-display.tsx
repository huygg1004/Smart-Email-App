"use client";
import React from "react";
import useThreads from "@/hooks/use-threads";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveX, Trash2, Clock, MoreVertical } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import EmailDisplay from "./email-display"
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
  const { threadId, threads } = useThreads();
  const thread = threads?.find((t) => t.id === threadId);

  return (
    // Root container of ThreadDisplay. It should take full height and manage its children vertically.
    // Removed overflow-x-hidden from here, as the parent layout should handle it,
    // and this component's focus is on managing its *own* vertical space.
    <div className="flex h-full flex-col">
      {/* Top bar: fixed height, should not grow/shrink */}
      <div className="flex items-center justify-between p-2 flex-shrink-0">
        <div className="flex items-center gap-2">
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
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="ml-2"
              variant="ghost"
              size="icon"
              disabled={!thread}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thread Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Mark As Unread</DropdownMenuItem>
            <DropdownMenuItem>Star Thread</DropdownMenuItem>
            <DropdownMenuItem>Add Label</DropdownMenuItem>
            <DropdownMenuItem>Mute Thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator className="flex-shrink-0" />

      {thread ? (
        // This is the main scrollable content area for the thread details.
        // It should take all remaining vertical space (`flex-1`) and manage its own vertical overflow.
        // It also needs to hide horizontal overflow for robustness.
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* Thread header (sender, subject, etc.): fixed height, should not grow/shrink */}
          <div className="flex items-center p-4 flex-shrink-0 overflow-hidden">
            <div className="flex items-center gap-4 text-sm overflow-hidden flex-1">
              <Avatar>
                <AvatarImage alt="avatar" />
                <AvatarFallback>
                  {thread?.emails[0]?.from?.name
                    ?.split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1 flex-1 overflow-hidden">
                <div className="font-semibold line-clamp-1">
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
              <div className="text-muted-foreground ml-auto text-xs flex-shrink-0">
                {format(new Date(thread.emails[0].sentAt), "PPpp")}
              </div>
            )}
          </div>
          <Separator className="flex-shrink-0" />

          {/* Individual EmailDisplay components: This area should grow to fill space
              and be the primary scrollable area *if* its content overflows its height.
              However, since the parent is already `overflow-y-auto`, this specific div
              should be `flex-grow` but not necessarily `overflow-y-auto` itself,
              unless you want nested scrollbars. I'll make it `flex-grow` and contain horizontal. */}
          <div className="flex flex-col flex-grow p-6 gap-4 overflow-x-hidden">
            {thread.emails.map(email => (
              <EmailDisplay key={email.id} email={email} />
            ))}
          </div>

          <Separator className="mt-auto flex-shrink-0" />

          {/* Reply Box area: fixed height, should not grow/shrink.
              Its internal scrolling is handled by EmailEditor. */}
          <div className="flex-shrink-0 overflow-hidden">
            <ReplyBox/>
          </div>
        </div>
      ) : (
        // When no thread is selected, this div takes full height and centers content.
        <div className="text-muted-foreground p-8 text-center flex-1">
          No message selected
        </div>
      )}
    </div>
  );
};

export default ThreadDisplay;