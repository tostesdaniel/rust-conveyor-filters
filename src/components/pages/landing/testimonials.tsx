import type React from "react";
import { getGuildMember } from "@/services/discord-bot";
import { ExternalLinkIcon } from "lucide-react";
import * as motion from "motion/react-client";

import { testimonials, type Testimonial } from "@/config/testimonials";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HeaderSectionContainer,
  HeaderSectionContent,
  HeaderSectionEyebrow,
  HeaderSectionTitle,
} from "@/components/layout/header-sections";

export async function Testimonials() {
  const enrichedTestimonials = await Promise.all(
    testimonials.map(async (testimonial) => {
      const member = await getGuildMember(testimonial.memberId);
      return {
        ...testimonial,
        avatarUrl: member?.avatarUrl ?? "",
      };
    }),
  );

  return (
    <HeaderSectionContainer center>
      <HeaderSectionContent center>
        <HeaderSectionEyebrow>
          Don&apos;t take just my word for it
        </HeaderSectionEyebrow>
        <HeaderSectionTitle className='text-4xl text-balance sm:text-5xl'>
          See what the community thinks
        </HeaderSectionTitle>
      </HeaderSectionContent>

      <div className='mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-muted sm:mt-20 lg:flex lg:max-w-4xl'>
        {enrichedTestimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} />
        ))}

        <LeaveYourReviewCard />
      </div>
    </HeaderSectionContainer>
  );
}

function TestimonialCard({
  testimonial,
  className,
  ...props
}: {
  testimonial: Testimonial & { avatarUrl: string };
} & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      key={testimonial.name}
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("p-8 sm:p-10 lg:flex-auto", className)}
      {...props}
    >
      <figure>
        <figcaption className='flex items-center gap-x-4'>
          <Avatar className='size-10'>
            <AvatarImage src={testimonial.avatarUrl} />
            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex-auto text-base/5'>
            <h3 className='font-semibold'>{testimonial.name}</h3>
            <p className='text-muted-foreground'>{testimonial.designation}</p>
          </div>
        </figcaption>
        <blockquote>
          <h4 className='mt-6 -mb-6 bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] bg-clip-text text-center text-3xl font-semibold tracking-tight text-balance text-transparent sm:text-4xl'>
            {testimonial.title}
          </h4>
          <p className='p-6 text-lg font-semibold tracking-tight sm:p-12 sm:text-xl/8'>
            {`“${testimonial.quote}”`}
          </p>
        </blockquote>
      </figure>
    </motion.div>
  );
}

function LeaveYourReviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className='-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-sm lg:shrink-0'
    >
      <div className='rounded-2xl bg-secondary/50 py-10 text-center ring-1 ring-muted/50 ring-inset lg:flex lg:h-full lg:flex-col lg:justify-center lg:py-16'>
        <div className='mx-auto max-w-xs px-8'>
          <p className='text-3xl font-semibold tracking-tight text-balance'>
            Tell us what you think!
          </p>
          <p className='mt-6 text-base/7 text-balance text-primary/80'>
            Leave a review on our{" "}
            <Button
              asChild
              variant='secondary'
              size='sm'
              className='inline-flex h-6 bg-[#d4d7f9] text-primary hover:bg-[#5865f2] hover:text-secondary has-[>svg]:px-1.5 dark:bg-[#282b50] dark:text-secondary-foreground dark:hover:bg-[#5865f2]'
            >
              <a
                href='https://discord.com/channels/1272807564693995520/1337643680164610098'
                target='_blank'
                rel='noopener noreferrer'
              >
                #🎓│testimonials
                <ExternalLinkIcon className='size-4' aria-hidden />
              </a>
            </Button>{" "}
            Discord channel and get featured here!
          </p>
        </div>
      </div>
    </motion.div>
  );
}
