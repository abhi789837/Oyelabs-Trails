/**
 * One hop between the shells and the account menu's body. A dynamic import in an eager file
 * carries the list of every chunk the target needs (Vite's preload map, about 1 KB of file
 * names for the Radix menu). Importing this tiny module instead keeps that list out of the
 * learner routes' first download; the list lives here, fetched only when the menu loads.
 */
export const loadUserMenuImpl = () => import("./UserMenuImpl");
