export const DESIGN_WIDTHS = {
  mobile: 390,
  desktop: 1440,
};

const { mobile, desktop } = DESIGN_WIDTHS;

export const BREAKPOINTS = {
  small: mobile * 1.5,
  medium: desktop * 0.75,
  large: desktop,
  xlarge: desktop * 1.25,
};
