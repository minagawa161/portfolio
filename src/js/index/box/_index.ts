"use strict";

import * as THREE from "three";

import vertexShader from "./_vs.glsl";
import fragmentShader from "./_fs.glsl";

import { uniforms } from "../_config";

export class Box extends THREE.Mesh<
  THREE.BoxGeometry,
  THREE.RawShaderMaterial
> {
  private rect: DOMRect;
  readonly side: THREE.Side;
  private camera: THREE.PerspectiveCamera;

  constructor({
    rect,
    side = THREE.FrontSide,
    camera,
  }: {
    rect: DOMRect;
    side: THREE.Side;
    camera: THREE.PerspectiveCamera;
  }) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const MATERIAL_PARAM = {
      vertexShader,
      fragmentShader,
      transparent: true,
      side,
      uniforms: {
        ...uniforms,
        u_cameraFar: {
          value: camera.far,
        },
        u_side: {
          value: side,
        },
        u_texture: {
          value: null,
        },
        u_specularLightVector: {
          value: new THREE.Vector3(0.0, 0.0, camera.far),
        },
        u_diffuseLightVector: {
          value: new THREE.Vector3(0.0, 0.0, camera.far),
        },
        u_ambientLightColor: {
          value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0),
        },
        u_specularIntensity: {
          value: 0.0,
        },
        u_refractVector: {
          value: new THREE.Vector3(0.0, 0.0, 0.0),
        },
        u_ior: {
          value: 1.0,
        },
        u_colorAberrationAmp: {
          value: 0.0,
        },
        u_refractPower: {
          value: 0.8,
        },
        u_chromaticAberration: {
          value: 0.3,
        },
        u_fresnelColor: {
          value: new THREE.Vector4(0.0, 0.0, 0.0, 1.0),
        },
        u_lineLength: {
          value: 0.001,
        },
        u_lineColor: {
          value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0),
        },
        u_detailProgress: {
          value: 0.0,
        },
      },
    };
    const material = new THREE.RawShaderMaterial(MATERIAL_PARAM);
    super(geometry, material);

    this.rect = rect;
    this.side = side;
    this.camera = camera;

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

  #setUniformResolution = () => {
    this.material.uniforms.u_resolution.value.x =
      document.documentElement.clientWidth * window.devicePixelRatio;
    this.material.uniforms.u_resolution.value.y =
      window.innerHeight * window.devicePixelRatio;
  };
  #setUniformCameraFar = () => {
    this.material.uniforms.u_cameraFar.value = this.camera.far;
  };

  onResize = (rect: DOMRect) => {
    this.#setRect(rect);
    this.#setPosition();
    this.#setScale();
    this.#setUniformResolution();
    this.#setUniformCameraFar();
  };
}
