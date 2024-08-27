import { migrateAuthorIdsFlag } from "@/flags";
import { DatabaseBackupIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Banner, BannerDescription, BannerTitle } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export async function MigrateAuthorIdsBanner() {
  const migrateAuthorIds = await migrateAuthorIdsFlag();

  if (!migrateAuthorIds) return null;

  return (
    <Banner variant='warning' className='mb-10  '>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <BannerTitle>Filter Migration in Progress</BannerTitle>
        <BannerDescription>
          We are currently migrating your filters to our new system to improve
          your experience. Please sign in or sign up again to continue using our
          service without any interruptions.
        </BannerDescription>
        <Dialog>
          <DialogTrigger asChild>
            <Button type='button' size='sm' className='h-7 rounded-full py-1'>
              Learn More
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div className='flex items-center gap-x-2'>
                <DatabaseBackupIcon className='h-4 w-4' />
                <DialogTitle>Filter Migration</DialogTitle>
              </div>
            </DialogHeader>
            <DialogDescription>
              This process may take a few days to complete. If you notice any
              missing filters, please contact <strong>ohTostt</strong> on{" "}
              {siteConfig.name} Discord server, and we will resolve the issue
              for you as soon as possible. Thank you for your patience and
              understanding.
            </DialogDescription>
          </DialogContent>
        </Dialog>
      </div>
    </Banner>
  );
}
