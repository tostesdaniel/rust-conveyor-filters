import Image from "next/image";

import { siteConfig } from "@/config/site";
import { FeedbackForm } from "@/components/pages/feedback/feedback-form";
import { SignInToast } from "@/components/pages/feedback/feedback-toast";
import { Typography } from "@/components/shared/typography";

export default function FeedbackPage() {
  return (
    <div className='relative'>
      <SignInToast />
      <div className='lg:absolute lg:inset-0 lg:left-1/2'>
        <Image
          src='/image.webp'
          alt=''
          width={1282}
          height={917}
          quality={100}
          priority
          className='-mt-10 h-64 w-full rounded-bl-md object-cover sm:h-80 lg:h-full'
        />
      </div>
      <div className='pt-16 pb-24 sm:pt-24 sm:pb-32 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-2 lg:pt-32'>
        <div className='px-6 lg:px-8'>
          <div className='mx-auto max-w-xl lg:mx-0 lg:max-w-lg'>
            <Typography variant='h1'>We Value Your Feedback</Typography>
            <Typography variant='mutedText' className='mt-2 text-lg leading-8'>
              Please provide your feedback to help us improve {siteConfig.name}.
              Your input is highly appreciated.
            </Typography>
            <FeedbackForm />
          </div>
        </div>
      </div>
    </div>
  );
}
