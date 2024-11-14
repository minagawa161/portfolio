precision mediump float;

const float PI2 = 6.283185307179586;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_displayProgress;
uniform float u_displacementIntensity;
uniform float u_progress;
uniform float u_detailProgress;

varying vec2 v_uv;

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform sampler2D u_displacement;
uniform float u_noiseIntensity;

#pragma glslify: snoise = require(glsl-noise/simplex/3d);

void main(){
  vec2 st = gl_FragCoord.xy / u_resolution;

  float div = 8.0;
  float nx = ceil(v_uv.x * div) / div;
  float ny = ceil(v_uv.y * div) / div;
  float nScale = 4.0;
  float n = snoise(vec3(nx * nScale, ny * nScale, 1.0));
  vec2 uvDisplaced = vec2(v_uv.x + n * u_noiseIntensity, v_uv.y + n * u_noiseIntensity);

  vec4 displacement = texture2D(u_displacement, st);
  vec2 direction = vec2(cos(displacement.r * PI2), sin(displacement.r * PI2));

  vec2 uv = vec2(
    uvDisplaced.x + displacement.g * direction.x * u_displacementIntensity,
    uvDisplaced.y + displacement.g * direction.y * u_displacementIntensity
  );

  vec2 direction1 = vec2(-0.5, 1.0);
  float smoothness = 1.0;
  vec2 center = vec2(0.5, 0.5);
  vec2 v = normalize(direction1);
  v /= abs(v.x) + abs(v.y);
  float d = v.x * center.x + v.y * center.y;
  float m = 1.0 - smoothstep(-smoothness, 0.0, v.x * uv.x + v.y * uv.y - (d - 0.5 + u_progress * (1.0 + smoothness)));
  vec4 color = mix(texture2D(u_texture0, (uv - 0.5) * (1.0 - m) + 0.5), texture2D(u_texture1, (uv - 0.5) * m + 0.5), m);

  color = vec4(color.rgb, color.a * u_displayProgress);
  color = mix(color, vec4(0.0), step(v_uv.y, u_detailProgress));

  gl_FragColor = color;
}
