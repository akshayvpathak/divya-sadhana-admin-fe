export const getAlignmentClass = (align?: "left" | "center" | "right") => {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    case "left":
    default:
      return "text-left";
  }
};

export const getStickyClass = (sticky?: "left" | "right") => {
  // `bg-inherit` keeps the zebra stripe and hover tint under a pinned column
  // instead of punching a white hole through them. Requires the opaque row
  // backgrounds in DataTableBody — bg-inherit copies alpha too.
  if (sticky === "left") {
    return "sticky left-0 z-10 bg-inherit border-r border-line shadow-[4px_0_6px_-4px_rgb(26_22_36_/_0.12)]";
  }
  if (sticky === "right") {
    return "sticky right-0 z-10 bg-inherit border-l border-line shadow-[-4px_0_6px_-4px_rgb(26_22_36_/_0.12)]";
  }
  return "";
};
