import { getHeroStats } from "@/services/queries/stats";
import * as motion from "motion/react-client";

import {
  HeaderSectionContainer,
  HeaderSectionContent,
  HeaderSectionDescription,
  HeaderSectionEyebrow,
  HeaderSectionTitle,
} from "../layout/header-sections";
import { StatsGrid } from "./stats-grid";

export async function HeroStats() {
  const stats = await getHeroStats();

  return (
    <HeaderSectionContainer center>
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, filter: "blur(0px)" }}
        viewport={{ once: true }}
      >
        <HeaderSectionContent center>
          <HeaderSectionEyebrow>Work Smarter, Not Harder</HeaderSectionEyebrow>
          <HeaderSectionTitle className='text-4xl text-balance sm:text-5xl'>
            Stop Building the Same Filters Every Wipe
          </HeaderSectionTitle>
          <HeaderSectionDescription className='mt-4 text-lg/8 sm:text-lg/8'>
            Join hundreds of players who have simplified their base automation
            by building smart, reusable filter collections.
          </HeaderSectionDescription>
        </HeaderSectionContent>
      </motion.div>

      <StatsGrid stats={stats} />
    </HeaderSectionContainer>
  );
}
