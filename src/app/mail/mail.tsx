"use client";

import * as React from "react";
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
          onResize={() => setIsCollapsed(false)}
          className={cn(
            "transition-all duration-300 ease-in-out",
            isCollapsed && "min-w-[50px]",
          )}
        >
          <div className="flex h-full flex-1 flex-col">
            {/* Account Switcher */}
            <div
              className={cn(
                "flex h-[52px] items-center justify-center",
                !isCollapsed && "px-2",
              )}
            >
              <AccountSwitcher isCollapsed={isCollapsed} />
            </div>
            <Separator />
            {/* Sidebar Navigation */}
            <SideBar isCollapsed={isCollapsed} />
            <div className="flex-1" />
            {/* Ask AI Section */}
            <div className="px-4 py-2">Ask AI</div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle Panel: Mail List and Tabs */}
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="inbox" className="h-full w-full">
            {/* Inbox Header and Tabs */}
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

            {/* Search Bar */}
            <div className="px-4 py-2">Search Bar</div>

            {/* Tab Content for Inbox */}
            <TabsContent value="inbox">
              <div className="px-4 py-2">Inbox content</div>
            </TabsContent>

            {/* Tab Content for Done */}
            <TabsContent value="done">
              <div className="px-4 py-2">Done content</div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Thread Display */}
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <div className="px-4 py-2">Thread Display</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
};

export default Mail;