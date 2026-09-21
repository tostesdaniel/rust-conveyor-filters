// The mobile nav sheet sits at z-99999 to clear the Nitro anchor ad, so a drawer
// opened from inside it has to outrank the sheet or it opens behind the panel.
export const navSheetDrawerLayer = {
  overlayClassName: "z-999999",
  viewportClassName: "z-999999",
} as const;
