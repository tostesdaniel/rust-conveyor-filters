"use client";

import { useEffect, useState } from "react";

import { AnimatedNumber } from "../animated-number";

export function StatValueClient({ statValue }: { statValue: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(statValue);
  }, [statValue]);

  return (
    <AnimatedNumber
      springOptions={{
        bounce: 0,
        duration: 3000,
      }}
      value={value}
    />
  );
}
