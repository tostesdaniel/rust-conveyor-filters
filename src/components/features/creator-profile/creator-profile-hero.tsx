import Image from "next/image";
import type { CreatorPublicHierarchy } from "@/data/creator-public";

import type { BadgeType } from "@/types/badges";
import { cn } from "@/lib/utils";
import {
  summarizeCreatorLibrary,
  type CreatorLibrarySummary,
} from "@/components/features/creator-profile/creator-library-summary";
import { Typography } from "@/components/shared/typography";
import { UserBadge } from "@/components/shared/user-badge";

type CreatorProfileHeroProps = {
  displayName: string | null;
  username: string;
  imageUrl: string;
  joinLabel: string;
  badges: BadgeType[];
  hierarchy: CreatorPublicHierarchy;
  publicFilterCount: number;
  bookmarkCount: number;
  totalExports: number;
  totalViews: number;
};

const nf = new Intl.NumberFormat("en-US");

export const LANDING_GRADIENT_FRAME =
  "bg-linear-to-r from-[#4361ee]/15 to-[#4cc9f0]/15";
export const LANDING_GRADIENT_FRAME_DARK =
  "dark:from-[#4361ee]/20 dark:to-[#4cc9f0]/15";
export const LANDING_GLOW_SHADOW =
  "shadow-[0_20px_48px_-28px_rgba(67,97,238,0.1)]";
export const LANDING_GLOW_SHADOW_DARK =
  "dark:shadow-[0_24px_56px_-28px_rgba(76,201,240,0.08)]";

function librarySynopsisLine(
  publicFilterCount: number,
  summary: CreatorLibrarySummary,
): string | null {
  if (publicFilterCount === 0) {
    return null;
  }

  const { uncategorizedCount, categoryCountWithFilters } = summary;

  const allUncategorized =
    categoryCountWithFilters === 0 && uncategorizedCount > 0;

  const allCategorized =
    uncategorizedCount === 0 && categoryCountWithFilters > 0;

  if (allUncategorized) {
    return "Everything lives in the uncategorized lane for now.";
  }

  if (allCategorized) {
    const n = categoryCountWithFilters;
    return n === 1
      ? "Organized under a single public category."
      : `Spans ${nf.format(n)} public categories.`;
  }

  return `${nf.format(categoryCountWithFilters)} categories and ${nf.format(uncategorizedCount)} uncategorized.`;
}

type MetricTileProps = {
  label: string;
  value: number;
};

function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className='flex min-w-26 flex-col gap-1'>
      <span className='text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase'>
        {label}
      </span>
      <span className='text-base leading-none font-semibold text-foreground tabular-nums sm:text-lg'>
        {nf.format(value)}
      </span>
    </div>
  );
}

type CategoryChipLinkProps = {
  href: string;
  label: string;
  count: number;
};

function CategoryChipLink({ href, label, count }: CategoryChipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm",
        "transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
      )}
    >
      <span className='truncate'>{label}</span>
      <span className='shrink-0 text-muted-foreground tabular-nums'>
        ({nf.format(count)})
      </span>
    </a>
  );
}

export function CreatorProfileHero({
  displayName,
  username,
  imageUrl,
  joinLabel,
  badges,
  hierarchy,
  publicFilterCount,
  bookmarkCount,
  totalExports,
  totalViews,
}: CreatorProfileHeroProps) {
  const title = displayName ?? username;
  const avatarAlt =
    displayName !== null ? `${displayName} (@${username})` : `@${username}`;

  const summary = summarizeCreatorLibrary(hierarchy);
  const synopsisExtra = librarySynopsisLine(publicFilterCount, summary);
  const hasFilters = publicFilterCount > 0;

  return (
    <div
      className={cn(
        "rounded-2xl p-px",
        LANDING_GRADIENT_FRAME,
        LANDING_GRADIENT_FRAME_DARK,
        LANDING_GLOW_SHADOW,
        LANDING_GLOW_SHADOW_DARK,
      )}
    >
      <section
        className={cn(
          "relative overflow-hidden rounded-[calc(1rem-1px)] border border-border/80",
          "bg-card shadow-sm dark:bg-card/90",
        )}
      >
        <div className='relative p-6 sm:p-8'>
          <div className='flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12'>
            <div className='flex shrink-0 justify-center lg:justify-start'>
              <div
                className={cn(
                  "rounded-full p-px",
                  "bg-linear-to-r from-[#4361ee] to-[#4cc9f0]",
                  "shadow-[0_12px_32px_-14px_rgba(67,97,238,0.22)]",
                )}
              >
                <Image
                  src={imageUrl}
                  alt={avatarAlt}
                  width={112}
                  height={112}
                  className='size-27 rounded-full border border-border/80 bg-muted object-cover ring-2 ring-background/90 sm:size-28 lg:size-31'
                />
              </div>
            </div>

            <div className='min-w-0 flex-1 space-y-5'>
              <div className='space-y-3 text-center lg:text-left'>
                <Typography variant='h1' className='text-3xl wrap-break-word'>
                  {title}
                </Typography>
                <div className='flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-1 lg:justify-start'>
                  <span className='text-foreground/90'>@{username}</span>
                  <span className='hidden text-muted-foreground/40 sm:inline'>
                    ·
                  </span>
                  <span>Joined {joinLabel}</span>
                </div>

                {badges.length > 0 ? (
                  <div className='flex flex-wrap justify-center gap-2 lg:justify-start'>
                    {badges.map((badge) => (
                      <UserBadge key={badge} type={badge} />
                    ))}
                  </div>
                ) : null}
              </div>

              {hasFilters ? (
                <div className='rounded-xl border border-border/80 bg-muted/35 px-4 py-4 sm:px-5 dark:bg-muted/20'>
                  <p className='text-[0.8125rem] leading-relaxed text-muted-foreground'>
                    <span className='font-semibold text-foreground tabular-nums'>
                      {nf.format(publicFilterCount)}
                    </span>{" "}
                    public filter{publicFilterCount === 1 ? "" : "s"}
                    {synopsisExtra ? (
                      <>
                        {" "}
                        <span aria-hidden className='text-muted-foreground/50'>
                          ·
                        </span>{" "}
                        {synopsisExtra}
                      </>
                    ) : null}
                  </p>

                  {summary.uncategorizedCount > 0 ||
                  summary.categoryBuckets.length > 0 ? (
                    <div className='mt-3 flex flex-wrap justify-center gap-2 sm:justify-start'>
                      {summary.uncategorizedCount > 0 ? (
                        <CategoryChipLink
                          href='#filters-uncategorized'
                          label='Uncategorized'
                          count={summary.uncategorizedCount}
                        />
                      ) : null}
                      {summary.categoryBuckets.map((bucket) => (
                        <CategoryChipLink
                          key={bucket.id}
                          href={`#filters-category-${bucket.id}`}
                          label={bucket.name}
                          count={bucket.count}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {hasFilters ? (
          <div className='relative flex flex-col gap-3 border-t border-border bg-muted/25 px-6 py-5 dark:bg-muted/10'>
            <p className='text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase'>
              Reach
            </p>
            <div className='flex flex-wrap gap-x-6 gap-y-4'>
              <MetricTile label='Views' value={totalViews} />
              <MetricTile label='Exports' value={totalExports} />
              <MetricTile label='Bookmarks' value={bookmarkCount} />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
