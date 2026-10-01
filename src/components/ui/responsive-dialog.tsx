"use client";

import * as React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/**
 * One dialog that reads as native on both: a centred modal on desktop, a bottom sheet you can
 * drag down to dismiss on phones. Same composition as `Dialog`, so swapping an existing dialog
 * over is a rename — the only rule is that a Title is still required for accessibility.
 */
const MobileContext = React.createContext(false);
const useMobileDialog = () => React.useContext(MobileContext);

function ResponsiveDialog({ children, ...props }: React.ComponentProps<typeof Dialog>) {
  const isMobile = useIsMobile();
  const Root = isMobile ? Drawer : Dialog;
  return (
    <MobileContext.Provider value={isMobile}>
      <Root {...props}>{children}</Root>
    </MobileContext.Provider>
  );
}

function ResponsiveDialogTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  const Trigger = useMobileDialog() ? DrawerTrigger : DialogTrigger;
  return <Trigger {...props} />;
}

function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  const Close = useMobileDialog() ? DrawerClose : DialogClose;
  return <Close {...props} />;
}

function ResponsiveDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  if (useMobileDialog()) {
    // The sheet owns the bottom inset so its content clears the home indicator.
    return (
      <DrawerContent className={cn("max-h-[85svh] pb-safe", className)} {...props}>
        <div className="overflow-y-auto overscroll-contain px-margin-mobile pb-space-md">{children}</div>
      </DrawerContent>
    );
  }
  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  );
}

function ResponsiveDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  const Header = useMobileDialog() ? DrawerHeader : DialogHeader;
  return <Header className={cn(useMobileDialog() && "px-0 text-start", className)} {...props} />;
}

function ResponsiveDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  const Footer = useMobileDialog() ? DrawerFooter : DialogFooter;
  return <Footer className={cn(useMobileDialog() && "px-0", className)} {...props} />;
}

function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const Title = useMobileDialog() ? DrawerTitle : DialogTitle;
  return <Title {...props} />;
}

function ResponsiveDialogDescription(props: React.ComponentProps<typeof DialogDescription>) {
  const Description = useMobileDialog() ? DrawerDescription : DialogDescription;
  return <Description {...props} />;
}

export {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
};
