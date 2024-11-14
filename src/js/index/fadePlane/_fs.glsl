precision mediump float;

varying vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_scale;
uniform float u_mixRatio;

void main(){
  vec4 textureColor = texture2D(u_texture, (v_uv - 0.5) * u_scale + 0.5);
  vec4 fadeColor = vec4(33.0 / 255.0, 33.0 / 255.0, 33.0 / 255.0, 1.0);
  gl_FragColor = mix(textureColor, fadeColor, u_mixRatio);
}
