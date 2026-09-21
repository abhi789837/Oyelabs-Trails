import { Link } from "react-router-dom";

import { BrandMark } from "./BrandMark";
import { MobileNav } from "./MobileNav";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4">
        <MobileNav />
        <Link to="/" className="flex items-center gap-2.5 rounded-md py-1 pr-2">
          <BrandMark />
          <span className="font-display text-lg font-semibold tracking-tight">Oyelabs Trails</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
