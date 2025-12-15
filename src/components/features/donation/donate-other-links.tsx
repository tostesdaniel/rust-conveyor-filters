"use client";

import { trackEvent } from "@/utils/rybbit";
import { Handshake, Trophy } from "lucide-react";

import { siteConfig } from "@/config/site";
import { ButtonWithIcon } from "@/components/shared/button-with-icon";

export function DonateOtherLinks() {
  return (
    <ul
      role='list'
      className='mt-6 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2'
    >
      <ButtonWithIcon icon={Handshake}>
        <a
          href={siteConfig.donate.steamTradeOffer}
          target='_blank'
          rel='noopener noreferrer'
          onClick={() => {
            trackEvent("donate_link_clicked", { type: "trade_offer" });
          }}
        >
          Send a trade offer
        </a>
      </ButtonWithIcon>
      <ButtonWithIcon icon={Trophy}>
        <a
          href={siteConfig.donate.steamAwardsPost}
          target='_blank'
          rel='noopener noreferrer'
          onClick={() => {
            trackEvent("donate_link_clicked", { type: "steam_award" });
          }}
        >
          Give a Steam Award
        </a>
      </ButtonWithIcon>
    </ul>
  );
}


