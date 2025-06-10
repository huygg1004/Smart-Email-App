"use client";

import React, { useState } from "react";
import Avatar from "react-avatar";
import { Letter } from "react-letter";
import { api, type RouterOutputs } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import useThreads from "@/hooks/use-threads";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Props = {
  email: RouterOutputs["account"]["getThreads"][0]["emails"][0];
};

const EmailDisplay = ({ email }: Props) => {
  const { account } = useThreads();
  const isMe = account?.emailAddress === email.from.address;
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const openModal = () => {
    setIsOpen(true);
    setTimeout(() => setIsVisible(true), 10); // allow DOM to render before transition
  };

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 300); // match transition duration
  };

  return (
    <>
      {/* Email Card */}
      <div
        className={cn(
          "cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg",
          {
            "border-l-4 border-l-gray-900": isMe,
          },
        )}
        onClick={openModal}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isMe && (
              <Avatar
                name={email.from.name ?? email.from.address}
                email={email.from.address}
                size="40"
                textSizeRatio={2}
                round={true}
              />
            )}
            <div className="text-sm font-semibold text-gray-700">
              {isMe ? "Me" : email.from.name || email.from.address}
              <p className="text-xs text-gray-500">{email.from.address}</p>
            </div>
          </div>
          <p className="text-xs whitespace-nowrap text-gray-400">
            {formatDistanceToNow(email.sentAt ?? new Date(), {
              addSuffix: true,
            })}
          </p>
        </div>

        <div className="mt-4">
          <Letter
            className="prose prose-sm max-w-full text-sm text-gray-800"
            html={email?.body ?? ""}
          />
        </div>
      </div>

      {/* Fullscreen Modal with Smooth Transition and Dimmed Background */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out",
            {
              "bg-[rgba(0,0,0,0.86)] opacity-100": isVisible,
              "bg-[rgba(0,0,0,0)] opacity-0": !isVisible,
            },
          )}
          onClick={closeModal}
        >
          <div
            className={cn(
              "relative max-h-[90vh] w-full max-w-4xl transform overflow-auto rounded-lg bg-white p-6 text-black transition-all duration-300 ease-in-out",
              {
                "translate-y-0 scale-100 opacity-100": isVisible,
                "translate-y-4 scale-95 opacity-0": !isVisible,
              },
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-4 text-xl font-bold text-gray-500 hover:text-red-600"
              onClick={closeModal}
            >
              ×
            </button>
            <Letter
              className="prose max-w-none text-gray-800"
              html={email?.body ?? ""}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EmailDisplay;
