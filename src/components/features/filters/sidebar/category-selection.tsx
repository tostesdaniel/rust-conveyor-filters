"use client";

import { toast } from "sonner";

import { ITEM_CATEGORIES } from "@/config/constants";
import { useSearchParams } from "@/hooks/useSearchParams";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function CategorySelection() {
  const [{ categories }, setSearchParams] = useSearchParams();

  const handleCategoryClick = (category: (typeof ITEM_CATEGORIES)[number]) => {
    const currentCategories = categories || [];
    const isCurrentlySelected = currentCategories.includes(category);

    if (isCurrentlySelected) {
      setSearchParams({
        categories: currentCategories.filter((c) => c !== category),
      });
      return;
    }

    if (currentCategories.length >= 5) {
      toast.warning("Category limit reached", {
        description: "You can only select up to 5 categories at a time.",
      });
      return;
    }

    setSearchParams({
      categories: [...currentCategories, category],
    });
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className='font-semibold hover:bg-transparent active:bg-transparent'>
            Categories
            <span
              className={cn(
                "ml-auto text-xs",
                !categories?.length
                  ? "text-muted-foreground"
                  : categories.length <= 2
                    ? "text-green-600 dark:text-green-400"
                    : categories.length <= 4
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400",
              )}
            >
              {categories?.length ?? 0}/5
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuSub>
          {ITEM_CATEGORIES.map((category) => (
            <SidebarMenuSubItem key={category}>
              <SidebarMenuSubButton
                asChild
                isActive={categories?.includes(category) ?? false}
                onClick={() => handleCategoryClick(category)}
                className='group cursor-pointer'
              >
                <div>
                  <Checkbox
                    className='group-hover:border-ring'
                    checked={categories?.includes(category) ?? false}
                    onCheckedChange={() => handleCategoryClick(category)}
                  />
                  <span>{category}</span>
                </div>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenu>
    </SidebarGroup>
  );
}
