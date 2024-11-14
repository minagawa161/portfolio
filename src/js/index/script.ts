"use strict";

import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { BREAKPOINTS } from "../utility/_variable";
const { medium } = BREAKPOINTS;
import { CssCustomProperties } from "../utility/_cssCustomProperties";

import { Stage } from "./_stage";
import { Box } from "./box/_index";
import { DisplacementBox } from "./displacementBox/_index";
import { Plane } from "./plane/_index";
import { FadePlane } from "./fadePlane/_index";
import { ResultPlane } from "./resultPlane/_index";
import { isWebPSupported, getImageName } from "../utility/_getImageName";
import { loadTexture } from "../utility/webgl/_loadTexture";
import { Modal } from "../utility/_modal";

const initializeGsap = () => {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({
    ease: "power2.out",
    duration: 1,
  });
};

const initializeKv = async () => {
  try {
    // 画像の読み込み
    const imageExtension = (await isWebPSupported()) ? "png.webp" : "png";
    const imageUrls = [
      "./img/common/logo_1.svg",
      ...Array.from(
        { length: 2 },
        (_, i) =>
          `./img/index/${getImageName({
            basename: `img_index_${i + 1}`,
            extension: imageExtension,
          })}`
      ),
    ];
    const texturePromises: Promise<THREE.Texture>[] = imageUrls.map((url) =>
      loadTexture(url)
    );
    const textures: THREE.Texture[] = await Promise.all(texturePromises);
    const initializeTextures = () => {
      textures.forEach((texture) => {
        texture.minFilter = THREE.LinearFilter;
      });
    };
    initializeTextures();

    const canvas = document.querySelector(".js-canvas") as HTMLCanvasElement;
    const stage = new Stage({ canvas });
    const { scene, renderer, camera, clock, raycaster } = stage;
    const mouse = {
      x: 0,
      y: 0,
    };
    const normalizedMouse = {
      x: 0,
      y: 0,
    };
    let currentIndex = 0;
    let animating = true;
    let isIntersectingBox = false;

    let currentWidth = document.documentElement.clientWidth;
    let currentHeight = window.innerHeight;

    // WebGLRenderTarget
    const displacementBoxRenderTarget = new THREE.WebGLRenderTarget();
    const backgroundRenderTarget = new THREE.WebGLRenderTarget();
    const backsideRenderTarget = new THREE.WebGLRenderTarget();
    let fluidRenderTarget0 = new THREE.WebGLRenderTarget();
    let fluidRenderTarget1 = new THREE.WebGLRenderTarget();
    const setRenderTargetsSize = () => {
      const width = currentWidth * window.devicePixelRatio;
      const height = currentHeight * window.devicePixelRatio;
      displacementBoxRenderTarget.setSize(width, height);
      backgroundRenderTarget.setSize(width, height);
      backsideRenderTarget.setSize(width, height);
      fluidRenderTarget0.setSize(width, height);
      fluidRenderTarget1.setSize(width, height);
    };
    setRenderTargetsSize();

    // mesh
    const cubeElement = document.querySelector(".js-cube") as HTMLElement;
    let cubeRect = cubeElement.getBoundingClientRect();
    // planeのテクスチャとして使い、立方体の色をもとにuvを変える
    const displacementBox = new DisplacementBox({
      rect: cubeRect,
      side: THREE.FrontSide,
    });
    // 立方体の中のplane
    const plane = new Plane({
      rect: cubeRect,
      texture0: null,
      texture1: textures[0],
      displacement: displacementBoxRenderTarget.texture,
    });
    scene.add(plane);
    // 外側に見えてるbox
    const box = new Box({
      rect: cubeRect,
      side: THREE.FrontSide,
      camera,
    });
    scene.add(box);
    const fadePlane = new FadePlane({
      texture: fluidRenderTarget0.texture,
    });
    const resultPlane = new ResultPlane({
      texture: fluidRenderTarget1.texture,
    });

    // ui
    // stalker
    const stalkerElement = document.querySelector(".js-stalker") as HTMLElement;
    let stalkerRect = stalkerElement.getBoundingClientRect();
    const displayStalkerElement = () => {
      return gsap.to(stalkerElement, {
        clipPath: "circle(50% at 50% 50%)",
        duration: 0.35,
        overwrite: "auto",
      });
    };
    const hideStalkerElement = () => {
      return gsap.to(stalkerElement, {
        clipPath: "circle(0% at 50% 50%)",
        duration: 0.35,
        overwrite: "auto",
      });
    };
    // scrollDown
    const scrollDownElement = document.querySelector(
      ".js-scroll-down"
    ) as HTMLElement;
    const displayScrollDownElement = () => {
      return gsap.to(scrollDownElement, {
        ease: "power2.out",
        duration: 0.5,
        autoAlpha: 1,
        overwrite: "auto",
      });
    };
    const hideScrollDownElement = () => {
      return gsap.to(scrollDownElement, {
        ease: "power2.out",
        duration: 0.5,
        autoAlpha: 0,
        overwrite: "auto",
      });
    };
    // pagination
    const paginationElement = document.querySelector(
      ".js-pagination"
    ) as HTMLElement;
    const displayPaginationElement = () => {
      return gsap.to(paginationElement, {
        duration: 1,
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      });
    };
    const hidePaginationElement = () => {
      return gsap.to(paginationElement, {
        duration: 1,
        clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      });
    };
    // number
    const numberElement = document.querySelector(".js-number") as HTMLElement;
    let numberYPercent = 0;
    const modalElements = document.querySelectorAll<HTMLElement>(".js-modal");

    const onMousemove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;

      normalizedMouse.x = (mouse.x / currentWidth) * 2.0 - 1.0;
      normalizedMouse.y = ((mouse.y / currentHeight) * 2.0 - 1.0) * -1.0;

      const intersectBox = () => {
        const v = new THREE.Vector2(normalizedMouse.x, normalizedMouse.y);
        raycaster.setFromCamera(v, camera);
        const intersects = raycaster.intersectObject(box);
        isIntersectingBox = intersects.length !== 0;
      };
      intersectBox();
    };

    // 最初のアニメーション
    // 常に回転
    const createRotateBoxTl = () => {
      const tl = gsap.timeline({
        defaults: {
          repeat: -1,
          ease: "none",
          duration: 35,
        },
      });
      tl.to(
        displacementBox.rotation,
        {
          x: Math.PI * 2,
          y: Math.PI * 2,
        },
        0
      );
      tl.to(
        box.rotation,
        {
          x: Math.PI * 2,
          y: Math.PI * 2,
        },
        0
      );
      return tl;
    };
    const rotateBoxTl = createRotateBoxTl();
    const createDisplayTl = () => {
      const tl = gsap.timeline({
        defaults: {
          duration: 2.2,
        },
        onComplete: () => {
          observer.enable();
          animating = false;
          window.addEventListener("mousemove", onMousemove);
          displayScrollDownElement();
        },
      });
      tl.set(
        plane.material.uniforms.u_progress,
        {
          value: 1,
        },
        0
      );
      tl.to(
        plane.material.uniforms.u_displayProgress,
        {
          value: 1,
        },
        0
      );
      tl.from(
        plane.material.uniforms.u_displacementIntensity,
        {
          value: 0.5,
        },
        0
      );
      tl.from(
        plane.material.uniforms.u_noiseIntensity,
        {
          value: 1.0,
        },
        0
      );
      tl.from(
        displacementBox.material.uniforms.u_borderRange,
        {
          value: 0.5,
        },
        0
      );
      tl.to(
        box.material.uniforms.u_specularIntensity,
        {
          value: 0.1,
        },
        0
      );
      tl.from(rotateBoxTl, {
        timeScale: 3,
      });
      return tl;
    };
    createDisplayTl();

    // observer, modal, メニューのボタンで使うアニメーション
    const createCommonChangeSectionTl = (nextIndex: number) => {
      const texture0 = textures[currentIndex];
      const texture1 = textures[nextIndex];

      const onStart = () => {
        animating = true;
        gsap.set(plane.material.uniforms.u_texture0, {
          value: texture0,
        });
        gsap.set(plane.material.uniforms.u_texture1, {
          value: texture1,
        });
      };
      const onComplete = () => {
        currentIndex = nextIndex;
        animating = false;

        // stalker
        gsap.to(stalkerElement, {
          opacity: 1,
          overwrite: "auto",
        });
      };

      const tl = gsap.timeline({
        onStart,
        onComplete,
      });

      numberYPercent +=
        ((nextIndex - currentIndex) / modalElements.length) * -100;
      tl.to(
        numberElement,
        {
          ease: "power2.inOut",
          duration: 1.5,
          yPercent: numberYPercent,
        },
        0
      );

      // stalker
      tl.to(
        stalkerElement,
        {
          opacity: 0.1,
          overwrite: "auto",
        },
        0
      );

      return tl;
    };

    const createLogoToSiteTl = ({
      fresnelColor = new THREE.Vector4(0.0, 0.0, 0.0, 1.0),
    }: {
      fresnelColor?: THREE.Vector4;
    } = {}) => {
      const tl = gsap.timeline({
        paused: true,
        defaults: {
          duration: 2,
          ease: "power1.inOut",
        },
      });

      // box
      // rotate
      const rotateBoxTlTimeRemap = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });
      rotateBoxTlTimeRemap.to(rotateBoxTl, {
        duration: 1,
        timeScale: 4,
      });
      rotateBoxTlTimeRemap.to(rotateBoxTl, {
        duration: 2,
        timeScale: 1.5,
      });
      tl.to(
        rotateBoxTlTimeRemap,
        {
          ease: "none",
          progress: 1,
        },
        0
      );
      // refract
      tl.to(
        box.material.uniforms.u_refractVector.value,
        {
          z: -0.9,
        },
        0
      );
      tl.to(
        box.material.uniforms.u_ior,
        {
          value: 1.1,
        },
        0
      );
      tl.to(
        box.material.uniforms.u_colorAberrationAmp,
        {
          value: 0.001,
        },
        0
      );
      // fresnel
      tl.to(
        box.material.uniforms.u_fresnelColor.value,
        {
          x: fresnelColor.x,
          y: fresnelColor.y,
          z: fresnelColor.z,
          w: fresnelColor.w,
        },
        0
      );
      // ambientLight
      const boxAmbientLightColorTl = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });
      boxAmbientLightColorTl.to(
        box.material.uniforms.u_ambientLightColor.value,
        {
          duration: 1,
          x: 0.3,
          y: 0.3,
          z: 0.3,
          w: 0.3,
        },
        2.0
      );
      boxAmbientLightColorTl.to(
        box.material.uniforms.u_ambientLightColor.value,
        {
          duration: 2,
          x: 0.1,
          y: 0.1,
          z: 0.1,
          w: 0.1,
        }
      );
      tl.to(
        boxAmbientLightColorTl,
        {
          ease: "none",
          progress: 1,
        },
        0
      );
      // fadePlane
      tl.to(
        fadePlane.material.uniforms.u_scale,
        {
          ease: "back.inOut(20)",
          value: 0.98,
        },
        0
      );
      tl.to(
        fadePlane.material.uniforms.u_mixRatio,
        {
          value: 0.4,
        },
        0
      );

      // plane
      // progress
      tl.set(
        plane.material.uniforms.u_progress,
        {
          value: 0,
        },
        0
      );
      tl.to(
        plane.material.uniforms.u_progress,
        {
          value: 1,
        },
        0
      );

      // ui
      tl.add(hideScrollDownElement(), 0);

      return tl;
    };

    const createSiteToLogoTl = ({
      fresnelColor = new THREE.Vector4(0.0, 0.0, 0.0, 1.0),
      ambientLightColor = new THREE.Vector4(0.0, 0.0, 0.0, 0.0),
      duration = 2,
      ease = "power2.inOut",
      onComplete = () => {
        displayScrollDownElement();
      },
    }: {
      fresnelColor?: THREE.Vector4;
      ambientLightColor?: THREE.Vector4;
      ease?: string | gsap.EaseFunction | undefined;
      duration?: number;
      onComplete?: gsap.Callback | undefined;
    } = {}) => {
      const tl = gsap.timeline({
        paused: true,
        defaults: {
          duration,
          ease,
        },
        onComplete,
      });

      // box
      // rotate
      tl.to(rotateBoxTl, {
        timeScale: 1,
      });
      // refract
      tl.to(
        box.material.uniforms.u_refractVector.value,
        {
          z: 0,
        },
        0
      );
      tl.to(
        box.material.uniforms.u_ior,
        {
          value: 1.0,
        },
        0
      );
      tl.to(
        box.material.uniforms.u_colorAberrationAmp,
        {
          value: 0,
        },
        0
      );
      // fresnel
      tl.to(
        box.material.uniforms.u_fresnelColor.value,
        {
          x: fresnelColor.x,
          y: fresnelColor.y,
          z: fresnelColor.z,
          w: fresnelColor.w,
        },
        0
      );
      // ambientLight
      tl.to(
        box.material.uniforms.u_ambientLightColor.value,
        {
          x: ambientLightColor.x,
          y: ambientLightColor.y,
          z: ambientLightColor.z,
          w: ambientLightColor.w,
        },
        0
      );
      // fadePlane
      tl.to(
        fadePlane.material.uniforms.u_scale,
        {
          value: 1.0,
        },
        0
      );
      tl.to(
        fadePlane.material.uniforms.u_mixRatio,
        {
          value: 0.575,
        },
        0
      );

      // plane
      // progress
      tl.set(
        plane.material.uniforms.u_progress,
        {
          value: 0,
        },
        0
      );
      tl.to(
        plane.material.uniforms.u_progress,
        {
          value: 1,
        },
        0
      );

      return tl;
    };

    const createSiteToSiteTl = () => {
      const tl = gsap.timeline({
        paused: true,
        defaults: {
          ease: "power1.inOut",
          duration: 2,
        },
      });

      // box
      // rotate
      const rotateBoxTlTimeRemap = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });
      rotateBoxTlTimeRemap.to(rotateBoxTl, {
        duration: 1,
        timeScale: 4,
      });
      rotateBoxTlTimeRemap.to(rotateBoxTl, {
        duration: 2,
        timeScale: 1.5,
      });
      tl.to(
        rotateBoxTlTimeRemap,
        {
          ease: "none",
          progress: 1,
        },
        0
      );
      // ambientLight
      const boxAmbientLightColorTl = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });
      boxAmbientLightColorTl.to(
        box.material.uniforms.u_ambientLightColor.value,
        {
          duration: 1,
          x: 0.3,
          y: 0.3,
          z: 0.3,
          w: 0.3,
        },
        0.8
      );
      boxAmbientLightColorTl.to(
        box.material.uniforms.u_ambientLightColor.value,
        {
          duration: 1.5,
          x: 0.1,
          y: 0.1,
          z: 0.1,
          w: 0.1,
        }
      );
      tl.to(
        boxAmbientLightColorTl,
        {
          ease: "none",
          progress: 1,
        },
        0
      );

      // fadePlane
      const fadePlaneTl = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });
      fadePlaneTl.to(fadePlane.material.uniforms.u_scale, {
        value: 0.965,
      });
      fadePlaneTl.to(fadePlane.material.uniforms.u_scale, {
        value: 0.98,
      });
      tl.to(
        fadePlaneTl,
        {
          ease: "none",
          progress: 1,
        },
        0
      );

      // plane
      // progress
      tl.set(
        plane.material.uniforms.u_progress,
        {
          value: 0,
        },
        0
      );
      tl.to(
        plane.material.uniforms.u_progress,
        {
          value: 1,
        },
        0
      );

      return tl;
    };

    // observer
    const createObserver = () => {
      type TimelineItem = {
        next: gsap.core.Timeline;
        prev?: gsap.core.Timeline;
      };
      const tls: TimelineItem[] = [
        {
          next: createLogoToSiteTl(),
        },
        ...Array.from({ length: imageUrls.length - 1 }, (_, i) =>
          i === 0
            ? {
                prev: createSiteToLogoTl(),
                next: createSiteToSiteTl(),
              }
            : {
                next: createSiteToSiteTl(),
              }
        ),
      ];

      const changeSection = (index: number) => {
        if (animating) {
          return;
        }
        const nextIndex = index;
        const tl = createCommonChangeSectionTl(nextIndex);
        const activeTl =
          nextIndex > currentIndex
            ? tls[currentIndex].next
            : tls[currentIndex].prev || tls[currentIndex].next;
        tl.add(activeTl.play(), 0);
      };
      const onDown = () => {
        const index = currentIndex - 1;
        if (index < 0) {
          return;
        }
        changeSection(index);
      };
      const onUp = () => {
        const index = currentIndex + 1;
        if (index > textures.length - 1) {
          return;
        }
        changeSection(index);
      };
      const observerVars = {
        target: window,
        type: "wheel, touch",
        wheelSpeed: -1,
        tolerance: 10,
        preventDefault: true, // macOS safariでスクロールできる要素が次だった時、アニメーションが終わる前にスクロールできてしまうのを防ぐ
        onDown,
        onUp,
      };
      const observer = ScrollTrigger.observe(observerVars);
      // アニメーションが終わったらobserver.enable();を実行する
      observer.disable();

      return observer;
    };
    const observer = createObserver();

    // modal
    const initializeModal = () => {
      const createCommonOpenModalTl = ({
        onStart = () => {
          animating = true;
          // observerを停止
          observer.disable();
        },
        onComplete = () => {
          animating = false;
        },
      }: {
        onStart?: gsap.Callback | undefined;
        onComplete?: gsap.Callback | undefined;
      } = {}) => {
        const tl = gsap.timeline({
          paused: true,
          defaults: {
            duration: 1,
          },
          onStart,
          onComplete,
        });
        // box
        tl.to(
          box.material.uniforms.u_detailProgress,
          {
            ease: "power1.inOut",
            value: 1,
          },
          0
        );
        // line
        tl.to(
          box.material.uniforms.u_lineLength,
          {
            value: 0.0,
          },
          0
        );
        // plane
        tl.to(
          plane.material.uniforms.u_detailProgress,
          {
            ease: "power1.inOut",
            value: 1,
          },
          0.1
        );
        tl.set(plane.material.uniforms.u_detailProgress, {
          value: 0,
        });

        // ui
        tl.add(hidePaginationElement(), 0);
        tl.to(
          stalkerElement,
          {
            clipPath: "circle(0% at 50% 50%)",
            duration: 0.35,
            overwrite: "auto",
          },
          0
        );
        tl.add(hideScrollDownElement(), 0);

        return tl;
      };
      const createOpenWorkModalTl = ({ modal }: { modal: Modal }) => {
        const tl = gsap.timeline({
          paused: true,
          defaults: {
            duration: 1.8,
            ease: "power4.inOut",
          },
          onStart: () => {
            // モーダルを開く
            modal.openModal();
          },
        });
        const subHeading = modal.wrapper.querySelector(
          ".js-sub-heading"
        ) as HTMLElement;
        const headings =
          modal.wrapper.querySelectorAll<HTMLElement>(".js-heading");
        const figWrapper = modal.wrapper.querySelector(
          ".js-fig-wrapper"
        ) as HTMLElement;
        const img = modal.wrapper.querySelector(".js-img") as HTMLImageElement;
        const others = modal.wrapper.querySelectorAll<HTMLElement>(".js-other");

        tl.fromTo(
          modal.wrapper,
          {
            autoAlpha: 0,
          },
          {
            ease: "power2.out",
            autoAlpha: 1,
          },
          0
        );
        tl.from(
          subHeading,
          {
            ease: "power2.out",
            filter: "blur(5px)",
          },
          0
        );
        headings.forEach((heading, index) => {
          const xPercent =
            2 *
            ((index % (headings.length / 2)) + 1 * 2) *
            (index < headings.length / 2 ? -1 : 1);

          tl.from(
            heading,
            {
              xPercent,
              opacity: 0,
            },
            0
          );
        });
        tl.from(
          figWrapper,
          {
            opacity: 0,
            clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
          },
          0
        );
        tl.from(
          img,
          {
            scaleX: 1.2,
            scaleY: 1.4,
          },
          0
        );
        tl.from(
          others,
          {
            duration: 1,
            ease: "power2.out",
            opacity: 0,
          },
          0.8
        );

        return tl;
      };
      const createOpenAboutModalTl = ({ modal }: { modal: Modal }) => {
        const tl = gsap.timeline({
          paused: true,
          defaults: {
            duration: 1.8,
            ease: "power4.inOut",
          },
          onStart: () => {
            modal.openModal();
          },
        });
        const headingWrappers = modal.wrapper.querySelectorAll<HTMLElement>(
          ".js-heading-wrapper"
        );
        const figWrapper = modal.wrapper.querySelector(
          ".js-fig-wrapper"
        ) as HTMLElement;

        const others = modal.wrapper.querySelectorAll<HTMLElement>(".js-other");

        tl.fromTo(
          modal.wrapper,
          {
            autoAlpha: 0,
          },
          {
            ease: "power2.out",
            autoAlpha: 1,
          },
          0
        );

        headingWrappers.forEach((item, index) => {
          const heading = item.querySelector(".js-heading") as HTMLElement;

          tl.from(
            heading,
            {
              ease: "power2.out",
              filter: "blur(5px)",
            },
            0
          );
          if (index === 0) {
            return;
          }
          const yPercent =
            50 *
            (((index - 1) % ((headingWrappers.length - 1) / 2)) + 1) *
            (index - 1 < (headingWrappers.length - 1) / 2 ? -1 : 1);

          tl.set(
            item,
            {
              zIndex: -index,
            },
            0
          );

          tl.from(
            item,
            {
              yPercent,
            },
            0
          );
        });
        tl.from(
          figWrapper,
          {
            opacity: 0,
            yPercent: 75,
            rotateZ: 20,
            ease: "power2.inOut",
          },
          0
        );
        tl.from(
          others,
          {
            duration: 1,
            ease: "power2.out",
            opacity: 0,
          },
          0.8
        );

        return tl;
      };
      const createCloseModalTl = ({
        modal,
        onStart = () => {
          modal.closeModal();
        },
      }: {
        modal: Modal;
        onStart?: gsap.Callback | undefined;
      }) => {
        const tl = gsap.timeline({
          paused: true,
          defaults: {
            duration: 0.5,
            ease: "power2.out",
          },
          onStart,
        });

        tl.to(
          modal.wrapper,
          {
            autoAlpha: 0,
          },
          0
        );

        if (currentIndex === 0) {
          tl.add(displayScrollDownElement(), 0);
        }

        return tl;
      };
      const createDisplayBoxTl = () => {
        const tl = gsap.timeline({
          paused: true,
          defaults: {
            ease: "power2.inOut",
            duration: 2,
          },
        });
        tl.to(
          box.material.uniforms.u_detailProgress,
          {
            value: 0,
          },
          0
        );
        // line
        tl.to(
          box.material.uniforms.u_lineLength,
          {
            value: 0.002,
          },
          0
        );
        return tl;
      };

      const modals = Array.from(modalElements).map((element, index) => {
        const modal = new Modal(element);

        // モーダル内の閉じるボタンをクリックした時の処理
        const closeButtons = element.querySelectorAll<HTMLElement>(
          ".js-modal-close-button"
        );
        closeButtons.forEach((button) => {
          button.addEventListener("click", () => {
            const tl = gsap.timeline({
              onStart: () => {
                animating = true;
              },
              onComplete: () => {
                observer.enable();
                animating = false;
              },
            });
            tl.add(createDisplayBoxTl().play(), 0);
            tl.add(createCloseModalTl({ modal }).play(), 0);

            // ui
            tl.add(displayPaginationElement(), 0);
          });
        });

        // モーダル内のnext, prevボタンをクリックした時の処理
        const navButtons = element.querySelectorAll<HTMLElement>(
          ".js-modal-nav-button"
        );
        navButtons.forEach((button) => {
          button.addEventListener("click", () => {
            const nextIndex = Number(button.dataset.index);
            if (index === nextIndex) {
              return;
            }
            const currentModal = modals[index];
            const nextModal = modals[nextIndex];

            const tl = gsap.timeline({
              onStart: () => {
                animating = true;
              },
              onComplete: () => {
                animating = false;
              },
            });
            tl.add(
              createCloseModalTl({
                modal: currentModal,
                onStart: () => {
                  const texture1 = textures[nextIndex];
                  gsap.set(plane.material.uniforms.u_texture1, {
                    value: texture1,
                  });
                  numberYPercent =
                    (nextIndex / modalElements.length) * 100 * -1;
                  tl.set(
                    numberElement,
                    {
                      yPercent: numberYPercent,
                    },
                    0
                  );
                  currentIndex = nextIndex;
                  modal.closeModal();
                },
              }).play()
            );
            tl.add(createOpenWorkModalTl({ modal: nextModal }).play());
          });
        });

        return modal;
      });
      const menuModalElement = document.querySelector(
        ".js-menu-modal"
      ) as HTMLElement;
      const menuModal = new Modal(menuModalElement);

      const initializeMenu = () => {
        const menuButtonElement = document.querySelector(
          ".js-menu-button"
        ) as HTMLElement;
        const headerElement = document.querySelector(
          ".js-header"
        ) as HTMLElement;
        // menuボタンをクリックしたときの処理
        const toggleMenuModal = () => {
          if (window.innerWidth < medium) {
            headerElement.classList.toggle("is-active");
            if (menuModal.isActive) {
              menuModal.closeModal();
              return;
            }
            menuModal.openModal();
          }
        };
        menuButtonElement.addEventListener("click", toggleMenuModal);

        const restoreParams = () => {
          const nextIndex = 0;
          // box
          gsap.set(rotateBoxTl, {
            timeScale: 1,
          });
          gsap.set(box.material.uniforms.u_refractVector.value, {
            z: 0,
          });
          gsap.set(box.material.uniforms.u_ior, {
            value: 1.0,
          });
          gsap.set(box.material.uniforms.u_colorAberrationAmp, {
            value: 0,
          });
          // fresnel
          const fresnelColor = new THREE.Vector4(0.0, 0.0, 0.0, 1.0);
          const ambientLightColor = new THREE.Vector4(0.0, 0.0, 0.0, 0.0);
          gsap.set(box.material.uniforms.u_fresnelColor.value, {
            x: fresnelColor.x,
            y: fresnelColor.y,
            z: fresnelColor.z,
            w: fresnelColor.w,
          });
          gsap.set(box.material.uniforms.u_ambientLightColor.value, {
            x: ambientLightColor.x,
            y: ambientLightColor.y,
            z: ambientLightColor.z,
            w: ambientLightColor.w,
          });
          // fadePlane
          gsap.set(fadePlane.material.uniforms.u_scale, {
            value: 1.0,
          });
          gsap.set(fadePlane.material.uniforms.u_mixRatio, {
            value: 0.575,
          });
          // plane
          // progress
          const texture1 = textures[nextIndex];
          gsap.set(plane.material.uniforms.u_texture1, {
            value: texture1,
          });
          gsap.set(plane.material.uniforms.u_progress, {
            value: 1,
          });

          // ui
          numberYPercent = 0;
          gsap.set(numberElement, {
            yPercent: numberYPercent,
          });

          currentIndex = nextIndex;
        };
        // homeボタンをクリックしたときの処理
        const menuHomeButtonElement = document.querySelector(
          ".js-menu-home-button"
        ) as HTMLElement;
        const onClickMenuHomeButton = () => {
          if (animating) {
            return;
          }
          toggleMenuModal();
          const currentModal = modals[currentIndex];
          if (currentModal.isActive) {
            const tl = gsap.timeline({
              onStart: () => {
                animating = true;
                restoreParams();
              },
              onComplete: () => {
                observer.enable();
                animating = false;
                displayScrollDownElement();
              },
            });
            tl.add(createDisplayBoxTl().play(), 0);
            tl.add(createCloseModalTl({ modal: currentModal }).play(), 0);

            // ui
            tl.add(displayPaginationElement(), 0);

            return;
          }

          if (currentIndex === 0) {
            return;
          }
          const tl = createCommonChangeSectionTl(0);
          const activeTl = createSiteToLogoTl();
          tl.add(activeTl.play(), 0);
        };
        menuHomeButtonElement.addEventListener("click", onClickMenuHomeButton);

        // aboutボタンをクリックしたときの処理
        const menuAboutButtonElement = document.querySelector(
          ".js-menu-about-button"
        ) as HTMLElement;
        const onClickMenuAboutButton = () => {
          if (animating) {
            return;
          }
          const currentModal = modals[currentIndex];
          if (currentModal.isActive) {
            toggleMenuModal();
            if (currentIndex === 0) {
              return;
            }
            const nextModal = modals[0];

            const tl = gsap.timeline({
              onStart: () => {
                animating = true;
              },
              onComplete: () => {
                animating = false;
              },
            });
            tl.add(
              createCloseModalTl({
                modal: currentModal,
                onStart: () => {
                  restoreParams();
                  currentModal.closeModal();
                },
              }).play()
            );
            tl.add(createOpenAboutModalTl({ modal: nextModal }).play());

            return;
          }

          toggleMenuModal();
          const aboutModal = modals[0];
          const aboutModalTl = createOpenAboutModalTl({ modal: aboutModal });
          if (currentIndex === 0) {
            const tl = createCommonOpenModalTl();
            tl.add(aboutModalTl.play(), 0.9);
            tl.play();
            return;
          }

          const tl = createCommonChangeSectionTl(0);
          const activeTl = createSiteToLogoTl({
            ease: "power1.inOut",
            duration: 1.5,
            onComplete: () => {},
          });
          tl.add(activeTl.play(), 0);
          const modalTl = createCommonOpenModalTl({
            onStart: () => {
              observer.disable();
            },
            onComplete: () => {},
          });
          modalTl.add(aboutModalTl.play(), 0.9);

          tl.add(modalTl.play(), 0.8);
        };
        menuAboutButtonElement.addEventListener(
          "click",
          onClickMenuAboutButton
        );
      };
      initializeMenu();

      // boxをクリックした時の処理
      const onClickBox = () => {
        const currentModal = modals[currentIndex];
        if (
          !isIntersectingBox ||
          animating ||
          currentModal.isActive ||
          menuModal.isActive
        ) {
          return;
        }

        const tl = createCommonOpenModalTl();
        const currentModalTl = currentModal.wrapper.classList.contains(
          "js-work-modal"
        )
          ? createOpenWorkModalTl({ modal: currentModal })
          : createOpenAboutModalTl({ modal: currentModal });
        tl.add(currentModalTl.play(), 0.9);
        tl.play();
      };
      window.addEventListener("click", onClickBox, true);

      const initializeStalker = () => {
        const position = {
          x: 0,
          y: 0,
        };

        // mouse
        const centerPosition = {
          x: currentWidth / 2,
          y: currentHeight / 2,
        };
        const onMousemove = (event: MouseEvent) => {
          centerPosition.x = event.x - stalkerRect.width / 2;
          centerPosition.y = event.y - stalkerRect.height / 2;
        };
        window.addEventListener("mousemove", onMousemove);

        const xSetter = gsap.quickSetter(stalkerElement, "x", "px");
        const ySetter = gsap.quickSetter(stalkerElement, "y", "px");

        const speed = 0.075;
        gsap.ticker.add(() => {
          const dt = 1.0 - Math.pow(1.0 - speed, gsap.ticker.deltaRatio());

          position.x += (centerPosition.x - position.x) * dt;
          position.y += (centerPosition.y - position.y) * dt;

          xSetter(position.x);
          ySetter(position.y);

          const setLightDirection = () => {
            const maxLength = Math.max(currentWidth, currentHeight);

            box.material.uniforms.u_specularLightVector.value.x +=
              (normalizedMouse.x * maxLength * 0.5 -
                box.material.uniforms.u_specularLightVector.value.x) *
              dt;

            box.material.uniforms.u_diffuseLightVector.value.x +=
              (normalizedMouse.x * maxLength -
                box.material.uniforms.u_diffuseLightVector.value.x) *
              dt;
            box.material.uniforms.u_diffuseLightVector.value.y +=
              (normalizedMouse.y * maxLength -
                box.material.uniforms.u_diffuseLightVector.value.y) *
              dt;
          };
          setLightDirection();

          const setPlaneRotation = () => {
            plane.rotation.x +=
              (-normalizedMouse.y * Math.PI * 0.025 - plane.rotation.x) * dt;
            plane.rotation.y +=
              (normalizedMouse.x * Math.PI * 0.025 - plane.rotation.y) * dt;
          };
          setPlaneRotation();

          const setBoxMouse = () => {
            fadePlane.material.uniforms.u_mouse.value.x +=
              (normalizedMouse.x -
                fadePlane.material.uniforms.u_mouse.value.x) *
              dt;
            fadePlane.material.uniforms.u_mouse.value.y +=
              (normalizedMouse.y -
                fadePlane.material.uniforms.u_mouse.value.y) *
              dt;
          };
          setBoxMouse();

          const currentModal = modals[currentIndex];
          if (!isIntersectingBox || currentModal.isActive) {
            hideStalkerElement();
            return;
          }

          if (animating) {
            return;
          }
          displayStalkerElement();
        });
      };
      initializeStalker();
    };
    initializeModal();

    // requestAnimationFrame
    const raf = () => {
      // 経過時間
      const elapsedTime = clock.getElapsedTime();
      displacementBox.material.uniforms.u_time.value = elapsedTime;
      plane.material.uniforms.u_time.value = elapsedTime;
      box.material.uniforms.u_time.value = elapsedTime;

      // displacementBoxRenderTarget
      renderer.setRenderTarget(displacementBoxRenderTarget);
      renderer.clearColor();
      renderer.render(displacementBox, camera);

      // backgroundRenderTarget
      // planeだけをレンダリングする
      renderer.setRenderTarget(backgroundRenderTarget);
      renderer.clearColor();
      plane.visible = true;
      renderer.render(plane, camera);

      // backsideRenderTarget
      // planeと、BackSideのboxをレンダリングする
      renderer.setRenderTarget(backsideRenderTarget);
      renderer.clearColor();
      box.material.uniforms.u_texture.value = backgroundRenderTarget.texture;
      box.visible = true;
      box.material.side = THREE.BackSide;
      box.material.uniforms.u_side.value = THREE.BackSide;
      renderer.render(scene, camera);

      // fluidRenderTarget1
      renderer.setRenderTarget(fluidRenderTarget1);
      renderer.clearColor();
      // fadePlane
      plane.visible = false;
      box.material.side = THREE.FrontSide;
      box.material.uniforms.u_side.value = THREE.FrontSide;
      fadePlane.material.uniforms.u_texture.value = fluidRenderTarget0.texture;

      box.material.uniforms.u_texture.value = null;
      renderer.render(fadePlane, camera);
      box.material.uniforms.u_texture.value = backsideRenderTarget.texture;
      renderer.render(scene, camera);

      // もとに戻す
      renderer.setRenderTarget(null);
      resultPlane.material.uniforms.u_texture.value =
        fluidRenderTarget1.texture;
      renderer.render(resultPlane, camera);

      const temp = fluidRenderTarget0;
      fluidRenderTarget0 = fluidRenderTarget1;
      fluidRenderTarget1 = temp;

      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // resize
    const onResize = () => {
      if (currentWidth === document.documentElement.clientWidth) {
        return;
      }
      currentWidth = document.documentElement.clientWidth;
      currentHeight = window.innerHeight;

      stage.onResize();

      cubeRect = cubeElement.getBoundingClientRect();
      stalkerRect = stalkerElement.getBoundingClientRect();
      setRenderTargetsSize();
      displacementBox.onResize(cubeRect);
      plane.onResize(cubeRect);
      box.onResize(cubeRect);
      fadePlane.onResize();
      resultPlane.onResize();
    };
    window.addEventListener("resize", onResize);
  } catch (error) {
    console.error("Error loading textures:", error);
  }
};

const initializeMovies = () => {
  const wrappers = document.querySelectorAll<HTMLElement>(".js-movie");
  wrappers.forEach((wrapper) => {
    const button = wrapper.querySelector(".js-button") as HTMLElement;
    const video = wrapper.querySelector(".js-video") as HTMLVideoElement;
    const onClick = () => {
      video.play();
      button.classList.add("is-active");
    };
    button.addEventListener("click", onClick);
  });
};

const onDOMContentLoaded = () => {
  new CssCustomProperties();
  initializeGsap();
  initializeKv();
  initializeMovies();
};

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
