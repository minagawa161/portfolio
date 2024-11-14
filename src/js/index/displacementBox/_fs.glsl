precision mediump float;

varying vec2 v_uv;
uniform float u_borderRange;

const float PI2 = 6.283185307179586;

void main(){
  vec2 toCenter = vec2(0.5) - v_uv;
  // 0.0 - 1.0
  float angle = (atan(toCenter.y, toCenter.x) / PI2) + 0.5;
  vec4 color = vec4(angle, 0.0, 0.0, 1.0);

  // 0に近い値になるほど縁に近い
  float edgeDetection = min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y));
  color = mix(vec4(0.0, 1.0, 0.0, 1.0), color, smoothstep(0.0, u_borderRange, edgeDetection));

  gl_FragColor = color;
}
