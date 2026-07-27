"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const checkIcons = [
  { name: "wood", label: "Wood", src: "/items/check/wood.png" },
  { name: "stone", label: "Stone", src: "/items/check/stone.png" },
  {
    name: "metalFragments",
    label: "Metal Fragments",
    src: "/items/check/metal_frag.png",
  },
  {
    name: "highQualityMetal",
    label: "High Quality Metal",
    src: "/items/check/hqm.png",
  },
];

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
  type DetectedIcon = {
    name: string;
    label: string;
    x: number;
    y: number;
    score: number;
    amountRegion: { x: number; y: number; w: number; h: number };
  };

  const [wood, setWood] = useState(0);
  const [stone, setStone] = useState(0);
  const [metalFragments, setMetalFragments] = useState(0);
  const [highQualityMetal, setHighQualityMetal] = useState(0);
  const [opencvReady, setOpencvReady] = useState(false);
  const [detectedIcons, setDetectedIcons] = useState<DetectedIcon[]>([]);
  const [_iconDetectMessage, setIconDetectMessage] = useState("");
  const [_ocrMessage, setOcrMessage] = useState("");
  const [, copy] = useCopyToClipboard();
  const isDev = process.env.NODE_ENV === "development";
  const [preflightFailed, setPreflightFailed] = useState(false);
  const [preflightRegion, setPreflightRegion] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const setReady = () => {
      if (cancelled) return;
      setOpencvReady(true);
      setIconDetectMessage("OpenCV ready. Upload source image.");
    };

    const cv = (window as { cv?: { onRuntimeInitialized?: () => void } }).cv;
    if (
      cv?.onRuntimeInitialized === undefined &&
      (window as { cv?: { matchTemplate?: unknown } }).cv?.matchTemplate
    ) {
      setReady();
      return;
    }

    if (cv?.onRuntimeInitialized) {
      const previousInit = cv.onRuntimeInitialized;
      cv.onRuntimeInitialized = () => {
        previousInit();
        setReady();
      };
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector(
      "script[data-opencv-script='true']",
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", setReady, { once: true });
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "/opencv.js";
    script.async = true;
    script.dataset.opencvScript = "true";
    script.onload = () => {
      const loadedCv = (
        window as {
          cv?: { onRuntimeInitialized?: () => void; matchTemplate?: unknown };
        }
      ).cv;
      if (!loadedCv) {
        setIconDetectMessage("Failed to initialize OpenCV.js.");
        return;
      }
      if (loadedCv.matchTemplate) {
        setReady();
      } else {
        const previousInit = loadedCv.onRuntimeInitialized;
        loadedCv.onRuntimeInitialized = () => {
          previousInit?.();
          setReady();
        };
      }
    };
    script.onerror = () => {
      setIconDetectMessage("Failed to load /opencv.js.");
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

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

  const drawFileOnCanvas = (file: File, canvasId: string) =>
    new Promise<void>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.getElementById(
            canvasId,
          ) as HTMLCanvasElement | null;
          if (!canvas) {
            reject(new Error("Canvas not found"));
            return;
          }

          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Unable to get canvas context"));
            return;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.onerror = () => reject(new Error("Invalid image file"));
        img.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const hasCostPer24HoursHeader = async (sourceCanvas: HTMLCanvasElement) => {
    const fullW = sourceCanvas.width;
    const halfStartX = Math.floor(fullW / 2);
    const regionW = Math.max(1, Math.floor((fullW - halfStartX) / 3));
    const centerX = fullW - Math.floor(fullW / 4);
    const regionX = Math.max(0, Math.floor(centerX - regionW / 5));

    const topPart = Math.floor(sourceCanvas.height / 2.5);
    const regionY = Math.floor(topPart / 1.5);
    const regionH = topPart - regionY;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = regionW;
    cropCanvas.height = regionH;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return false;

    cropCtx.drawImage(
      sourceCanvas,
      regionX,
      regionY,
      regionW,
      regionH,
      0,
      0,
      regionW,
      regionH,
    );

    setPreflightRegion({ x: regionX, y: regionY, w: regionW, h: regionH });

    if (isDev) {
      try {
        const outputCanvas = document.getElementById(
          "iconDetectOutput",
        ) as HTMLCanvasElement | null;
        if (outputCanvas) {
          const outCtx = outputCanvas.getContext("2d");
          if (outCtx) {
            outCtx.save();
            outCtx.strokeStyle = "rgba(255,80,80,0.95)";
            outCtx.lineWidth = 2;
            outCtx.strokeRect(regionX + 0.5, regionY + 0.5, regionW, regionH);
            outCtx.restore();
          }
        }
      } catch (e) {
        /* ignore drawing errors */
      }
    }

    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");

    try {
      const { data } = await worker.recognize(cropCanvas);
      const normalized = data.text.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matched =
        normalized.includes("costper24hours") ||
        normalized.includes("costper24hour") ||
        normalized.includes("costper24h");

      console.info("[upkeep][precheck] top-right OCR", {
        rawText: data.text,
        normalized,
        matched,
        region: { x: regionX, y: regionY, w: regionW, h: regionH },
      });

      return matched;
    } finally {
      await worker.terminate();
      console.info("[upkeep][precheck] redraw preflight region after OCR");
      console.log("[upkeep][precheck] preflightRegion", preflightRegion);
      console.log("[upkeep][precheck] isDev", isDev);
      if (isDev && preflightRegion) {
        try {
          const outCanvas = document.getElementById(
            "iconDetectOutput",
          ) as HTMLCanvasElement | null;
          const outCtx = outCanvas?.getContext("2d");
          if (outCtx && preflightRegion) {
            outCtx.save();
            outCtx.strokeStyle = "rgba(255,80,80,0.95)";
            outCtx.lineWidth = 2;
            outCtx.strokeRect(
              preflightRegion.x + 0.5,
              preflightRegion.y + 0.5,
              preflightRegion.w,
              preflightRegion.h,
            );
            outCtx.restore();
          }
        } catch (e) {
          /* ignore */
        }
      }
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.info("[upkeep] upload started", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      setWood(0);
      setStone(0);
      setMetalFragments(0);
      setHighQualityMetal(0);

      await drawFileOnCanvas(file, "imageCanvasInput");
      const sourceCanvas = document.getElementById(
        "imageCanvasInput",
      ) as HTMLCanvasElement | null;
      const outputCanvas = document.getElementById(
        "iconDetectOutput",
      ) as HTMLCanvasElement | null;
      const outputCtx = outputCanvas?.getContext("2d");

      if (!sourceCanvas) {
        setIconDetectMessage("Could not load source canvas.");
        return;
      }

      // verify aspect ratio ~= 16:9 before displaying or running checks
      const ratio = sourceCanvas.width / sourceCanvas.height;
      const target = 16 / 9;
      const tol = 0.03; // allow ~3% tolerance
      if (Math.abs(ratio - target) > tol) {
        console.warn("[upkeep][precheck] aspect ratio mismatch", { ratio });
        setDetectedIcons([]);
        setOcrMessage(
          "Image aspect ratio is not approximately 16:9; please upload a 16:9 screenshot.",
        );
        setIconDetectMessage("Image not 16:9; skipping detection.");
        setPreflightFailed(true);
        // clear output canvas if available
        if (outputCanvas && outputCtx) {
          outputCanvas.width = sourceCanvas.width;
          outputCanvas.height = sourceCanvas.height;
          outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        }
        return;
      }

      // aspect ratio OK — clear any previous failure and draw
      setPreflightFailed(false);
      setShowCanvas(true);
      if (outputCanvas && outputCtx) {
        outputCanvas.width = sourceCanvas.width;
        outputCanvas.height = sourceCanvas.height;
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        outputCtx.drawImage(sourceCanvas, 0, 0);
      }

      if (!sourceCanvas || !(await hasCostPer24HoursHeader(sourceCanvas))) {
        console.warn("[upkeep][precheck] failed");
        setDetectedIcons([]);
        setOcrMessage("Top-right check failed: 'Cost per 24 hours' not found.");
        setIconDetectMessage(
          "Upload a screenshot that contains 'Cost per 24 hours' in the top-right quadrant.",
        );
        setPreflightFailed(true);
        setShowCanvas(false);
        return;
      }

      console.info("[upkeep][precheck] passed");
      setPreflightFailed(false);

      setDetectedIcons([]);
      setOcrMessage("");
      setIconDetectMessage("Source image loaded. Detecting icons...");

      const matches = await runIconDetection();
      if (matches.length > 0) {
        await runOcr(matches);
      } else {
        setOcrMessage("No matched icons for OCR.");
        setIconDetectMessage(
          "Upload another image — resource icons not detected.",
        );
        setPreflightFailed(true);
        setShowCanvas(false);
      }
    } catch {
      console.error("[upkeep] upload pipeline failed");
      setIconDetectMessage("Could not load image file.");
    }
  };

  const parseOcrAmount = (text: string) => {
    const digitsOnly = text.replace(/[^\d]/g, "");
    if (!digitsOnly) return null;

    const parsed = Number.parseInt(digitsOnly, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const loadImageToCanvas = (src: string): Promise<HTMLCanvasElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) {
          reject(new Error("No context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(c);
      };
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });

  const runIconDetection = async (): Promise<DetectedIcon[]> => {
    if (!opencvReady) {
      setIconDetectMessage("OpenCV is still loading.");
      return [];
    }

    type CvMat = {
      delete: () => void;
      rows: number;
      cols: number;
      empty: () => boolean;
      roi(rect: unknown): CvMat;
    };

    const cv = (window as { cv?: Record<string, unknown> }).cv as {
      Mat: new () => CvMat;
      Point: new (x: number, y: number) => unknown;
      Scalar: new (v0: number, v1: number, v2: number, v3: number) => unknown;
      Rect: new (x: number, y: number, w: number, h: number) => unknown;
      LINE_8: number;
      TM_CCOEFF_NORMED: number;
      imread: (src: string | HTMLCanvasElement) => CvMat;
      matchTemplate: (
        src: unknown,
        templ: unknown,
        dst: unknown,
        method: number,
        mask: unknown,
      ) => void;
      minMaxLoc: (
        src: unknown,
        mask: unknown,
      ) => {
        minLoc: { x: number; y: number };
        maxLoc: { x: number; y: number };
        minVal: number;
        maxVal: number;
      };
      rectangle: (
        img: unknown,
        pt1: unknown,
        pt2: unknown,
        color: unknown,
        thickness: number,
        lineType: number,
        shift: number,
      ) => void;
      imshow: (canvasId: string, img: unknown) => void;
      [key: string]: unknown;
    };

    if (!cv) {
      setIconDetectMessage("OpenCV runtime is unavailable.");
      return [];
    }

    setIconDetectMessage("Detecting icons...");

    let src: CvMat | null = null;
    let searchRegion: CvMat | null = null;
    const matches: DetectedIcon[] = [];

    try {
      src = cv.imread("imageCanvasInput");
      if (src.empty()) {
        setIconDetectMessage("Upload a source image first.");
        return [];
      }

      const roiX = Math.floor(src!.cols / 1.5);
      const roiW = Math.floor(src!.cols - roiX - roiX / 6);
      const topPart = Math.floor(src!.rows / 2.7);
      const roiY = Math.floor(topPart / 1.2);
      const roiH = topPart - roiY;

      searchRegion = src!.roi(new cv.Rect(roiX, roiY, roiW, roiH));

      for (const icon of checkIcons) {
        let templ: CvMat | null = null;
        let dst: CvMat | null = null;
        let mask: CvMat | null = null;

        try {
          const iconCanvas = await loadImageToCanvas(icon.src);
          templ = cv.imread(iconCanvas);
          if (templ!.empty()) continue;
          if (templ!.rows > roiH || templ!.cols > roiW) continue;

          dst = new cv.Mat();
          mask = new cv.Mat();
          cv.matchTemplate(searchRegion, templ, dst, cv.TM_CCOEFF_NORMED, mask);

          const result = cv.minMaxLoc(dst, mask);
          const { maxVal, maxLoc } = result;

          if (maxVal >= 0.7) {
            const fullX = maxLoc.x + roiX;
            const fullY = maxLoc.y + roiY;
            const iconW = templ!.cols;
            const iconH = templ!.rows;

            const amountRegion = {
              x: fullX - Math.floor(iconW * 0.25),
              y: fullY + iconH - Math.floor(iconH * 0.1),
              w: Math.floor(iconW * 1.5),
              h: Math.max(24, Math.floor(iconH * 0.75)),
            };

            matches.push({
              name: icon.name,
              label: icon.label,
              x: fullX,
              y: fullY,
              score: maxVal,
              amountRegion,
            });

            cv.rectangle(
              src,
              new cv.Point(fullX, fullY),
              new cv.Point(fullX + iconW, fullY + iconH),
              new cv.Scalar(0, 200, 100, 255),
              2,
              cv.LINE_8,
              0,
            );

            cv.rectangle(
              src,
              new cv.Point(amountRegion.x, amountRegion.y),
              new cv.Point(
                amountRegion.x + amountRegion.w,
                amountRegion.y + amountRegion.h,
              ),
              new cv.Scalar(0, 220, 255, 255),
              2,
              cv.LINE_8,
              0,
            );
          }
        } finally {
          templ?.delete();
          dst?.delete();
          mask?.delete();
        }
      }

      matches.sort((a, b) => a.x - b.x);
      console.info("[upkeep][detect] matches", {
        count: matches.length,
        matches: matches.map((match) => ({
          name: match.name,
          x: match.x,
          y: match.y,
          score: match.score,
          amountRegion: match.amountRegion,
        })),
      });
      setDetectedIcons(matches);
      cv.imshow("iconDetectOutput", src);
      if (isDev && preflightRegion) {
        try {
          const outCanvas = document.getElementById(
            "iconDetectOutput",
          ) as HTMLCanvasElement | null;
          const outCtx = outCanvas?.getContext("2d");
          if (outCtx && preflightRegion) {
            outCtx.save();
            outCtx.strokeStyle = "rgba(255,80,80,0.95)";
            outCtx.lineWidth = 2;
            outCtx.strokeRect(
              preflightRegion.x + 0.5,
              preflightRegion.y + 0.5,
              preflightRegion.w,
              preflightRegion.h,
            );
            outCtx.restore();
          }
        } catch (e) {
          /* ignore */
        }
      }
      setIconDetectMessage(
        matches.length > 0
          ? `Found ${matches.length} icon(s) above 0.7 threshold, ordered by x.`
          : "No icons matched above the 0.7 threshold.",
      );
      return matches;
    } catch {
      setIconDetectMessage("Icon detection failed.");
      setDetectedIcons([]);
      return [];
    } finally {
      searchRegion?.delete();
      src?.delete();
    }
  };

  const runOcr = async (iconsToRead?: DetectedIcon[]) => {
    const icons = iconsToRead ?? detectedIcons;
    if (icons.length === 0) {
      setOcrMessage("Run icon detection first.");
      return;
    }

    setOcrMessage("Running OCR...");

    const sourceCanvas = document.getElementById(
      "imageCanvasInput",
    ) as HTMLCanvasElement | null;
    if (!sourceCanvas) {
      setOcrMessage("Source canvas not found.");
      return;
    }

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      let appliedCount = 0;

      for (const icon of icons) {
        const { x, y, w, h } = icon.amountRegion;

        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = w;
        cropCanvas.height = h;
        const ctx = cropCanvas.getContext("2d");
        if (!ctx) continue;
        ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);

        const { data } = await worker.recognize(cropCanvas);
        const parsedAmount = parseOcrAmount(data.text.trim());
        console.info("[upkeep][ocr] item", {
          icon: icon.name,
          rawText: data.text,
          parsedAmount,
          region: { x, y, w, h },
        });
        if (parsedAmount === null) continue;

        if (icon.name === "wood") {
          setWood(parsedAmount);
          appliedCount += 1;
          continue;
        }
        if (icon.name === "stone") {
          setStone(parsedAmount);
          appliedCount += 1;
          continue;
        }
        if (icon.name === "metalFragments") {
          setMetalFragments(parsedAmount);
          appliedCount += 1;
          continue;
        }
        if (icon.name === "highQualityMetal") {
          setHighQualityMetal(parsedAmount);
          appliedCount += 1;
        }
      }

      await worker.terminate();
      console.info("[upkeep][ocr] complete", { appliedCount });
      if (appliedCount > 0) {
        setOcrMessage(`OCR complete. Updated ${appliedCount} upkeep input(s).`);
        setPreflightFailed(false);
        setShowCanvas(true);
      } else {
        setOcrMessage("OCR complete, but no numeric amounts were recognized.");
        setIconDetectMessage(
          "Upload another image — top-right header not detected.",
        );
        setPreflightFailed(true);
        setShowCanvas(false);
      }
    } catch {
      console.error("[upkeep][ocr] failed");
      setOcrMessage("OCR failed.");
    }
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
      <div className='grid gap-2'>
        <label
          htmlFor='fileInput'
          className='text-sm font-medium text-muted-foreground'
        >
          Source image
        </label>
        <input
          id='fileInput'
          type='file'
          accept='image/*'
          onChange={handleImageChange}
          className='h-11 w-full cursor-pointer rounded-lg border border-input/80 bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:max-w-md'
        />
        {preflightFailed && (
          <p className='mt-2 text-sm font-medium text-red-500'>
            {_iconDetectMessage ||
              _ocrMessage ||
              "Check failed. Please upload a valid image."}
          </p>
        )}
        <canvas
          id='imageCanvasInput'
          className='mx-auto hidden w-10/12 rounded-md border bg-muted/30'
        />

        <div className='mt-2 grid gap-2'>
          <p className='text-sm font-medium text-muted-foreground'>
            Detection output
          </p>
          <canvas
            id='iconDetectOutput'
            className={`mx-auto w-10/12 rounded-md border bg-muted/30 ${
              showCanvas ? "" : "hidden"
            }`}
            style={
              preflightFailed
                ? {
                    boxShadow:
                      "0 0 12px 3px rgba(255,16,16,0.95), 0 0 28px 8px rgba(255,64,64,0.35)",
                    borderColor: "rgba(255,16,16,0.95)",
                    borderWidth: "2px",
                  }
                : undefined
            }
          />
        </div>
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

      <div className='mt-8 rounded-3xl border border-border/70 bg-linear-to-br from-background to-muted/30 p-8 text-center shadow-sm'>
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
