import { createCn } from "cn/config";

// Teach the merger the Stitch type scale and spacing names from globals.css.
// Without this, `text-body-sm` is read as a text color and conflicting classes get dropped.
const stitchTextSizes = [
  "display",
  "display-mobile",
  "headline-lg",
  "headline-lg-mobile",
  "headline-md",
  "headline-sm",
  "body-lg",
  "body-md",
  "body-sm",
  "label-lg",
  "label-md",
  "label-sm",
];

export const cn = createCn({
  extend: {
    theme: {
      spacing: [
        "space-xs",
        "space-sm",
        "space-md",
        "space-lg",
        "space-xl",
        "space-2xl",
        "gutter",
        "gutter-mobile",
        "margin",
        "margin-mobile",
      ],
    },
    classGroups: {
      "font-size": [{ text: stitchTextSizes }],
      "font-family": [{ font: ["heading", ...stitchTextSizes] }],
    },
  },
});
