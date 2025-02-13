import Image, { type StaticImageData } from "next/image";
import filterBuilderImage from "@/../public/images/features/filter-builder.webp";
import filterCategoriesImage from "@/../public/images/features/filter-categories.webp";
import filterSharingImage from "@/../public/images/features/filter-sharing.webp";
import * as motion from "motion/react-client";

import { cn } from "@/lib/utils";

import { HeaderSectionContainer } from "../header-sections";

interface Feature {
  title: string;
  description: string;
  image: StaticImageData;
}

const features: Feature[] = [
  {
    title: "Intuitive Filter Builder",
    description:
      "Save hours every wipe by creating filters just like you would in-game. No more stress trying to remember that filter.",
    image: filterBuilderImage,
  },
  {
    title: "Smart Organization",
    description:
      "Keep your filters smoothly organized with filter collections. Create categories and subcategories for your filters to make them easier to find.",
    image: filterCategoriesImage,
  },
  {
    title: "Share Filters",
    description:
      "Share your filters with your friends and team members. Got any team mates that help set up the filters? Let them use the same filters as you.",
    image: filterSharingImage,
  },
];

export function FeatureItem({
  feature,
  invert = false,
}: {
  feature: Feature;
  invert?: boolean;
}) {
  return (
    <motion.div
      initial='initial'
      whileInView='visible'
      viewport={{ once: true, amount: 0.5 }}
      variants={{
        initial: {
          opacity: 0,
          filter: "blur(10px)",
          y: "var(--translate-y-from)",
          x: "var(--translate-x-from)",
        },
        visible: {
          opacity: 1,
          filter: "blur(0px)",
          y: "var(--translate-y-to)",
          x: "var(--translate-x-to)",
          transition: {
            duration: 0.5,
            ease: "easeInOut",
          },
        },
      }}
      className={cn(
        "[--translate-y-from:100px] [--translate-y-to:0px]",
        "lg:[--translate-y-from:0px] lg:[--translate-y-to:0px]",
        invert
          ? "lg:[--translate-x-from:50%] lg:[--translate-x-to:0%]"
          : "lg:[--translate-x-from:-50%] lg:[--translate-x-to:0%]",
      )}
    >
      <motion.div className='flex flex-col items-start gap-12 lg:flex-row lg:items-start'>
        <div
          className={cn(
            "flex w-full flex-col gap-2 lg:w-1/2 lg:pt-8",
            invert && "lg:text-right",
          )}
        >
          <h3 className='text-3xl font-bold sm:text-4xl'>{feature.title}</h3>
          <p
            className={cn(
              "text-balance text-muted-foreground lg:text-lg/9",
              invert && "ml-auto",
            )}
          >
            {feature.description}
          </p>
        </div>
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-lg p-px lg:w-1/2",
            invert && "lg:order-first",
          )}
        >
          <motion.div
            className='absolute inset-0'
            style={{
              background:
                "radial-gradient(transparent, transparent, rgb(67, 97, 238), rgb(76, 201, 240), transparent, transparent)",
              backgroundSize: "300% 300%",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <div className='relative h-full w-full overflow-hidden rounded-lg'>
            <Image
              src={feature.image}
              alt={feature.title}
              quality={100}
              sizes='100vw'
              className='object-cover'
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FeaturesShowcase() {
  return (
    <HeaderSectionContainer>
      {
        <div className='space-y-24'>
          {features.map((feature, idx) => (
            <FeatureItem
              key={feature.title}
              feature={feature}
              invert={idx % 2 === 1}
            />
          ))}
        </div>
      }
    </HeaderSectionContainer>
  );
}
