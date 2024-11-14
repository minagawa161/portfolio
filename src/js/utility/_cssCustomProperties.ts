"use strict";

export class CssCustomProperties {
  #currentWidth = document.documentElement.clientWidth;
  #element = document.querySelector(".js-css-custom-properties") as HTMLElement;

  constructor() {
    this.#setVw();
    this.#setScrollbarWidth();

    window.addEventListener("resize", this.#onResize);
  }

  #setVw = () => {
    const vw = document.documentElement.clientWidth * 0.01;
    document.documentElement.style.setProperty("--vw", `${vw}px`);
  };
  #setScrollbarWidth = () => {
    const scrollbarWidth = window.innerWidth - this.#element.clientWidth;
    document.documentElement.style.setProperty(
      "--scrollbar-width",
      `${scrollbarWidth}px`
    );
  };
  #onResize = () => {
    if (this.#currentWidth === document.documentElement.clientWidth) {
      return;
    }
    this.#currentWidth = document.documentElement.clientWidth;
    this.#setVw();
    this.#setScrollbarWidth();
  };
}
