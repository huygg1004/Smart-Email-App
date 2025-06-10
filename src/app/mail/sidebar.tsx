"use client";
import React from "react";
import { useLocalStorage } from "usehooks-ts";
import { Nav } from "./nav";
import { File, Inbox, Send } from "lucide-react";
import { api } from "@/trpc/react";

type Props = { isCollapsed: boolean };
const Sidebar = ({ isCollapsed }: Props) => {
  const [tab] = useLocalStorage("normalhuman-tab", "inbox");
  const { data: accountId } = api.account.getAccountIdByUser.useQuery();

  const { data: inboxThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId!, tab: "inbox" },
    { enabled: !!accountId },
  );

  const { data: draftsThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId!, tab: "draft" },
    { enabled: !!accountId },
  );

  const { data: sentThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId!, tab: "sent" },
    { enabled: !!accountId },
  );

  return (
    <>
      <Nav
        isCollapsed={isCollapsed}
        links={[
          {
            title: "Inbox",
            label: inboxThreads?.toString() || "0",
            icon: Inbox,
            variant: tab === "inbox" ? "default" : "ghost",
          },
          {
            title: "Drafts",
            label: draftsThreads?.toString() || "0",
            icon: File,
            variant: tab === "draft" ? "default" : "ghost",
          },
          {
            title: "Sent",
            label: sentThreads?.toString() || "0",
            icon: Send,
            variant: tab === "sent" ? "default" : "ghost",
          },
        ]}
      />
    </>
  );
};

export default Sidebar;
