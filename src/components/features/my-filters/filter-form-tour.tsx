"use client";

import * as React from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { useUser } from "@clerk/nextjs";
import { SplitIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import {
  NextStep,
  NextStepProvider,
  useNextStep,
  type CardComponentProps,
  type Tour,
} from "nextstepjs";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useCatalogue } from "@/hooks/use-catalogue";
import {
  OUTPUT_CONTAINERS,
  type OutputContainer,
  type OutputContainerShortname,
} from "@/lib/output-containers/container-table";
import {
  splitFormRows,
  type FormRow,
} from "@/lib/output-containers/plan-form-rows";
import {
  hasSeenTour,
  maxChanges,
  ovenSampleShortnames,
  withSeenTour,
} from "@/lib/tours";
import { Button } from "@/components/ui/button";
import { ContainerIcon } from "@/components/features/conveyor/output-container-field";
import {
  useOnContainerPick,
  useOutputContainerSplit,
  type PreviewRows,
  type SplitSnapshot,
} from "@/components/features/conveyor/output-container-split";

const CONTAINER_TOUR = "output-containers-v1";
const PERFECT_SMELTING_TOUR = "perfect-smelting-v1";

const CARD = "[data-tour='output-container']";
const ROWS = "[data-tour='conveyor-items']";
const SWITCH = "[data-tour='perfect-smelting']";
const RESPLIT = "[data-tour='resplit']";

const BOX = "box.wooden.large";
const CUPBOARD = "cupboard.tool";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const REFIT_DELAY = 300;
const PERFECT_SMELTING_DELAY = 400;
const FLASH = "color-mix(in oklab, var(--primary) 20%, transparent)";

type Catalogue = ReturnType<typeof useCatalogue>;

/** "picked" is the oven the user picked to start the tour. */
type DemoContainer = OutputContainerShortname | "picked";

interface DemoRow {
  shortname: string;
  name: string;
  max: number;
  slots: number;
}

interface DemoFacts {
  oven: string;
  rows: readonly DemoRow[];
  row: (shortname: string) => DemoRow;
}

interface DemoStep {
  title: string;
  copy: (facts: DemoFacts) => string;
  selector: string;
  demo: {
    container: DemoContainer | null;
    /** Defaults to the shown container. Null leaves every Max at 0. */
    rowsFitTo?: DemoContainer | null;
    perfectSmelting?: boolean;
  };
  icon?: "resplit";
}

const containerOf = (shortname: OutputContainerShortname): OutputContainer =>
  OUTPUT_CONTAINERS[shortname];

const count = (value: number) => value.toLocaleString("en-US");

function slotsOf(shortname: OutputContainerShortname, group?: string) {
  return OUTPUT_CONTAINERS[shortname].slotGroups
    .filter((slotGroup) => !group || slotGroup.id === group)
    .reduce((sum, slotGroup) => sum + slotGroup.slots, 0);
}

function capsOf([first, second]: readonly DemoRow[]) {
  if (!first) return "";
  const rest = second ? ` and ${second.name} at ${count(second.max)}` : "";
  return `${first.name} now caps at ${count(first.max)}${rest}.`;
}

const DEMO_TOURS: Record<string, DemoStep[]> = {
  [CONTAINER_TOUR]: [
    {
      title: "Output container",
      copy: () =>
        "Tick this when your conveyor fills a container through a Storage Adaptor. Watch these sample rows. Yours come back after.",
      selector: CARD,
      demo: { container: null },
    },
    {
      title: "Pick the container",
      copy: () =>
        `Now it's ticked with a Large Wood Box, which has ${slotsOf(BOX)} slots. Each row will get an equal share.`,
      selector: CARD,
      demo: { container: BOX, rowsFitTo: null },
    },
    {
      title: "Rows split the slots",
      copy: ({ row }) =>
        `Each row gets ${row("wood").slots} of the ${slotsOf(BOX)} slots, so Wood caps at ${count(row("wood").max)} and can't crowd out the rest.`,
      selector: ROWS,
      demo: { container: BOX },
    },
    {
      title: "Containers differ",
      copy: () =>
        `Now it's a Tool Cupboard. It holds resources in ${slotsOf(CUPBOARD, "resources")} slots and doesn't accept every item.`,
      selector: CARD,
      demo: { container: CUPBOARD, rowsFitTo: BOX },
    },
    {
      title: "Some items don't fit",
      copy: ({ row }) =>
        `Wood, Stones and Metal Fragments split ${slotsOf(CUPBOARD, "resources")} slots, so each caps at ${count(row("wood").max)}. Hover Sulfur's badge to see why.`,
      selector: ROWS,
      demo: { container: CUPBOARD },
    },
    {
      title: "Re-split",
      copy: () =>
        "After you add or change rows, press Re-split to share the slots again. Rows you set by hand keep their Max.",
      selector: RESPLIT,
      demo: { container: CUPBOARD },
      icon: "resplit",
    },
  ],
  [PERFECT_SMELTING_TOUR]: [
    {
      title: "Perfect smelting",
      copy: ({ oven }) =>
        `With this on, each Smelt row gets its Keep-lit Max, the least that keeps the ${oven} lit between conveyor runs.`,
      selector: SWITCH,
      demo: { container: "picked", perfectSmelting: true },
    },
    {
      title: "Keep-lit Max",
      copy: ({ rows }) =>
        `${capsOf(rows)} Each badge shows the slot an item goes to.`,
      selector: ROWS,
      demo: { container: "picked", perfectSmelting: true },
    },
    {
      title: "Switched off",
      copy: ({ rows }) =>
        `With it off, Smelt rows split the slots like other rows, so ${rows[0]?.name} rises to ${count(rows[0]?.max ?? 0)}. Your rows come back next.`,
      selector: ROWS,
      demo: { container: "picked", perfectSmelting: false },
    },
  ],
};

const TOURS: Tour[] = Object.entries(DEMO_TOURS).map(([tour, steps]) => ({
  tour,
  steps: steps.map(({ title, selector }) => ({
    title,
    content: null,
    selector,
    side: "bottom",
    scrollOffset: 80,
    disableInteraction: selector !== ROWS,
  })),
}));

const CONTAINER_TOUR_ROWS = ["wood", "stones", "metal.fragments", "sulfur"];

function demoState(
  tour: string,
  step: DemoStep,
  oven: OutputContainerShortname | null,
  catalogue: Catalogue,
) {
  const resolve = (container: DemoContainer | null) =>
    container === "picked" ? oven : container;
  const container = resolve(step.demo.container);
  const fitTo =
    step.demo.rowsFitTo === undefined
      ? container
      : resolve(step.demo.rowsFitTo);

  const shortnames =
    tour === PERFECT_SMELTING_TOUR
      ? oven
        ? ovenSampleShortnames(OUTPUT_CONTAINERS[oven])
        : []
      : CONTAINER_TOUR_ROWS;
  const samples = shortnames.flatMap(
    (shortname) => catalogue.byShortname.get(shortname) ?? [],
  );
  const unfitted: CreateFilterInput["items"] = samples.map((item) => ({
    itemId: item.id,
    name: item.name,
    shortname: item.shortname,
    category: item.category,
    imagePath: item.imagePath,
    iconVersion: item.iconVersion,
    max: 0,
    buffer: 0,
    min: 0,
  }));
  const planned = fitTo
    ? splitFormRows(
        OUTPUT_CONTAINERS[fitTo],
        unfitted as FormRow[],
        catalogue.byId,
        new Map(),
        { perfectSmelting: step.demo.perfectSmelting },
      )
    : { maxes: [], written: new Map<string, number>() };
  const maxes = samples.map((_, index) => planned.maxes[index] ?? 0);

  const rows: PreviewRows = {
    items: unfitted.map((row, index) => ({ ...row, max: maxes[index] })),
    written: planned.written,
  };
  const facts = samples.map((item, index) => ({
    shortname: item.shortname,
    name: item.name,
    max: maxes[index],
    slots: maxes[index] / item.stackSize,
  }));
  return { container, rows, facts };
}

interface TourOven {
  oven: OutputContainerShortname | null;
  setOven: (oven: OutputContainerShortname) => void;
}

const TourOvenContext = React.createContext<TourOven | null>(null);

function useTourOven() {
  const value = React.useContext(TourOvenContext);
  if (!value) {
    throw new Error("Tour hooks must be used within a FilterFormTour");
  }
  return value;
}

export function FilterFormTour({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [oven, setOven] = React.useState<OutputContainerShortname | null>(null);

  const markSeen = (tour: string | null) => {
    if (!user || !tour) return;
    void user
      .update({ unsafeMetadata: withSeenTour(user.unsafeMetadata, tour) })
      .catch((error: unknown) => {
        console.error("Failed to save tour progress:", error);
      });
  };

  return (
    <TourOvenContext value={{ oven, setOven }}>
      <NextStepProvider>
        <NextStep
          steps={TOURS}
          cardComponent={TourCard}
          onComplete={markSeen}
          onSkip={(_, tour) => markSeen(tour)}
          scrollToTop={false}
          shadowOpacity={resolvedTheme === "dark" ? "0.7" : "0.45"}
          arrowStyle={{ color: "var(--popover)" }}
          cardTransition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.4, ease: [0.77, 0, 0.175, 1] }
          }
          disableConsoleLogs
        >
          {children}
          <TourAutoStart />
        </NextStep>
      </NextStepProvider>
    </TourOvenContext>
  );
}

function TourAutoStart() {
  const { isLoaded, user } = useUser();
  const { startNextStep } = useNextStep();
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isLoaded || !user || startedRef.current) return;
    if (hasSeenTour(user.unsafeMetadata, CONTAINER_TOUR)) return;

    // The form mounts hidden behind the loading skeleton, so wait for layout.
    const poll = setInterval(() => {
      const target = document.querySelector(CARD);
      if (!target || target.getClientRects().length === 0) return;
      clearInterval(poll);
      startedRef.current = true;
      startNextStep(CONTAINER_TOUR);
    }, 100);
    return () => clearInterval(poll);
  }, [isLoaded, user, startNextStep]);

  return null;
}

const isOven = (
  shortname: OutputContainerShortname | null | undefined,
): shortname is OutputContainerShortname =>
  !!shortname && !!containerOf(shortname).keepLitMax;

function flashMax(index: number) {
  document
    .querySelector<HTMLInputElement>(`input[name="items.${index}.max"]`)
    ?.animate([{ offset: 0, backgroundColor: FLASH, opacity: 0.4 }], {
      duration: 600,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    });
}

/** Must render inside the filter form to use useFormContext. */
export function FilterFormTourDemo() {
  const { currentTour, currentStep, isNextStepVisible, startNextStep } =
    useNextStep();
  const { control, getValues } = useFormContext<
    CreateFilterInput,
    unknown,
    CreateFilter
  >();
  const split = useOutputContainerSplit();
  const catalogue = useCatalogue();
  const { user } = useUser();
  const { oven, setOven } = useTourOven();
  const container = useWatch({ control, name: "outputContainer" });
  const session = React.useRef<{ saved: SplitSnapshot; shown: string } | null>(
    null,
  );
  const refit = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingStart = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(
    () => () => {
      clearTimeout(refit.current);
      clearTimeout(pendingStart.current);
    },
    [],
  );

  useOnContainerPick((shortname) => {
    clearTimeout(pendingStart.current);
    if (!isOven(shortname)) return;
    if (!user || isNextStepVisible) return;
    if (hasSeenTour(user.unsafeMetadata, PERFECT_SMELTING_TOUR)) return;
    setOven(shortname);
    pendingStart.current = setTimeout(
      () => startNextStep(PERFECT_SMELTING_TOUR),
      PERFECT_SMELTING_DELAY,
    );
  });

  React.useEffect(() => {
    if (!isOven(container)) clearTimeout(pendingStart.current);
  }, [container]);

  React.useEffect(() => {
    const steps = currentTour ? DEMO_TOURS[currentTour] : undefined;
    if (!isNextStepVisible || !currentTour || !steps) {
      clearTimeout(refit.current);
      if (session.current) split.restore(session.current.saved);
      session.current = null;
      return;
    }

    const shown = `${currentTour}:${currentStep}`;
    if (session.current?.shown === shown) return;
    if (!session.current) {
      // Clear the pick's Undo toast, since it would act on the sample rows.
      toast.dismiss();
      session.current = { saved: split.snapshot(), shown };
    }
    session.current.shown = shown;
    clearTimeout(refit.current);

    const step = steps[currentStep];
    const { container, rows } = demoState(currentTour, step, oven, catalogue);
    const changed =
      step.selector === ROWS
        ? maxChanges(getValues("items") as FormRow[], rows.items as FormRow[])
        : null;
    if (!changed?.length) {
      split.preview(container, rows);
      return;
    }
    split.preview(container);
    refit.current = setTimeout(() => {
      split.preview(container, rows);
      changed.forEach(flashMax);
    }, REFIT_DELAY);
  }, [
    isNextStepVisible,
    currentTour,
    currentStep,
    split,
    catalogue,
    getValues,
    oven,
  ]);

  return null;
}

function useCrossfade() {
  const reduce = useReducedMotion();
  const hidden = { opacity: 0, filter: reduce ? "blur(0px)" : "blur(2px)" };
  return {
    initial: hidden,
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { ...hidden, transition: { duration: 0.12, ease: EASE_OUT } },
    transition: { duration: 0.2, ease: EASE_OUT },
  };
}

function StepIcon({ icon }: { icon: "resplit" | OutputContainerShortname }) {
  const catalogue = useCatalogue();
  if (icon === "resplit") return <SplitIcon className='size-4' />;
  const item = catalogue.byShortname.get(icon);
  return item ? <ContainerIcon {...item} /> : null;
}

function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const { currentTour } = useNextStep();
  const { oven } = useTourOven();
  const catalogue = useCatalogue();
  const crossfade = useCrossfade();
  const reduceMotion = useReducedMotion();
  const isLast = currentStep === totalSteps - 1;

  const demoStep = currentTour
    ? DEMO_TOURS[currentTour]?.[currentStep]
    : undefined;
  const state = React.useMemo(
    () =>
      currentTour && demoStep
        ? demoState(currentTour, demoStep, oven, catalogue)
        : null,
    [currentTour, demoStep, oven, catalogue],
  );
  const facts: DemoFacts = {
    oven: (oven && catalogue.byShortname.get(oven)?.name) ?? "oven",
    rows: state?.facts ?? [],
    row: (shortname) =>
      state?.facts.find((row) => row.shortname === shortname) ?? {
        shortname,
        name: shortname,
        max: 0,
        slots: 0,
      },
  };
  const icon = demoStep?.icon ?? state?.container ?? null;
  const stepKey = `${currentTour}:${currentStep}`;

  return (
    <div className='relative flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center'>
          <motion.span
            initial={false}
            animate={{ width: icon ? 20 : 0, marginRight: icon ? 8 : 0 }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }
            }
            className='relative h-5 shrink-0'
          >
            <AnimatePresence initial={false}>
              {icon && (
                <motion.span
                  key={icon}
                  {...crossfade}
                  className='absolute inset-y-0 left-0 grid w-5 place-items-center'
                >
                  <StepIcon icon={icon} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.span>
          <AnimatePresence mode='wait' initial={false}>
            <motion.p key={stepKey} {...crossfade} className='font-medium'>
              {step.title}
            </motion.p>
          </AnimatePresence>
        </div>
        <AnimatePresence mode='wait' initial={false}>
          <motion.p
            key={stepKey}
            {...crossfade}
            className='leading-snug text-muted-foreground'
          >
            {demoStep?.copy(facts)}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-xs text-muted-foreground tabular-nums'>
          {currentStep + 1} of {totalSteps}
        </span>
        <div className='ml-auto flex gap-2'>
          {!isLast && (
            <Button size='sm' variant='ghost' onClick={skipTour}>
              Skip
            </Button>
          )}
          {currentStep > 0 && (
            <Button size='sm' variant='outline' onClick={prevStep}>
              Back
            </Button>
          )}
          <Button size='sm' onClick={nextStep}>
            {isLast ? "Done" : "Next"}
          </Button>
        </div>
      </div>
      {arrow}
    </div>
  );
}
