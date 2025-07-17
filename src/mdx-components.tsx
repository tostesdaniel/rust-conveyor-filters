import type { MDXComponents } from "mdx/types";

import { Typography } from "@/components/shared/typography";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <Typography variant='h1' {...props} />,
    h2: (props) => <Typography variant='h2' {...props} />,
    h3: (props) => <Typography variant='h3' {...props} />,
    h4: (props) => <Typography variant='h4' {...props} />,
    p: (props) => <Typography variant='p' {...props} />,
    ul: (props) => <Typography variant='ul' {...props} />,
    ...components,
  };
}
