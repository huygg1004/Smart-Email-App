/* File: src/components/mail.tsx */
"use client";

import * as React from "react";
import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountSwitcher from "./account-switcher";
import SideBar from "./sidebar";
import ThreadList from "./thread-list";
import ThreadDisplay from "./thread-display";
import SearchBar, { isSearchingAtom } from "./search-bar";
import SearchDisplay from "./search-display";
import AIChatbot from "@/app/mail/ask-ai";

type Props = {
  defaultLayout?: number[];
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
};

const Mail = ({
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: Props) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [isSearching] = useAtom(isSearchingAtom);

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes) => console.log(sizes)}
        className="h-full min-h-screen items-stretch"
      >
        {/* Left Panel: Navigation and Account */}
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible
          minSize={15}
          maxSize={40}
          onCollapse={() => setIsCollapsed(true)}
          onExpand={() => setIsCollapsed(false)}
          className={cn(
            "transition-all duration-300 ease-in-out",
            isCollapsed && "min-w-[50px]",
          )}
        >
<div className="flex h-full flex-1 flex-col">
  <div>
    <div
      className={cn(
        "flex h-[52px] items-center justify-center",
        !isCollapsed && "px-2",
      )}
    >
      <AccountSwitcher isCollapsed={isCollapsed} />
    </div>
    <Separator />
    <SideBar isCollapsed={isCollapsed} />
  </div>

  {/* Spacer to push chatbot toward middle */}
  <div className="flex-1 flex items-center justify-center">
    <AIChatbot />
  </div>
</div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle Panel: Mail List / Search Results */}
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <div className="flex h-full flex-col">
            <SearchBar />
            <Separator />
            {/* --- ✅ FIX: Conditionally render SearchDisplay or ThreadList --- */}
            {isSearching ? (
              <SearchDisplay />
            ) : (
              <Tabs
                defaultValue="inbox"
                className="flex h-full w-full flex-col"
              >
                <div className="flex items-center px-4 py-2">
                  <h1 className="text-xl font-bold">Inbox</h1>
                  <TabsList className="ml-auto">
                    <TabsTrigger
                      value="inbox"
                      className="text-zinc-600 dark:text-zinc-200"
                    >
                      Inbox
                    </TabsTrigger>
                    <TabsTrigger
                      value="done"
                      className="text-zinc-600 dark:text-zinc-200"
                    >
                      Done
                    </TabsTrigger>
                  </TabsList>
                </div>
                <Separator />
                <TabsContent
                  value="inbox"
                  className="flex-grow overflow-y-auto"
                >
                  <ThreadList />
                </TabsContent>
                <TabsContent value="done" className="flex-grow overflow-y-auto">
                  <ThreadList />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Thread Display */}
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <ThreadDisplay />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
};

export default Mail;
