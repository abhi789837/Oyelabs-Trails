import { useState } from "react";
import { Menu } from "lucide-react";

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
      <SheetContent side="left" className="flex flex-col p-0">
        <div className="border-b px-4 py-4">
          <SheetTitle>Oyelabs Trails</SheetTitle>
          <SheetDescription className="sr-only">Navigate between the dashboard and the four learning trails.</SheetDescription>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <TrackNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
