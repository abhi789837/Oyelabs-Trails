import { useEffect } from "react";

import { markPageTitled, pageTitle } from "@/lib/pageTitle";

/** Sets "<Page> · Oyelearn" (or "Oyelearn") for the page that calls it. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = pageTitle(title);
    markPageTitled();
  }, [title]);
}
