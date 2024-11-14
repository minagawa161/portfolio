precision mediump float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

uniform float u_cameraFar;

varying vec3 v_position;
varying vec3 v_eyeVector;
varying vec3 v_normal;
varying vec2 v_uv;
varying float v_depth;

void main(){
  v_position = (modelMatrix * vec4(position, 1.0)).xyz;
  v_eyeVector = normalize(v_position - cameraPosition);
  v_normal = normalize(normalMatrix * normal);
  v_uv = uv;
  // 0.0 - 1.0
  v_depth = 1.0 - (length(v_position - cameraPosition) / u_cameraFar);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

