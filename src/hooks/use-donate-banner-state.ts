import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface BannerState {
  lastDismissed: number | null;
}

export function useDonateBannerState() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [state, setState] = useLocalStorage<BannerState>(
    "donate-banner-state",
    {
      lastDismissed: null,
    },
    {
      initializeWithValue: false,
    },
  );

  const isVisible =
    !state?.lastDismissed ||
    Date.now() - state.lastDismissed >= BANNER_DISMISS_DURATION;

  useEffect(() => {
    if (isVisible) {
      setDialogOpen(true);
    }
  }, [isVisible]);

  const dismiss = () => {
    setDialogOpen(false);
    setState({ lastDismissed: Date.now() });
  };

  return {
    isVisible,
    dialogOpen,
    setDialogOpen,
    dismiss,
  };
}
