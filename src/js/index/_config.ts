export const uniforms = {
  u_resolution: {
    value: {
      x: document.documentElement.clientWidth * window.devicePixelRatio,
      y: window.innerHeight * window.devicePixelRatio,
    },
  },
  u_time: {
    value: 0,
  },
  u_mouse: {
    value: {
      x: 0,
      y: 0,
    },
  },
};
