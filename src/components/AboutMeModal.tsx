"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function AboutMeModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="border-gray-300 px-6 py-3 text-base font-semibold hover:bg-gray-100"
        onClick={() => setIsOpen(true)}
      >
        About Me
      </Button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold">
                About Me
              </Dialog.Title>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {/* Add your image here */}
            <img
              src="/about-me.png"
              alt="Huy Nhat Doan"
              className="mx-auto mb-4 h-24 w-24 rounded-full object-cover"
            />

            <Dialog.Description className="text-center text-sm text-gray-700">
              Just some random dude in a hoodie with a laptop
            </Dialog.Description>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
