"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  desktopClassName = "sm:max-w-xl p-6 gap-4",
  mobileClassName = "rounded-t-2xl p-0 gap-0",
  desktopBodyClassName = "space-y-6",
  mobileBodyClassName = "pb-6 pt-4",
  mobileContentSide = "bottom",
  desktopTitleClassName = "text-lg",
  mobileTitleClassName = "text-lg",
  showDescription = true,
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={desktopClassName}>
          <div className={desktopBodyClassName}>
            <DialogHeader>
              <DialogTitle className={desktopTitleClassName}>{title}</DialogTitle>
              {showDescription && description ? (
                <DialogDescription>{description}</DialogDescription>
              ) : null}
            </DialogHeader>
            {children}
            {footer}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={mobileContentSide} className={mobileClassName}>
        <div className={mobileBodyClassName}>
          <SheetHeader className="pb-4">
            <SheetTitle className={mobileTitleClassName}>{title}</SheetTitle>
            {showDescription && description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
          <div className="px-4">
            {children}
          </div>
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  );
}
