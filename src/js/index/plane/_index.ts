"use strict";

import * as THREE from "three";

import vertexShader from "./_vs.glsl";
import fragmentShader from "./_fs.glsl";

import { uniforms } from "../_config";

export class Plane extends THREE.Mesh<
  THREE.PlaneGeometry,
  THREE.RawShaderMaterial
> {
  private rect: DOMRect;
  constructor({
    rect,
    texture0,
    texture1,
    displacement,
  }: {
    rect: DOMRect;
    texture0: THREE.Texture | null;
    texture1: THREE.Texture | null;
    displacement: THREE.Texture | null;
  }) {
    const geometry = new THREE.PlaneGeometry(1, 1);

    const MATERIAL_PARAM = {
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        ...uniforms,
        u_displayProgress: {
          value: 0.0,
        },
        u_progress: {
          value: 0.0,
        },
        u_detailProgress: {
          value: 0.0,
        },
        u_texture0: {
          value: texture0,
        },
        u_texture1: {
          value: texture1,
        },
        u_displacement: {
          value: displacement,
        },
        u_displacementIntensity: {
          value: 0.05,
        },
        u_noiseIntensity: {
          value: 0.0,
        },
      },
    };
    const material = new THREE.RawShaderMaterial(MATERIAL_PARAM);
    super(geometry, material);

    this.rect = rect;
    this.#setScale();
  }

  #setRect = (rect: DOMRect) => {
    this.rect = rect;
  };

  #setScale = () => {
    const length = this.rect.width * 0.5 * Math.sqrt(2);
    this.scale.set(length, length, length);
  };

  #setUniformResolution = () => {
    this.material.uniforms.u_resolution.value.x =
      document.documentElement.clientWidth * window.devicePixelRatio;
    this.material.uniforms.u_resolution.value.y =
      window.innerHeight * window.devicePixelRatio;
  };

  onResize = (rect: DOMRect) => {
    this.#setRect(rect);
    // this.#setPosition();
    this.#setScale();
    this.#setUniformResolution();
  };

  update = () => {};
}
