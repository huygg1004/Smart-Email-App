"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function PrivacyModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="border-gray-300 px-6 py-3 text-base font-semibold hover:bg-gray-100"
        onClick={() => setIsOpen(true)}
      >
        Privacy Policy
      </Button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold">
                Privacy Policy
              </Dialog.Title>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <Dialog.Description className="space-y-4 text-sm text-gray-700">
              <p><strong>Effective Date:</strong> June 13 2025</p>
              <p>
                We value your privacy. Smart Inbox only collects minimal user data
                necessary to deliver core functionality, such as:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email address and Google profile via OAuth login</li>
                <li>Metadata (subject, sender) from your inbox if granted</li>
                <li>Non-identifiable usage patterns for improving the experience</li>
              </ul>
              <p>
                We do <strong>not</strong> sell or share your personal data with third
                parties. You can revoke permissions anytime through your Google
                account.
              </p>
              <p>
                If you have any concerns or want your data removed, email us at{" "}
                <a href="mailto:youremail@example.com" className="underline text-blue-600">
                  quietjourney8888@gmail.com
                </a>.
              </p>
              <p>
                By using Smart Inbox, you consent to this policy. This document may
                be updated; changes will appear here.
              </p>
            </Dialog.Description>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
