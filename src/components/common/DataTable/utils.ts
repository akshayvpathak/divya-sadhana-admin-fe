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
  if (sticky === "left") {
    return "sticky left-0 z-10 bg-white border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]";
  }
  if (sticky === "right") {
    return "sticky right-0 z-10 bg-white border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]";
  }
  return "";
};
