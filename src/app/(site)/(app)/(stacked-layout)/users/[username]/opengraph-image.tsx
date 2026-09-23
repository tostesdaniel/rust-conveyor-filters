import { ImageResponse } from "next/og";
import {
  getCreatorPublicStats,
  getPublicFilterHierarchyForAuthor,
} from "@/data/creator-public";
import { clerkUserToAuthorDisplay } from "@/utils/enrich-filter";

import { siteConfig } from "@/config/site";
import { findClerkUserByUsername } from "@/lib/public-creator";
import {
  librarySynopsisLine,
  summarizeCreatorLibrary,
} from "@/components/features/creator-profile/creator-library-summary";

export const runtime = "nodejs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const nf = new Intl.NumberFormat("en-US");

const og = {
  canvasGradient:
    "linear-gradient(160deg, #0a0f1a 0%, #111827 42%, #0f1729 55%, #0c1424 100%)",
  frameGlow:
    "linear-gradient(135deg, rgba(67,97,238,0.35) 0%, rgba(76,201,240,0.22) 100%)",
  cardBg: "rgba(15,23,41,0.92)",
  cardBorder: "rgba(148,163,184,0.22)",
  title: "#f4f4f5",
  muted: "#94a3b8",
  mutedStrong: "#cbd5e1",
  subtleBg: "rgba(255,255,255,0.06)",
  subtleBorder: "rgba(148,163,184,0.18)",
  chipBg: "rgba(30,41,59,0.85)",
  chipBorder: "rgba(148,163,184,0.2)",
  chipText: "#e4e4e7",
  chipCount: "#a1a1aa",
  reachBarBg: "rgba(0,0,0,0.28)",
  avatarRing: "#0f1729",
  statValue: "#f4f4f5",
  fallbackInnerBg: "rgba(15,23,41,0.94)",
  fallbackInnerBorder: "rgba(148,163,184,0.25)",
} as const;

function ogFallbackImage(message: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: og.frameGlow,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 48,
            background: og.fallbackInnerBg,
            borderRadius: 24,
            border: `1px solid ${og.fallbackInnerBorder}`,
            maxWidth: 900,
            boxShadow: "0 24px 80px -24px rgba(0,0,0,0.65)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 700,
              color: og.title,
            }}
          >
            {siteConfig.name}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: og.mutedStrong }}>
            {message}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Array<{ id: number; alt: string }>> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const user = await findClerkUserByUsername(decoded);
  if (!user?.username) {
    return [{ id: 0, alt: `${siteConfig.name} — profile not found` }];
  }
  const displayName = clerkUserToAuthorDisplay(user) ?? user.username;
  return [
    {
      id: 0,
      alt: `${displayName} (@${user.username}) — public filters on ${siteConfig.name}`,
    },
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const user = await findClerkUserByUsername(decoded);
  if (!user?.username) {
    return ogFallbackImage("This profile could not be found.");
  }

  const clerkUserId = user.id;
  const [stats, hierarchy] = await Promise.all([
    getCreatorPublicStats(clerkUserId),
    getPublicFilterHierarchyForAuthor(clerkUserId),
  ]);

  const displayName = clerkUserToAuthorDisplay(user) ?? user.username;
  const summary = summarizeCreatorLibrary(hierarchy);
  const synopsis = librarySynopsisLine(stats.publicFilterCount, summary);
  const hasFilters = stats.publicFilterCount > 0;

  const chips: { label: string; count: number }[] = [];
  if (summary.uncategorizedCount > 0) {
    chips.push({ label: "Uncategorized", count: summary.uncategorizedCount });
  }
  for (const bucket of summary.categoryBuckets) {
    if (chips.length >= 6) {
      break;
    }
    chips.push({ label: bucket.name, count: bucket.count });
  }

  const filterLine = hasFilters
    ? `${nf.format(stats.publicFilterCount)} public filter${stats.publicFilterCount === 1 ? "" : "s"}${synopsis ? ` · ${synopsis}` : ""}`
    : "No public filters yet.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 48,
          background: og.canvasGradient,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            borderRadius: 24,
            border: `1px solid ${og.cardBorder}`,
            background: og.cardBg,
            overflow: "hidden",
            boxShadow:
              "0 0 0 1px rgba(67,97,238,0.12), 0 28px 64px -28px rgba(0,0,0,0.75)",
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-start",
              padding: 40,
              gap: 40,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: 3,
                  borderRadius: 9999,
                  background: "linear-gradient(90deg , #4361ee , #4cc9f0)",
                }}
              >
                {/* Satori does not support next/image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.imageUrl}
                  width={140}
                  height={140}
                  alt=''
                  style={{
                    borderRadius: 9999,
                    objectFit: "cover",
                    border: `2px solid ${og.avatarRing}`,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: 20,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 52,
                  fontWeight: 700,
                  color: og.title,
                  lineHeight: 1.1,
                }}
              >
                {displayName}
              </div>
              <div style={{ display: "flex", fontSize: 28, color: og.muted }}>
                @{user.username}
              </div>

              {hasFilters ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: "20px 24px",
                    borderRadius: 16,
                    border: `1px solid ${og.subtleBorder}`,
                    background: og.subtleBg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: 22,
                      color: og.mutedStrong,
                      lineHeight: 1.45,
                    }}
                  >
                    {filterLine}
                  </div>
                  {chips.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      {chips.map((c) => (
                        <div
                          key={`${c.label}:${c.count}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 9999,
                            border: `1px solid ${og.chipBorder}`,
                            background: og.chipBg,
                            fontSize: 18,
                            color: og.chipText,
                          }}
                        >
                          <span style={{ display: "flex" }}>{c.label}</span>
                          <span
                            style={{ display: "flex", color: og.chipCount }}
                          >
                            ({nf.format(c.count)})
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ display: "flex", fontSize: 22, color: og.muted }}>
                  {filterLine}
                </div>
              )}
            </div>
          </div>

          {hasFilters ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "24px 40px",
                borderTop: `1px solid ${og.subtleBorder}`,
                background: og.reachBarBg,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: og.muted,
                  textTransform: "uppercase",
                }}
              >
                Reach
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 48,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{ display: "flex", fontSize: 14, color: og.muted }}
                  >
                    Views
                  </span>
                  <span
                    style={{
                      display: "flex",
                      fontSize: 28,
                      fontWeight: 600,
                      color: og.statValue,
                    }}
                  >
                    {nf.format(stats.totalViews)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{ display: "flex", fontSize: 14, color: og.muted }}
                  >
                    Exports
                  </span>
                  <span
                    style={{
                      display: "flex",
                      fontSize: 28,
                      fontWeight: 600,
                      color: og.statValue,
                    }}
                  >
                    {nf.format(stats.totalExports)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{ display: "flex", fontSize: 14, color: og.muted }}
                  >
                    Bookmarks
                  </span>
                  <span
                    style={{
                      display: "flex",
                      fontSize: 28,
                      fontWeight: 600,
                      color: og.statValue,
                    }}
                  >
                    {nf.format(stats.bookmarkCount)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
