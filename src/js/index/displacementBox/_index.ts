"use strict";

import * as THREE from "three";

import vertexShader from "./_vs.glsl";
import fragmentShader from "./_fs.glsl";

import { uniforms } from "../_config";

export class DisplacementBox extends THREE.Mesh<
  THREE.BoxGeometry,
  THREE.RawShaderMaterial
> {
  private rect: DOMRect;
  readonly side: THREE.Side;

  constructor({
    rect,
    side = THREE.FrontSide,
  }: {
    rect: DOMRect;
    side: THREE.Side;
  }) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const MATERIAL_PARAM = {
      vertexShader,
      fragmentShader,
      transparent: true,
      side,
      uniforms: {
        ...uniforms,
        u_borderRange: {
          value: 0.1,
        },
      },
    };
    const material = new THREE.RawShaderMaterial(MATERIAL_PARAM);
    super(geometry, material);

    this.rect = rect;
    this.side = side;

    this.#setPosition();
    this.#setScale();
  }
  #setRect = (rect: DOMRect) => {
    this.rect = rect;
  };

  #setPosition = () => {
    const length = this.rect.width;
    const z = -length / 2;
    this.position.set(0.0, 0.0, z);
  };

  #setScale = () => {
    const length = this.rect.width;
    this.scale.set(length, length, length);
  };

  // いらないかも
  #setUniformResolution = () => {
    this.material.uniforms.u_resolution.value.x =
      document.documentElement.clientWidth * window.devicePixelRatio;
    this.material.uniforms.u_resolution.value.y =
      window.innerHeight * window.devicePixelRatio;
  };

  onResize = (rect: DOMRect) => {
    this.#setRect(rect);
    this.#setPosition();
    this.#setScale();
    this.#setUniformResolution();
  };
}
