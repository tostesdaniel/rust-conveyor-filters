import { BugOffIcon, CodeIcon, CoffeeIcon, ServerIcon } from "lucide-react";

const features = [
  {
    name: "Server costs",
    description:
      "Help maintain reliable hosting and ensure the app stays fast and responsive",
    icon: ServerIcon,
  },
  {
    name: "New features",
    description:
      "Support the development of new features and improvements to elevate your experience",
    icon: CodeIcon,
  },
  {
    name: "Quick fixes",
    description: "Enable faster response times to bugs and critical updates",
    icon: BugOffIcon,
  },
  {
    name: "Developer fuel",
    description:
      "Keep the developer energized for those late-night coding sessions",
    icon: CoffeeIcon,
  },
];

export function DonateFeature() {
  return (
    <dl className='mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2'>
      {features.map((feature) => (
        <div key={feature.name}>
          <dt className='text-base/7 font-semibold'>
            <div className='mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/10'>
              <feature.icon aria-hidden='true' className='h-6 w-6' />
            </div>
            {feature.name}
          </dt>
          <dd className='mt-1 text-base/7'>
            Help maintain reliable hosting and ensure the app stays fast and
            responsive
          </dd>
        </div>
      ))}
    </dl>
  );
}
