import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import * as motion from "motion/react-client";

import {
  HeaderSectionContainer,
  HeaderSectionContent,
  HeaderSectionDescription,
  HeaderSectionTitle,
} from "../header-sections";
import { TextEffect } from "../text-effect";
import { Button } from "../ui/button";

export function CTA() {
  return (
    <div className='relative isolate overflow-hidden'>
      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{
          ease: "easeOut",
        }}
      >
        <HeaderSectionContainer>
          <HeaderSectionContent center>
            <HeaderSectionTitle
              as='div'
              className='text-4xl text-balance sm:text-5xl'
            >
              <TextEffect
                as='h2'
                preset='fade-in-blur'
                delay={0.5}
                useInView
                per='line'
                className='text-balance'
              >
                {`Stop Wasting Time.\nAutomate Like a Chad.`}
              </TextEffect>
            </HeaderSectionTitle>
            <HeaderSectionDescription
              as='div'
              className='leading-8 lg:text-lg/8'
            >
              <TextEffect preset='slide' delay={1.25} speedReveal={3} useInView>
                Join hundreds of players who are already using Rust Conveyor
                Filters to dominate the game. Get started for free.
              </TextEffect>
            </HeaderSectionDescription>
          </HeaderSectionContent>
          <motion.div
            initial='hidden'
            whileInView='visible'
            variants={{
              visible: {
                transition: {
                  delayChildren: 1.75,
                  staggerChildren: 0.3,
                  when: "beforeChildren",
                },
              },
            }}
            viewport={{ once: true }}
            className='mt-10 flex items-center justify-center gap-x-6'
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.5 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: {
                    bounce: 0,
                    duration: 0.3,
                    ease: "easeOut",
                  },
                },
              }}
            >
              <Button asChild>
                <Link href='/sign-up'>Get Started</Link>
              </Button>
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -100 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: {
                    bounce: 0,
                    duration: 0.3,
                    ease: "easeOut",
                  },
                },
              }}
            >
              <Button asChild variant='link' className='group'>
                <Link href='/about'>
                  Learn More{" "}
                  <ArrowRightIcon className='transition-transform group-hover:translate-x-0.5' />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </HeaderSectionContainer>
        <svg
          viewBox='0 0 1024 1024'
          aria-hidden='true'
          className='absolute top-1/2 left-1/2 -z-10 size-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]'
        >
          <circle
            r={512}
            cx={512}
            cy={512}
            fill='url(#8d958450-c69f-4251-94bc-4e091a323369)'
            fillOpacity='0.7'
          />
          <defs>
            <radialGradient id='8d958450-c69f-4251-94bc-4e091a323369'>
              <stop stopColor='#4361ee' />
              <stop offset={1} stopColor='#4cc9f0' />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}
