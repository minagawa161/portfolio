"use strict";

import Lenis from "@studio-freight/lenis";

export class Modal {
  readonly wrapper;
  #lenis;
  #focusableElements;
  #state = false;
  #beforeFocusedElement: Element | null = null;

  constructor(wrapper: HTMLElement) {
    this.wrapper = wrapper;

    this.#lenis = new Lenis({
      wrapper,
      content: this.wrapper.querySelector(".js-modal-content") as HTMLElement,
    });
    requestAnimationFrame(this.#raf);

    window.addEventListener("keydown", this.#onKeydown);

    this.#focusableElements = this.wrapper.querySelectorAll<HTMLElement>(
      "a[href], area[href], input:not([disabled]):not([type='hidden']):not([aria-hidden]), select:not([disabled]):not([aria-hidden]), textarea:not([disabled]):not([aria-hidden]), button:not([disabled]):not([aria-hidden]), iframe, object, embed, [contenteditable], [tabindex]:not([tabindex^='-']"
    );
  }
  #raf = (time: number) => {
    this.#lenis.raf(time);
    requestAnimationFrame(this.#raf);
  };
  #changeState = (state: boolean) => {
    this.#state = state;
  };
  openModal = () => {
    this.#changeState(true);
    this.#toggleClass();
    this.#beforeFocusedElement = document.activeElement;
    this.#focusableElements[0].focus();
    this.wrapper.scrollTo(0, 0);
  };
  closeModal = () => {
    this.#changeState(false);
    this.#toggleClass();
    if (this.#beforeFocusedElement instanceof HTMLElement) {
      this.#beforeFocusedElement.focus();
    }
    this.#beforeFocusedElement = null;
  };
  #toggleClass = () => {
    this.wrapper.classList.toggle("is-active");
  };
  #onKeydown = (event: KeyboardEvent) => {
    if (!this.#state) {
      return;
    }
    if (event.code === "Escape") {
      event.preventDefault();
      this.closeModal();
      this.#toggleClass();
    }

    if (event.code === "Tab") {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === this.#focusableElements[0]) {
          event.preventDefault();
          // ダイアログ内で最初のtabableの要素の時、最後のtabableの要素にフォーカスを移す
          this.#focusableElements[this.#focusableElements.length - 1].focus();
        }

        return;
      }
      // Tab
      if (
        document.activeElement ===
        this.#focusableElements[this.#focusableElements.length - 1]
      ) {
        event.preventDefault();
        // ダイアログ内で最後のtabableの要素の時、最初のtabableの要素にフォーカスを移す
        this.#focusableElements[0].focus();
      }
    }
  };
  get isActive() {
    return this.#state;
  }
}
