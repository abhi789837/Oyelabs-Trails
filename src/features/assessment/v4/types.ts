import type { ItemResponseV4, SheetItem } from "@shared/assessmentV4";

/** What the sheet hands every item component. */
export interface ItemComponentProps<T extends SheetItem> {
  assessmentId: string;
  item: T;
  /** The learner's current answer (saved or still pending). */
  response: ItemResponseV4 | null;
  /** A new answer: shown at once, autosaved after a pause. */
  onResponse: (response: ItemResponseV4 | null) => void;
  /** Save now (editor blur). */
  onFlush: () => void;
  /** The server changed the item (a run was counted, the third run submitted it). */
  onItemUpdate: (patch: Partial<SheetItem>) => void;
  /** A 409: the sheet should resync. */
  onConflict: (message: string) => void;
}
