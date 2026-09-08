'use client';

import Link from 'next/link';
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { motion } from 'motion/react';
import type { InboxStatusPreview } from '@/features/unmapped/types';
import { AppIcon } from '@/shared/ui/app-icon';
import { Button } from '@/shared/ui/button';

export function UnmappedInboxDialog({
  count,
  preview,
  onDismiss,
}: {
  count: number;
  preview: InboxStatusPreview[];
  onDismiss: () => void;
}) {
  return (
    <ModalOverlay
      isOpen
      isDismissable
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[var(--ink)]/55 p-0 sm:items-center sm:p-4"
    >
      <Modal className="max-h-[90dvh] w-full overflow-hidden rounded-t-[1.25rem] border border-[var(--line-strong)] bg-[var(--paper)] shadow-[var(--shadow-popover)] sm:max-w-lg sm:rounded-[var(--radius)]">
        <Dialog className="outline-none">
          {({ close }) => (
            <motion.div
              initial={{ y: 24, opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className="flex max-h-[90dvh] flex-col"
            >
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--line-strong)] sm:hidden" />
              <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-5 sm:px-6">
                <div className="flex min-w-0 gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--warning-soft)] text-[var(--warning)]">
                    <AppIcon name="inbox" size={20} />
                  </span>
                  <div>
                    <p className="eyebrow">Decision needed</p>
                    <Heading slot="title" className="wordmark mt-1 text-2xl text-[var(--ink)]">
                      {count} unmapped {count === 1 ? 'resource' : 'resources'}
                    </Heading>
                  </div>
                </div>
                <Button
                  autoFocus
                  variant="ghost"
                  className="size-11 shrink-0 rounded-full p-0"
                  aria-label="Close unmapped resources reminder"
                  onClick={close}
                >
                  <AppIcon name="close" />
                </Button>
              </header>
              <div className="overflow-y-auto px-5 py-4 sm:px-6">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Assign each resource to a project, keep a standalone app as its own project, or
                  archive a team-level charge. Cost history is preserved.
                </p>
                <ul className="mt-4 space-y-2">
                  {preview.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--sunken)] px-3 py-3"
                    >
                      <span
                        className="mt-1 size-2 shrink-0 rounded-full bg-[var(--warning)]"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-semibold text-[var(--ink)]"
                          title={row.displayName}
                        >
                          {row.displayName}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {row.providerKey}
                          {row.suggestion
                            ? ` · Suggested ${row.suggestion.projectName}`
                            : ' · No confident match'}
                        </p>
                      </div>
                    </li>
                  ))}
                  {count > preview.length ? (
                    <li className="px-3 py-2 text-xs font-medium text-[var(--muted)]">
                      +{count - preview.length} more waiting in the inbox
                    </li>
                  ) : null}
                </ul>
              </div>
              <footer className="grid grid-cols-2 gap-2 border-t border-[var(--line)] bg-[var(--sunken)] px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
                <Button variant="ghost" className="w-full" onClick={close}>
                  Later
                </Button>
                <Link
                  href="/unmapped"
                  onClick={onDismiss}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent-hover)] sm:min-h-10"
                >
                  Review inbox <AppIcon name="arrow" size={16} />
                </Link>
              </footer>
            </motion.div>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
