"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  hideBoostPrompt,
  showBoostPrompt,
} from "@/components/features/boost/boost-prompt";
import { DonateBannerDialog } from "@/components/features/donation/donate-banner-dialog";
import { DonateUpgradeModal } from "@/components/features/donation/donate-upgrade-modal";
import { AdblockModal } from "@/components/nitro/adblock-modal";

import { setSurfaceForced } from "./forced-surface-store";

const ENTRIES = [
  { key: "off", label: "Off (arbiter decides)" },
  { key: "adblock", label: "Adblock appeal" },
  { key: "modal", label: "Upgrade modal" },
  { key: "boost-linked", label: "Boost prompt, linked" },
  { key: "boost-unlinked", label: "Boost prompt, unlinked" },
  { key: "banner", label: "Donate banner" },
] as const;

type EntryKey = (typeof ENTRIES)[number]["key"];

const PARAM = "surface";

const noop = () => {};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable]") !== null
  );
}

function writeParam(key: EntryKey) {
  const url = new URL(window.location.href);
  if (key === "off") url.searchParams.delete(PARAM);
  else url.searchParams.set(PARAM, key);
  window.history.replaceState(window.history.state, "", url);
}

export function SurfaceToolbar() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  // A swapped-out boost toast still fires onDismiss on its way out, and that
  // mustn't close whatever replaced it.
  const presentation = useRef(0);

  const { openUserProfile } = useClerk();
  const { isSignedIn } = useUser();
  // Read through a ref so present stays stable, or the mount effect re-shows
  // the prompt once Clerk finishes loading.
  const clerk = useRef({ openUserProfile, isSignedIn });
  clerk.current = { openUserProfile, isSignedIn };

  const present = useCallback((next: number) => {
    const { key } = ENTRIES[next];
    const token = ++presentation.current;
    const close = () => {
      if (presentation.current === token) setShown(false);
    };

    if (key === "boost-linked" || key === "boost-unlinked") {
      showBoostPrompt({
        variant: key === "boost-linked" ? "linked" : "unlinked",
        onCta: () => {
          if (key === "boost-unlinked" && clerk.current.isSignedIn) {
            clerk.current.openUserProfile();
          }
          close();
        },
        onDismiss: close,
      });
    } else {
      hideBoostPrompt();
    }

    setSurfaceForced(key !== "off");
    setIndex(next);
    setShown(key !== "off");
  }, []);

  const select = useCallback(
    (next: number) => {
      const wrapped = (next + ENTRIES.length) % ENTRIES.length;
      writeParam(ENTRIES[wrapped].key);
      present(wrapped);
    },
    [present],
  );

  // Read after mount, since the server render has no query string to match.
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get(PARAM);
    const initial = ENTRIES.findIndex((entry) => entry.key === key);
    if (initial > 0) present(initial);
  }, [present]);

  useEffect(() => () => setSurfaceForced(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowLeft") select(index - 1);
      else if (event.key === "ArrowRight") select(index + 1);
    };
    // Open dialogs stop arrow keys before they bubble to window.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [index, select]);

  const { key, label } = ENTRIES[index];
  const replayable = key !== "off" && !shown;
  const close = () => setShown(false);
  const closeOnDialogClose = (open: boolean) => {
    if (!open) setShown(false);
  };

  return (
    <>
      {shown && key === "adblock" && (
        <AdblockModal
          open
          onOpenChange={closeOnDialogClose}
          onShown={noop}
          onSubscribe={close}
          onDismiss={close}
        />
      )}
      {shown && key === "modal" && (
        <DonateUpgradeModal
          open
          onOpenChange={closeOnDialogClose}
          onShown={noop}
          onDismiss={close}
        />
      )}
      {shown && key === "banner" && (
        <DonateBannerDialog open onShown={noop} onDismiss={close} />
      )}

      <div
        role='toolbar'
        aria-label='Force a prompt'
        className='fixed top-3 left-1/2 z-100 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-neutral-950/90 p-1 font-mono text-xs text-white shadow-lg ring-1 ring-black/40 backdrop-blur'
      >
        <button
          type='button'
          aria-label='Previous prompt'
          onClick={() => select(index - 1)}
          className='grid size-7 place-items-center rounded-full hover:bg-white/15'
        >
          <ChevronLeftIcon className='size-4' />
        </button>
        <button
          type='button'
          onClick={() => replayable && present(index)}
          disabled={!replayable}
          title={replayable ? "Show it again" : undefined}
          className={cn(
            "flex min-w-52 items-center justify-center gap-1.5 rounded-full px-2 py-1 tabular-nums",
            replayable && "text-white/60 hover:bg-white/15 hover:text-white",
          )}
        >
          <span className='text-white/50'>
            {index}/{ENTRIES.length - 1}
          </span>
          <span>{label}</span>
          {replayable && <RotateCcwIcon className='size-3' />}
        </button>
        <button
          type='button'
          aria-label='Next prompt'
          onClick={() => select(index + 1)}
          className='grid size-7 place-items-center rounded-full hover:bg-white/15'
        >
          <ChevronRightIcon className='size-4' />
        </button>
      </div>
    </>
  );
}
