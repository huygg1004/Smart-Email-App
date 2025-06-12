"use client";
import { api } from "@/trpc/react";
import React from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { getAurinkoAuthUrl } from "@/lib/aurinko";

type Props = {
  isCollapsed: boolean;
};

const AccountSwitcher = ({ isCollapsed }: Props) => {
  const { data } = api.account.getAccounts.useQuery();
  const [accountIdStorage, setAccountIdStorage] = useLocalStorage("accountId", "");
  const [accountId, setAccountId] = React.useState(accountIdStorage);

  // Initialize selected account on first load
  React.useEffect(() => {
    if (data?.length && !accountIdStorage) {
      const firstAccount = data[0];
      if (firstAccount) {
        setAccountId(firstAccount.id);
        setAccountIdStorage(firstAccount.id);
      }
    } else if (accountIdStorage) {
      setAccountId(accountIdStorage);
    }
  }, [data, accountIdStorage, setAccountIdStorage]);

  // Don't render if no data
  if (!data || data.length === 0) return null;

  const selectedAccount = data.find((account) => account.id === accountId) ?? data[0];

  return (
    <Select
      value={accountId}
      onValueChange={(value) => {
        setAccountId(value);
        setAccountIdStorage(value);
      }}
    >
      <SelectTrigger
        className={cn(
          "flex w-full flex-1 items-center gap-2 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          <span className={cn({ hidden: !isCollapsed })}>
            {selectedAccount?.emailAddress[0]}
          </span>
          <span className={cn({ hidden: isCollapsed, "ml-2": true })}>
            {selectedAccount?.emailAddress}
          </span>
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {data.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {account.emailAddress}
          </SelectItem>
        ))}
        <div
          onClick={async () => {
            const authUrl = await getAurinkoAuthUrl("Google");
            window.location.href = authUrl;
          }}
          className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none hover:bg-gray-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <Plus className="mr-1 size-4" />
          Add Account
        </div>
      </SelectContent>
    </Select>
  );
};

export default AccountSwitcher;
