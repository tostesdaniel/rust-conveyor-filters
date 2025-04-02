"use client";

import * as React from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { useInView } from "react-intersection-observer";

import type { ConveyorFilterItem } from "@/types/filter";
import { useMediaQuery } from "@/hooks/use-media-query";
import { categoryMapping } from "@/lib/categoryMapping";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
  type CarouselOptions,
} from "@/components/ui/carousel";
import { getCategoryIcon } from "@/components/category-icons";

export function FilterItemsCarousel({
  filterItems,
}: {
  filterItems: ConveyorFilterItem[];
}) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [currentPage, setCurrentPage] = React.useState(1);
  const isMinWidth550 = useMediaQuery("(min-width: 550px)");
  const isMinWidth440 = useMediaQuery("(min-width: 440px)");
  const isMinWidth360 = useMediaQuery("(min-width: 360px)");
  const autoplay = React.useRef(
    Autoplay({
      delay: 3000,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
      playOnInit: false,
    }),
  );
  const { ref, inView } = useInView({ threshold: 0.5 });

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrentPage(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrentPage(api.selectedScrollSnap() + 1);
      autoplay.current.play();
    });
  }, [api]);

  React.useEffect(() => {
    if (inView && api?.canScrollNext()) {
      autoplay.current.play();
    } else {
      autoplay.current.stop();
    }
  }, [api, inView]);

  const itemsPerPage = React.useMemo(() => {
    if (isMinWidth550) return 6;
    if (isMinWidth440) return 5;
    if (isMinWidth360) return 4;
    return 3;
  }, [isMinWidth360, isMinWidth440, isMinWidth550]);

  const carouselOpts: CarouselOptions = React.useMemo(
    () => ({
      slidesToScroll: 3,
      breakpoints: {
        "(min-width: 360px)": { slidesToScroll: 4 },
        "(min-width: 440px)": { slidesToScroll: 5 },
        "(min-width: 550px)": { slidesToScroll: 6 },
      },
    }),
    [],
  );

  const getItemRangeText = React.useMemo(() => {
    const currentEndIndex = Math.min(
      currentPage * itemsPerPage,
      filterItems.length,
    );
    const currentStartIndex = Math.max(currentEndIndex - itemsPerPage + 1, 1);
    return (
      <>
        Showing <strong>{currentStartIndex}-</strong>
        <strong>{currentEndIndex}</strong>
        {" of "}
        <strong>{filterItems.length}</strong> items
      </>
    );
  }, [currentPage, filterItems.length, itemsPerPage]);

  return (
    <div ref={ref}>
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          ...carouselOpts,
        }}
        plugins={[autoplay.current]}
      >
        <CarouselContent>
          {filterItems.map((filterItem) => {
            const { item, category } = filterItem;
            const isCategory = !item;
            const key = item?.id || category?.id;
            const categoryKey = Object.keys(categoryMapping).find(
              (key) => categoryMapping[key] === category?.name,
            );
            const CategoryIcon = getCategoryIcon(categoryKey!);

            return (
              <CarouselItem
                key={key}
                className='basis-1/3 min-[360px]:basis-1/4 min-[440px]:basis-1/5 min-[550px]:basis-1/6'
              >
                <Card className='p-1'>
                  <CardContent className='relative aspect-square items-center justify-center p-0'>
                    {isCategory ? (
                      <>
                        <CategoryIcon className='h-14 w-full object-cover py-1' />
                        <p className='overflow-hidden text-center text-xs font-bold text-clip'>
                          {category?.name}
                        </p>
                      </>
                    ) : (
                      <Image
                        src={`/items/${item.imagePath}.png`}
                        alt={item.name}
                        fill
                        sizes='80px'
                        style={{ objectFit: "cover" }}
                        quality={75}
                      />
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      <div className='py-2 text-center text-sm text-muted-foreground'>
        {getItemRangeText}
      </div>
    </div>
  );
}
