import { useUser } from "@clerk/nextjs";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareButton({ filterId }: { filterId: number }) {
  const { user } = useUser();

  const handleShare = async () => {
    const url = `${window.location.origin}/filters?share=${filterId}&by=${user?.username}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy share link");
    }
  };

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className='hover:bg-transparent hover:text-muted-foreground'
      onClick={handleShare}
    >
      <Share2 />
    </Button>
  );
}
