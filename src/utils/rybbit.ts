export type RybbitEvent =
  | "browse_searched"
  | "browse_sort_changed"
  | "browse_category_toggled"
  | "browse_tag_toggled"
  | "browse_item_added"
  | "browse_item_removed"
  | "filter_viewed"
  | "filter_exported"
  | "filter_bookmark_toggled"
  | "filter_share_link_copied"
  | "filter_created"
  | "filter_updated"
  | "filter_deleted"
  | "new_filter_clicked"
  | "my_filter_edit_clicked"
  | "my_filter_delete_opened"
  | "my_filter_share_opened"
  | "my_filters_tab_changed"
  | "checkout_started"
  | "checkout_completed"
  | "donate_button_clicked"
  | "donate_link_clicked"
  | "adblock_detected"
  | "adblock_modal_shown"
  | "adblock_modal_subscribe_clicked"
  | "adblock_modal_dismissed"
  | "boost_prompt_shown"
  | "boost_prompt_clicked"
  | "boost_prompt_dismissed"
  | "social_link_clicked"
  | "feedback_submitted";

export type RybbitProperties = Record<string, string | number>;

export function trackEvent(
  eventName: RybbitEvent,
  properties?: RybbitProperties,
): void {
  if (
    typeof window !== "undefined" &&
    window.rybbit &&
    typeof window.rybbit.event === "function"
  ) {
    window.rybbit.event(eventName, properties);
  }
}
