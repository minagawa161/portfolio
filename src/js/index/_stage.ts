"use strict";

import * as THREE from "three";

export class Stage {
  readonly scene = new THREE.Scene();
  readonly #CAMERA_PARAM = {
    fov: 30.0,
    aspect: document.documentElement.clientWidth / window.innerHeight,
    near: 10.0,
  };
  get #CAMERA_DISTANCE() {
    const fovRadian = ((this.#CAMERA_PARAM.fov / 2) * Math.PI) / 180;
    const result = window.innerHeight / 2 / Math.tan(fovRadian);
    return result;
  }
  readonly #RENDERER_PARAM = {
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
  };

  readonly camera: THREE.PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;

  readonly clock = new THREE.Clock();
  readonly raycaster = new THREE.Raycaster();

  constructor({ canvas }: { canvas: HTMLCanvasElement }) {
    // camera
    this.camera = new THREE.PerspectiveCamera(
      this.#CAMERA_PARAM.fov,
      this.#CAMERA_PARAM.aspect,
      this.#CAMERA_PARAM.near,
      this.#CAMERA_DISTANCE * 2 // far
    );
    this.#initializeCamera();

    // renderer
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    // new OrbitControls(this.camera, this.renderer.domElement);
    this.#initializeRenderer();
  }
  #initializeCamera = () => {
    const x = 0.0;
    const y = 0.0;
    const z = this.#CAMERA_DISTANCE;

    this.camera.position.set(x, y, z);
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));
    this.scene.add(this.camera);
  };
  #initializeRenderer = () => {
    this.renderer.setClearColor(new THREE.Color(0x212121), 1.0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      this.#RENDERER_PARAM.width,
      this.#RENDERER_PARAM.height
    );
    this.renderer.autoClearColor = false;
  };
  #setCameraPosition = () => {
    const distance = this.#CAMERA_DISTANCE;
    this.camera.far = distance * 2;
    this.camera.position.z = distance;
  };
  #setCameraAspect = () => {
    this.camera.aspect =
      document.documentElement.clientWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };
  onResize = () => {
    this.#setCameraPosition();
    this.#setCameraAspect();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(
      document.documentElement.clientWidth,
      window.innerHeight
    );
  };
}
