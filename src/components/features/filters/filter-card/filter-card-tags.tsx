import type { FilterTagDTO } from "@/types/filter";
import { MAX_FILTER_TAGS } from "@/lib/ai/tag-limits";
import { Badge } from "@/components/ui/badge";

export function FilterCardTags({ tags }: { tags: FilterTagDTO[] }) {
  if (!tags || tags.length === 0) return null;
  const visible = tags.slice(0, MAX_FILTER_TAGS);
  return (
    <div className='flex flex-wrap gap-1'>
      {visible.map((tag) => (
        <Badge key={tag.slug} variant='secondary' className='text-[10px]'>
          {tag.label}
        </Badge>
      ))}
    </div>
  );
}
