import { describe, expect, it } from "vitest";

import { pendingUploads, type LocalIcon } from "./bucket";

function icon(key: string, md5: string): LocalIcon {
  return { key, file: key, md5 };
}

describe("pendingUploads", () => {
  const wood = icon("items/full/wood.webp", "0f343b0931126a20f133d67c2b018a3b");

  it("skips an icon the bucket already holds, quoted ETag and all", () => {
    const remote = new Map([[wood.key, `"${wood.md5.toUpperCase()}"`]]);
    expect(pendingUploads([wood], remote)).toEqual([]);
  });

  it("uploads an icon the bucket lacks", () => {
    expect(pendingUploads([wood], new Map())).toEqual([wood]);
  });

  it("uploads a redrawn icon", () => {
    const remote = new Map([[wood.key, '"f89ae38077adae7fdb635957141d7bdc"']]);
    expect(pendingUploads([wood], remote)).toEqual([wood]);
  });

  it("re-uploads over a multipart ETag", () => {
    const remote = new Map([[wood.key, `"${wood.md5}-2"`]]);
    expect(pendingUploads([wood], remote)).toEqual([wood]);
  });
});
