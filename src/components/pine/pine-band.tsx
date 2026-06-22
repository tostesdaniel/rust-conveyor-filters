import Image from "next/image";

import {
  buildPineUrl,
  pineConfig,
  type PineCreative,
  type PineCreativeAsset,
  type PinePlacement,
} from "@/config/pine";

interface PineBandProps {
  placement: PinePlacement;
  creative: PineCreative;
}

/**
 * One responsive variant of the creative inside its own reserved box. The box's
 * `aspectRatio` comes from the asset's intrinsic dimensions, so space is held
 * before the image loads (zero CLS); `visibility` toggles the desktop/mobile
 * swap purely with CSS at the `md` breakpoint — no JS, no second network cost
 * (the hidden variant is lazy and never enters the viewport).
 */
function CreativeBox({
  asset,
  alt,
  visibility,
}: {
  asset: PineCreativeAsset;
  alt: string;
  visibility: string;
}) {
  return (
    <span
      className={`w-full ${visibility}`}
      style={{ aspectRatio: `${asset.width} / ${asset.height}` }}
    >
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        alt={alt}
        className='h-full w-full object-contain'
      />
    </span>
  );
}

export function PineBand({ placement, creative }: PineBandProps) {
  return (
    <a
      href={buildPineUrl()}
      target='_blank'
      rel='sponsored noopener'
      data-umami-event='pine-click'
      data-umami-event-placement={placement}
      className='relative block w-full'
    >
      <CreativeBox
        asset={creative.desktop}
        alt={creative.alt}
        visibility='hidden md:block'
      />
      <CreativeBox
        asset={creative.mobile}
        alt={creative.alt}
        visibility='block md:hidden'
      />
      <span className='absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-xs'>
        {pineConfig.copy.sponsoredLabel}
      </span>
    </a>
  );
}
