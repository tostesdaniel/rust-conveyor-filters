/**
 * Anchor placement options
 *
 * - `bottom`:
 *   Bottom of screen.
 *
 * - `top`:
 *   Top of screen, pushes content down
 *
 * @default "bottom"
 */
type AnchorPositionOptions = "bottom" | "top";

/**
 * Device options
 */
type Device = "desktop" | "phone" | "tablet";

/**
 * Floating placement position options
 *
 * @default "BottomRight"
 *
 * - `BottomLeft`: Bottom left corner.
 *
 * - `BottomRight`:
 *   Bottom right corner, default.
 *
 * - `Left`:
 *   Lower left corner (deprecated, use bottom-left instead).
 *
 * - `Right`:
 *   Lower right corner, (deprecated, use bottom-right instead).
 *
 * - `TopLeft`:
 *   Top left corner.
 *
 * - `TopRight`:
 *   Top right corner.
 */
type FloatingPositionOptions =
  | "bottom-left"
  | "bottom-right"
  | "left"
  | "right"
  | "top-left"
  | "top-right";

/**
 * Floating placement options
 *
 * - `After`:
 *   Begin playing after scrolling into view, then float when scrolling out.
 *
 * - `Always`:
 *   Hide inline player and show floating player whenever possible.
 *
 * - `Auto`:
 *   Show floating player when inline player is off screen.
 * - `Never`:
 *   Never show floating player. Use with caution, as this can hurt viewability.
 */
type FloatOptions = "After" | "Always" | "Auto" | "Never";

/**
 * Ad Format Options:
 *
 * - `Anchor`:
 *   Sticky ad anchored to the top or bottom of the screen.
 *   No placeholder div required.
 *
 * - `AnchorV2`:
 *   Updated sticky ad anchored to top or bottom of the screen.
 *   No placeholder div required.
 *
 * - `Article`:
 *   Multiple placements distributed throughout an article (maximum 20).
 *
 * - `Display`:
 *   Standard display ad placement.
 *
 * - `Floating`:
 *   Floating placement for outstream video only.
 *   No placeholder div required.
 *
 * - `Interstitial`:
 *   Interstitial ad, may appear when user navigates away from the site.
 *
 * - `Rail`:
 *   Dismissable sticky ads centered vertically along the left or right side of the page.
 *
 * - `SmartFlex`:
 *   Fixed-height box expanding to container width, displays a sticky ad inside.
 */
type FormatOptions =
  | "anchor"
  | "anchor-v2"
  | "article"
  | "display"
  | "floating"
  | "interstitial"
  | "rail"
  | "smart-flex"
  | "sticky-stack"
  | "video"
  | "video-nc";
// type FormatOptions =
// 	| "Anchor"
// 	| "AnchorV2"
// 	| "Article"
// 	| "Display"
// 	| "Floating"
// 	| "Interstitial"
// 	| "Rail"
// 	| "SmartFlex"
// 	| "StickyStack"
// 	| "Video"
// 	| "VideoNC";

/**
 * Mobile placement options
 *
 * - `Compact`: Limit size based on height of screen
 * - `Full`: Use full width
 */
type MobileOptions =
  | "compact" // Smaller, condensed ad format optimized for mobile screens
  | "full";

/**
 * Outstream placement options
 *
 * - `Auto`:
 *   Fill include outstream video in eligible display placements automatically
 *
 *  - `Never`:
 *   Always exclude outstream video from this placement
 */
type OutstreamOptions = "auto" | "never";

/**
 * Rail placement vertical alignment options
 *
 * - `Center`: Center of screen
 * - `Top`: Top of screen
 */
type RailVerticalAlignOptions = "center" | "top";

/**
 * Reporting placements position
 *
 * - `BottomLeftSide`: Icon only position
 * - `BottomRightSide`: Icon only position
 * - `TopLeftSide`: Icon only position
 * - `TopRightSide`: Icon only position
 */
type ReportPosition =
  /* Bottom */
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  /* Left Side */
  | "bottom-left-side"
  | "top-left-side"
  /* Right Side */
  | "bottom-right-side"
  | "top-right-side"
  | "center-right-side"
  /* Top */
  | "top-center"
  | "top-left"
  | "top-right";

/**
 * Floating placement options
 *
 * - `alwaysVisible`:
 *   Keep the player visible even when ads aren't playing.
 *
 * - `position`:
 *   Floating player position, defaults to right
 *
 * - `reduceMobileSize`:
 *   Reduce the size of the floating player on mobile devices. Overwrites scale if set.
 *
 * @default
 * position: "Right"
 */
interface FloatingOptions {
  alwaysVisible?: boolean;
  position: FloatingPositionOptions;
  reduceMobileSize?: boolean;
}

/**
 * Options for interstitial placements
 *
 * - `triggers`: Control when interstitials are triggered.
 */
interface InterstitialOptions {
  triggers: Partial<Record<"unhideWindow", boolean>>;
}

/**
 * Reporting placements options
 *
 * - `enabled`:
 *   Show a link next to placement to report problems with the ad. Default is false.
 *
 * - `icon`:
 *   If enabled, a tiny icon will open a menu with the report link. Default is true.
 *
 * - `iconColor`:
 *   Color of the icon used to open then report menu. Default is '#666'
 *
 * - `position`:
 *   Set the location of reporting link, relative to placement. Default is 'bottom-right'.
 *
 * - `wording`:
 *   Set this to override link text. Default is 'Report Ad'.
 *
 * @default
 * enabled: false
 * icon: true
 * iconColor: '#666'
 * position: 'bottom-right'
 * wording: 'Report Ad'
 */
interface ReportOptions {
  enabled?: boolean;
  icon?: boolean;
  iconColor?: string;
  position?: ReportPosition;
  wording?: string;
}

/**
 * Video placement options
 *
 * - `float`:
 *   Control floating player behavior. Default is auto.
 *
 * - `hidePlaylist`:
 *   Playlist widget is shown or hidden based on player size. Set to true to always hide playlist.
 *
 * - `initialDelay`:
 *   Time in seconds before showing first ad.
 *
 * - `interval`:
 *   Time in seconds between ad placements.
 *
 * - `mobile`:
 *   Floating player style on mobile. Default is 'full'.
 *
 * - `persistMinimizeTime`:
 *   Remember if floating player was minimized, even across page views in a session. Value is the time in seconds to remember minimized state. Setting this too high can negatively affect viewability and result in lower ad revenue. Default is 0, to not remember minimize across pages.
 *
 * @default
 * float: "auto"
 * hidePlaylist: false
 * mobile: "full"
 * persistMinimizeTime: 0
 */
interface VideoOptions {
  float: FloatOptions;
  hidePlaylist: boolean;
  initialDelay: number;
  interval: number;
  mobile: MobileOptions;
  persistMinimizeTime: number;
}

/**
 * Placement options
 */
export interface NitroAdOptions {
  /**
   * Used with `anchor` format to specify if anchor should be at the top or bottom of screen. Defaults is `bottom`.
   *
   * @default "bottom"
   */
  anchor?: AnchorPositionOptions;
  /**
   * Used with `anchor` format to define the background color. Default is `rgb(0 0 0 / 80%)`
   *
   * @default "rgb(0 0 0 / 80%)"
   */
  anchorBgColor?: string;
  /**
   * Used with `anchor` format to toggle whether or not an anchor can be closed. Default is `false`, meaning close button will not be present
   *
   * @default false
   */
  anchorClose?: boolean;
  /**
   * Used with `anchor` format to define the background color of the close button. Default is `rgba(255, 255, 255, 0.2)`
   *
   * @default "rgba(255, 255, 255, 0.2)"
   */
  anchorCloseBg?: string;
  /**
   * Used with anchor format to define the close button color. Default is `#fff`
   *
   * @default "#fff"
   */
  anchorCloseColor?: string;
  /**
   * Used with `anchor` to specify that the close action should be persistent for the entire browser session. Default is `false`, meaning clicking on close will only close the anchor for the current page.
   *
   * @default false
   */
  anchorPersistClose?: boolean;
  /**
   * Used with `anchor` format to specify the amount of space (in pixels) between the ad and the edge of the screen.
   */
  anchorStickyOffset?: number;
  /**
   * Used with `article` format to specify the amount of space (in pixels) between the ad and the top of the screen when it's sticky.
   */
  articleOffsetTop?: number;
  /**
   * Mutually exclusive with skipBidders (skipBidders has priority). List of bidders to include in auction.
   */
  bidders?: string[];
  /**
   * Used with formats that generate ad placements on the page without static holders to provide css selectors.
   */
  className?: string;
  // contentRating: string;
  /**
   * Delay loading until DOMContentLoaded. Recommended only for responsive placements when external stylesheets must be loaded first to determine size. This delays the start of ad auction, which may slightly reduce ad performance. Default is `false`.
   *
   * @default false
   */
  delayLoading?: boolean;
  /**
   * Display a static placeholder instead of making ad calls, for testing.
   */
  demo?: boolean;
  /**
   * Time to wait (in milliseconds) before rendering demo placement.
   */
  demoDelay?: number;
  /**
   * Settings for `floating` format.
   */
  floating?: FloatingOptions;
  /**
   * Placement format. Default is display.
   *
   * @default "display"
   */
  format: FormatOptions;
  /**
   * Duration in seconds for per-user frequency cap. If set, this placement will only be shown to the user every `frequencyCap` seconds.
   */
  frequencyCap?: number;
  /**
   * Array of 2-letter country/region codes. If set, this placement will only be shown to users in these regions. In addition to ISO 3166-1 alpha-2 codes, 'XX' is unknown, and 'T1' is tor users.
   */
  geoAllow?: string[];
  /**
   * Array of 2-letter country/region codes. If set, this placement will not be shown to users in these regions. In addition to ISO 3166-1 alpha-2 codes, 'XX' is unknown, and 'T1' is tor users.
   */
  geoDeny?: string[];
  /**
   * Options for interstitial placements.
   *
   * @example
   * interstitial: {
   *   triggers: {
   *     unhideWindow: true,
   *   },
   * }
   */
  interstitial?: InterstitialOptions;
  /**
   * Comma separated list of keywords describing the page. Use this to override the site keywords setting for placements on specific parts of site. Example: 'video games, fps, doom'.
   */
  keywords?: string;
  /**
   * Specifies an optional media query that must be matched for an ad placement to display.
   */
  mediaQuery?: string;
  /**
   * The minimum amount of milliseconds to wait since initialization or the last refresh until NitroAd.onNavigate() is allowed to trigger a refresh
   */
  onNavigateMin?: number;
  /**
   * Outstream video support. Default is 'auto'.
   *
   * @default "auto"
   */
  outstream?: OutstreamOptions;
  /**
   * Optional parameter used with `article` format to specify how many pages of content should appear between ad placements. Defaults to 1.
   *
   * @default 1
   */
  pageInterval?: number;
  /**
   * Used with `smart-flex` format to specify the color of the pre-ad loader and the blank placeholder.
   */
  placeholderColor?: string;
  /**
   * Used with `rail` format to specify if the rail should be placed on the left or right side of the screen. Default is left.
   *
   * @default "left"
   */
  rail?: "left" | "right";
  /**
   * Used with `rail` format to specify the color of the rail close button. Default is `rgb(102 102 102)`
   *
   * @default "rgb(102 102 102)"
   */
  railCloseColor?: string;
  /**
   * Used with `rail` format to specify any elements that should be ignored when detecting collisions for the rail. These can be class names (`.className`) or ids (`#id`). The wildcard `*` can be used to ignore all collisions.
   */
  railCollisionWhitelist?: string[];
  /**
   * Used with `rail` format to specify the amount of total amount of pixels the side rail will scroll with the user, set 0 for as far as possible.
   */
  railDistance?: number;
  /**
   * Used with `rail` format to specify the amount of pixels between the bottom of the page and where the ad stops scrolling.
   */
  railOffsetBottom?: number;
  /**
   * Used with `rail` format to specify the amount of pixels between the top of the page and where the ad is initially positioned. The ad becomes sticky after scrolling for the given distance.
   */
  railOffsetTop?: number;
  /**
   * Used with `rail` format to specify the amount of pixels between the ad and the left/right edge of the screen. Default is `10`.
   *
   * @default 10
   */
  railSpacing?: number;
  /**
   * Used with `rail` format to stack two ads in the rail. If true, the sizes option will be filtered to only include sizes `300x250`, `320x50` and/or `320x100`. Default is `false`.
   *
   * @default false
   */
  railStack?: boolean;
  /**
   * Used with `rail` format to specify the amount of pixels between the top of the screen and where the ad becomes sticky.
   */
  railStickyTop?: number;
  /**
   * Used with `rail` format to specify the vertical alignment of the rail ad. Can be `center` (default) or `top`
   *
   * @default "center"
   */
  railVerticalAlign?: RailVerticalAlignOptions;
  /**
   * List of bidders for whom refreshing should be disabled. If specified, refreshing will be stopped when one of these is filled.
   */
  refreshDisabled?: string[];
  /**
   * The maximum number of times an ad placement can be refreshed per page view.
   */
  refreshLimit?: number;
  /**
   * The amount of time in seconds that must pass before another auction is run and the placement renders a new ad.
   */
  refreshTime?: number;
  /**
   * Only refresh when placement is in view. Default is `true`.
   *
   * @default true
   */
  refreshVisibleOnly?: boolean;
  /**
   * Delay initial ad rendering until the placement's dom element is about to enter view. visibleMargin can be used to adjust how much buffer margin is used.
   */
  renderVisibleOnly?: boolean;
  /**
   * Reporting placements options
   */
  report?: ReportOptions;
  /**
   * List of valid sizes for placement. Sizes should be specified as [x, z].
   */
  sizes: [string, string][];
  /**
   * Mutually exclusive with bidders (skipBidders has priority). List of bidders to be excluded from auction.
   */
  skipBidders?: string[];
  /**
   * If true, the auction will not include any Prebid demand
   */
  skipPrebid?: boolean;
  /**
   * Used with `smart-flex` format to specify the amount of pixels between the top of the screen and where the ad becomes sticky.
   */
  smartFlexStickyTop?: number;
  /**
   * Used with `sticky-stack` format to specify the maximum amount of ads that will be rendered in the column. If the maximum is reached, the final ad will scroll with the user until the end of page without creating any additional units.
   */
  stickyStackLimit?: number;
  /**
   * Used with `sticky-stack` format to specify the amount of space (in pixels) between the ad and the top of the screen when it's sticky, and also the space in between ads that are swapping.
   */
  stickyStackOffset?: number;
  /**
   * Used with `sticky-stack` format to specify if the stack should add more placements if more space becomes available. Default is `false`.
   *
   * @default false
   */
  stickyStackResizable?: boolean;
  /**
   * Used with `sticky-stack` format to specify the amount of space between ad units as a multiple of the total viewport height (minimum 1.25)
   */
  stickyStackSpace?: number;
  // targeting: PlacementTargeting;
  /**
   * Override default title attribute of placement iframe.
   */
  title?: string;
  /**
   * The off-screen margin in pixels, used to determine when a placement is about to enter view. Default is `200`.
   *
   * @default 200
   */
  visibleMargin?: number;
}

export interface NitroAd {
  id: string;
  options: NitroAdOptions;
  onNavigate?: (href?: string) => void;
}

type NitroAdsCommand =
  | [
      "createAd",
      IArguments,
      (ad: NitroAd | Promise<NitroAd> | Promise<NitroAd[]> | null) => void,
    ]
  | ["addUserToken", IArguments];

export interface NitroAdsAPI {
  createAd: (
    id: string,
    options: NitroAdOptions,
  ) => NitroAd | Promise<NitroAd> | Promise<NitroAd[]> | null;
  addUserToken?: (...args: unknown[]) => void;
  loaded?: boolean;
  queue?: NitroAdsCommand[];
}

declare global {
  interface Window {
    nitroAds?: NitroAdsAPI;
  }
}
