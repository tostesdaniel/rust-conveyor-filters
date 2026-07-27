declare module "tesseract.js" {
  export function createWorker(options?: unknown): Promise<{
    load: () => Promise<void>;
    loadLanguage: (lang: string) => Promise<void>;
    initialize: (lang: string) => Promise<void>;
    recognize: (image: HTMLCanvasElement | ImageBitmap) => Promise<{ data: { text: string } }>;
    terminate: () => Promise<void>;
  }>;
}
