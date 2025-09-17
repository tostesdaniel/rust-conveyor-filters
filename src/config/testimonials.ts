export type Testimonial = {
  name: string;
  memberId: string;
  designation: string;
  title: string;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Jumble Jam Jam",
    memberId: "1357420469107687434",
    designation: "Solo Player",
    title: "Cool & Useful",
    quote:
      "Before using this tool I had to stress about adding filters effectively, but now with this tool I am able to make effective auto sorters and even auto smelters, plus more using the filters. This tool helped me so much.",
  },
  {
    name: "oTrixzy",
    memberId: "791821448637448263",
    designation: "Solo Player",
    title: "Useful Rust Resource",
    quote:
      "I just figured out about this last couple of weeks / a month ago or something, and it saves so much time.\n\nI remember the times of stressing having to redo the stuff over, and over, and over again.\n\nFor starters, I can make my own filters which makes our lives hella easier for not just saving, but also reusing it for next wipe. Next, I can paste premade ones from other people. Its a win win situation.\n\nJust genuinely, I hope this resource stays up and running. Props to Tostt for making this resource, and managing it. I really appreciate you man.",
  },
];
