"use strict";

import * as THREE from "three";

import vertexShader from "./_vs.glsl";
import fragmentShader from "./_fs.glsl";

import { uniforms } from "../_config";

export class ResultPlane extends THREE.Mesh<
  THREE.PlaneGeometry,
  THREE.RawShaderMaterial
> {
  constructor({ texture }: { texture: THREE.Texture | null }) {
    const geometry = new THREE.PlaneGeometry(1, 1);

    const MATERIAL_PARAM = {
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        ...uniforms,
        u_texture: {
          value: texture,
        },
      },
    };
    const material = new THREE.RawShaderMaterial(MATERIAL_PARAM);
    super(geometry, material);

    this.#setScale();
  }

  #setScale = () => {
    this.scale.set(
      document.documentElement.clientWidth,
      window.innerHeight,
      1.0
    );
  };

  #setUniformResolution = () => {
    this.material.uniforms.u_resolution.value.x =
      document.documentElement.clientWidth * window.devicePixelRatio;
    this.material.uniforms.u_resolution.value.y =
      window.innerHeight * window.devicePixelRatio;
  };

  onResize = () => {
    this.#setScale();
    this.#setUniformResolution();
  };

  update = () => {};
}
