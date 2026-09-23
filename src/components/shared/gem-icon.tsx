import { useId, type SVGProps } from "react";

export function GemIcon(props: SVGProps<SVGSVGElement>) {
  const gradientId = useId();

  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
      focusable='false'
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1='2' y1='4' x2='22' y2='21'>
          <stop offset='0' stopColor='#f55cc4' />
          <stop offset='1' stopColor='#6a72ea' />
        </linearGradient>
      </defs>
      <path d='M8 4h8l6 5-10 12L2 9z' fill={`url(#${gradientId})`} />
      <path d='M8 4l4 5 4-5z' fill='#fff' fillOpacity='0.45' />
      <path
        d='M2 9h20M8 4l4 5 4-5M7.5 9 12 21l4.5-12'
        stroke='#fff'
        strokeOpacity='0.35'
        strokeWidth='0.9'
        strokeLinejoin='round'
      />
    </svg>
  );
}
