"use client";

import { useState } from "react";
// import type { Metadata } from "next";
import Image from "next/image";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const upkeepInputs = [
  {
    id: "wood",
    label: "Wood",
    src: "/items/tiny/wood.webp",
    outputSrc: "/items/full/wood.webp",
    alt: "Wood icon",
  },
  {
    id: "stone",
    label: "Stone",
    src: "/items/tiny/stones.webp",
    outputSrc: "/items/full/stones.webp",
    alt: "Stone icon",
  },
  {
    id: "metalFragments",
    label: "Metal Fragments",
    src: "/items/tiny/metal.fragments.webp",
    outputSrc: "/items/full/metal.fragments.webp",
    alt: "Metal Fragments icon",
  },
  {
    id: "highQualityMetal",
    label: "High Quality Metal",
    src: "/items/tiny/hq.metal.ore.webp",
    outputSrc: "/items/full/hq.metal.ore.webp",
    alt: "High Quality Metal icon",
  },
];

export default function UpkeepPage() {
  const [wood, setWood] = useState(0);
  const [stone, setStone] = useState(0);
  const [metalFragments, setMetalFragments] = useState(0);
  const [highQualityMetal, setHighQualityMetal] = useState(0);
  const [, copy] = useCopyToClipboard();

  const itemNameMap = {
    wood: "wood",
    stone: "stones",
    metalFragments: "metal.fragments",
    highQualityMetal: "metal.refined",
  };

  const calculateOutputs = () => {
    const stackSize = [1000, 1000, 1000, 100];
    const upkeep = [wood, stone, metalFragments, highQualityMetal];
    const TOTAL_STACKS = 24;

    const guaranteed = upkeep.filter((x) => x > 0).length;

    let totalRequired = 0;
    for (let i = 0; i < 4; i++) {
      if (upkeep[i] > 0) totalRequired += upkeep[i] / stackSize[i];
    }

    const remaining = TOTAL_STACKS - guaranteed;
    const stacks = [];

    for (let i = 0; i < 4; i++) {
      if (upkeep[i] === 0) {
        stacks[i] = 0;
      } else {
        const weight = upkeep[i] / stackSize[i] / totalRequired;
        stacks[i] = 1 + Math.round(remaining * weight);
      }
    }

    return stacks.map((s, i) => s * stackSize[i]);
  };

  const calculateUpkeepTime = () => {
    const stackSizes = [1000, 1000, 1000, 100];
    const upkeep24h = [wood, stone, metalFragments, highQualityMetal];
    const totalStacks = 24;

    const guaranteed = upkeep24h.filter((x) => x > 0).length;

    const totalRequired = upkeep24h.reduce((sum, upkeep, i) => {
      return upkeep > 0 ? sum + upkeep / stackSizes[i] : sum;
    }, 0);

    const remaining = totalStacks - guaranteed;

    const stacks = upkeep24h.map((upkeep, i) => {
      if (upkeep === 0) return 0;

      const weight = upkeep / stackSizes[i] / totalRequired;
      return 1 + Math.round(remaining * weight);
    });

    const resources = stacks.map((count, i) => count * stackSizes[i]);

    const days = resources.map((amount, i) =>
      upkeep24h[i] > 0 ? amount / upkeep24h[i] : 0,
    );

    const minDays = Math.min(...days.filter((d) => d > 0));

    const totalSeconds = Math.floor(minDays * 86400);

    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    return `${d} days, ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const generateFilterJson = () => {
    const resources = outputs;
    const itemNames = [
      itemNameMap.wood,
      itemNameMap.stone,
      itemNameMap.metalFragments,
      itemNameMap.highQualityMetal,
    ];

    return JSON.stringify(
      resources
        .map((amount, i) => ({
          TargetCategory: null,
          MaxAmountInOutput: Math.round(amount),
          BufferAmount: 0,
          MinAmountInInput: 0,
          IsBlueprint: false,
          TargetItemName: itemNames[i],
        }))
        .filter((item) => item.MaxAmountInOutput > 0),
      null,
      2,
    );
  };

  const handleCopyJson = async () => {
    const json = generateFilterJson();
    await copy(json);
  };

  const outputs = calculateOutputs();
  const upkeepTime = calculateUpkeepTime();
  const hasValidOutputs = outputs.some(
    (output) => output > 0 && !isNaN(output),
  );
  const inputValues = [
    { value: wood, setter: setWood },
    { value: stone, setter: setStone },
    { value: metalFragments, setter: setMetalFragments },
    { value: highQualityMetal, setter: setHighQualityMetal },
  ];
  return (
    <div className='mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6'>
      <div className='space-y-3'>
        <h1 className='text-3xl font-semibold tracking-tight'>Upkeep</h1>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Enter your current resource amounts to calculate the best tool
          cupboard auto upkeep filter.
        </p>
      </div>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {upkeepInputs.map((input, idx) => (
          <div key={input.id} className='grid gap-2'>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <Image
                src={input.src}
                alt={input.alt}
                width={20}
                height={20}
                className='rounded-sm'
              />
              <Label htmlFor={input.id} className='m-0'>
                {input.label}
              </Label>
            </div>
            <div className='relative'>
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground'>
                <Image
                  src={input.src}
                  alt={input.alt}
                  width={16}
                  height={16}
                  className='opacity-70'
                />
              </div>
              <Input
                id={input.id}
                name={input.id}
                type='number'
                min={0}
                placeholder='0'
                value={inputValues[idx].value}
                onChange={(e) =>
                  inputValues[idx].setter(Number(e.target.value))
                }
                className='pl-10'
              />
            </div>
          </div>
        ))}
      </div>

      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold tracking-tight'>Outputs</h2>
        <p className='max-w-2xl text-sm text-muted-foreground'>
          Projected upkeep values for each resource based on your input.
        </p>
      </div>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {upkeepInputs.map((input, idx) => (
          <div
            key={`output-${input.id}`}
            className='rounded-3xl border border-border/70 bg-background/80 p-5 text-center shadow-sm'
          >
            <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-border/50 bg-muted/70'>
              <Image
                src={input.outputSrc}
                alt={input.alt}
                width={56}
                height={56}
                className='object-contain'
              />
            </div>
            <p className='text-sm font-medium text-muted-foreground'>
              {input.label}
            </p>
            <p className='mt-3 text-3xl font-semibold'>
              {Math.round(outputs[idx]).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className='mt-8 rounded-3xl border border-border/70 bg-gradient-to-br from-background to-muted/30 p-8 text-center shadow-sm'>
        {hasValidOutputs ? (
          <>
            <p className='text-sm font-medium text-muted-foreground'>
              Upkeep Duration
            </p>
            <p className='mt-4 text-4xl font-semibold tracking-tight'>
              {upkeepTime}
            </p>
            <p className='mt-2 text-xs text-muted-foreground'>
              Before your tool cupboard runs out of resources
            </p>
            <Button onClick={handleCopyJson} className='mt-6' variant='default'>
              Copy Filter JSON
            </Button>
          </>
        ) : (
          <p className='text-lg font-medium text-muted-foreground'>
            Input your tool cupboard upkeep
          </p>
        )}
      </div>
    </div>
  );
}
