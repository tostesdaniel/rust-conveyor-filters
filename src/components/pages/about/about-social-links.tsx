"use client";

import { trackEvent } from "@/utils/rybbit";
import { SiSteam } from "@icons-pack/react-simple-icons";

import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

const { links } = siteConfig;

export function AboutSocialLinks() {
  return (
    <div className='mt-10 flex items-center gap-x-6'>
      <a
        href={links.steam}
        target='_blank'
        rel='noopener noreferrer'
        onClick={() => {
          trackEvent("social_link_clicked", { platform: "steam" });
        }}
        className={buttonVariants({ variant: "outline" })}
      >
        <SiSteam /> Steam Profile
      </a>
      <a
        href={links.gitHub}
        target='_blank'
        rel='noopener noreferrer'
        onClick={() => {
          trackEvent("social_link_clicked", { platform: "github" });
        }}
        className={buttonVariants({ variant: "outline" })}
      >
        <Icons.GitHub /> Follow me
      </a>
      <a
        href={links.linkedIn}
        target='_blank'
        rel='noopener noreferrer'
        onClick={() => {
          trackEvent("social_link_clicked", { platform: "linkedin" });
        }}
        className={buttonVariants({ variant: "outline" })}
      >
        Connect with me
      </a>
    </div>
  );
}
