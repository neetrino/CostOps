'use client';

import type { ReactNode } from 'react';
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { motion } from 'motion/react';
import { AppIcon } from '@/shared/ui/app-icon';

type MobileSheetProps = {
  title: string;
  description?: string;
  trigger: ReactNode;
  triggerClassName?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
};

export function MobileSheet({
  title,
  description,
  trigger,
  triggerClassName = '',
  children,
}: MobileSheetProps) {
  return (
    <DialogTrigger>
      <AriaButton className={triggerClassName}>{trigger}</AriaButton>
      <ModalOverlay isDismissable className="sheet-overlay">
        <Modal className="sheet-modal">
          <Dialog className="outline-none">
            {({ close }) => (
              <motion.div
                initial={{ y: 28, opacity: 0.86 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--line-strong)]" />
                <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-3">
                  <div className="min-w-0">
                    <Heading slot="title" className="wordmark text-xl text-[var(--ink)]">
                      {title}
                    </Heading>
                    {description ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{description}</p>
                    ) : null}
                  </div>
                  <AriaButton
                    onPress={close}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition-colors hover:bg-[var(--sunken)] hover:text-[var(--ink)]"
                    aria-label={`Close ${title}`}
                  >
                    <AppIcon name="close" />
                  </AriaButton>
                </header>
                <div className="sheet-scroll">
                  {typeof children === 'function' ? children(close) : children}
                </div>
              </motion.div>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
