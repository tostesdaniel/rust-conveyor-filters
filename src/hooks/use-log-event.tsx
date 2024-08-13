import { useEffect } from "react";

import { initGA, logEvent } from "@/lib/analytics";

export const useLogEvent = () => {
  useEffect(() => {
    initGA();
  }, []);

  const logEventWithLimiter = async (
    category: string,
    action: string,
    label?: string,
  ) => {
    const response = await fetch("api/log-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filterId: label, action }),
    });
    const { shouldLog } = await response.json();

    if (shouldLog) {
      logEvent(category, action, label);
    }
  };

  return { logEvent: logEventWithLimiter };
};
