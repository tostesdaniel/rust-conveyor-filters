import type { CSSProperties } from "react";
import { categoryMapping } from "@/utils/category-mapping";

import { cn } from "@/lib/utils";

const categoryIconFiles = {
  Weapons: "weapons",
  Items: "items",
  Ammo: "ammo",
  Traps: "traps",
  Electrical: "electrical",
  Construction: "construction",
  Clothing: "clothing",
  Resources: "resources",
  Components: "components",
  Food: "food",
  Medical: "medical",
  Other: "other",
  Fun: "fun",
  Tools: "tools",
} as const;

type CategoryIconName = keyof typeof categoryIconFiles;

type IconProps = React.HTMLAttributes<HTMLSpanElement>;

function maskStyle(file: string): CSSProperties {
  const image = `url(/categories/${file}.png)`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskOrigin: "content-box",
    WebkitMaskOrigin: "content-box",
    maskClip: "content-box",
    WebkitMaskClip: "content-box",
  };
}

function createCategoryIcon(file: string) {
  const mask = maskStyle(file);
  return function CategoryIcon({ className, style, ...props }: IconProps) {
    return (
      <span
        aria-hidden
        className={cn("block bg-current", className)}
        style={{ ...mask, ...style }}
        {...props}
      />
    );
  };
}

export const CategoryIcons = Object.fromEntries(
  Object.entries(categoryIconFiles).map(([name, file]) => [
    name,
    createCategoryIcon(file),
  ]),
) as Record<CategoryIconName, (props: IconProps) => React.JSX.Element>;

export const getCategoryIcon = (categoryName: string) => {
  const mappedCategory = categoryMapping[categoryName];
  return CategoryIcons[mappedCategory as CategoryIconName] || null;
};
