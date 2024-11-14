"use strict";
import * as THREE from "three";

export const loadTexture = async (url: string): Promise<THREE.Texture> =>
  new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture: THREE.Texture) => {
        resolve(texture);
      },
      undefined,
      (error: ErrorEvent) => {
        reject(error);
      }
    );
  });
