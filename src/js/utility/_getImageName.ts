"use strict";

import { DESIGN_WIDTHS, BREAKPOINTS } from "./_variable";

export const isWebPSupported = async () => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const result = img.width === 1;
      resolve(result);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src =
      "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
  });
};

type ImageNameProps = {
  basename: string;
  extension?: string;
};

export const getImageName = ({
  basename,
  extension = "png",
}: ImageNameProps) => {
  const { medium, xlarge } = BREAKPOINTS;
  const { mobile } = DESIGN_WIDTHS;
  const dp = window.devicePixelRatio;

  // モバイル
  if (window.innerWidth < medium) {
    const suffix = `${window.innerWidth > mobile ? "@2x" : ""}`;
    const result = `${basename}${suffix}.${extension}`;
    return result;
  }

  // デスクトップ
  const suffix = `_md${dp > 1 || window.innerWidth > xlarge ? "@2x" : ""}`;
  const result = `${basename}${suffix}.${extension}`;
  return result;
};
