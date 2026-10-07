import { useState } from "react";
import { Menu } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TrackNav } from "./TrackNav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" closeLabel="Close menu" className="flex flex-col p-0">
        <div className="border-b px-4 py-4">
          {/* The logo is the visible title; its alt text ("Oyelearn") names the dialog. */}
          <SheetTitle>
            <Logo theme="auto" size={24} clearSpace={false} />
          </SheetTitle>
          <SheetDescription className="sr-only">Navigate between the dashboard and the four learning trails.</SheetDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {/* Its own marker group: the desktop sidebar can be mounted at the same time. */}
          <TrackNav group="mobile-nav" onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
