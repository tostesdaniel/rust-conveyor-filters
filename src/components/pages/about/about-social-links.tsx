"use client";

import { trackEvent } from "@/utils/rybbit";
import { SiSteam } from "@icons-pack/react-simple-icons";
import { LinkedinIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

const { links } = siteConfig;

export function AboutSocialLinks() {
  return (
    <div className='mt-10 flex items-center gap-x-6'>
      <Button asChild variant='outline'>
        <a
          href={links.steam}
          target='_blank'
          rel='noopener noreferrer'
          onClick={() => {
            trackEvent("social_link_clicked", { platform: "steam" });
          }}
        >
          <SiSteam /> Steam Profile
        </a>
      </Button>
      <Button asChild variant='outline'>
        <a
          href={links.gitHub}
          target='_blank'
          rel='noopener noreferrer'
          onClick={() => {
            trackEvent("social_link_clicked", { platform: "github" });
          }}
        >
          <Icons.gitHub /> Follow me
        </a>
      </Button>
      <Button asChild variant='outline'>
        <a
          href={links.linkedIn}
          target='_blank'
          rel='noopener noreferrer'
          onClick={() => {
            trackEvent("social_link_clicked", { platform: "linkedin" });
          }}
        >
          <LinkedinIcon /> Connect with me
        </a>
      </Button>
    </div>
  );
}
