import React from "react";

import { Typography } from "@/components/ui/typography";

export function parseDescription(description: string): React.ReactNode {
  const lines = description.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    if (line.match(/\[h1\](.*?)\[\/h1\]/)) {
      elements.push(
        <Typography key={index} variant='h3' className='border-b-0'>
          {line.replace(/\[\/?h1\]/g, "")}
        </Typography>,
      );
    } else if (line.match(/\[h2\](.*?)\[\/h2\]/)) {
      elements.push(
        <Typography key={index} variant='h4' className='text-blue-400'>
          {line.replace(/\[\/?h2\]/g, "")}
        </Typography>,
      );
    } else if (line.match(/\[b\](.*?)\[\/b\]/)) {
      const parts = line.split(/\[b\](.*?)\[\/b\]/).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className='font-bold'>
            {part}
          </span>
        ) : (
          part
        ),
      );
      elements.push(
        <Typography key={index} variant='p'>
          {parts}
        </Typography>,
      );
    } else if (line.match(/\[list\]/)) {
      listItems = [];
    } else if (line.match(/\[\/list\]/)) {
      elements.push(
        <Typography key={index} variant='ul'>
          {listItems}
        </Typography>,
      );
      listItems = [];
    } else if (line.match(/\[\*\](.*)/)) {
      listItems.push(
        <li key={index} className='ml-4'>
          {line.replace(/\[\*\]/, "").trim()}
        </li>,
      );
    } else if (line === "") {
      elements.push(<br key={index} className='leading-3' />);
    } else {
      elements.push(
        <Typography key={index} variant='p' className='mt-0!'>
          {line}
        </Typography>,
      );
    }
  });

  return elements;
}
