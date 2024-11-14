precision highp float;

// varying
varying vec3 v_eyeVector;
varying vec3 v_normal;
varying vec2 v_uv;
varying float v_depth;

// uniform
uniform vec2 u_resolution;
uniform float u_time;
uniform int u_side;
uniform sampler2D u_texture;
uniform float u_detailProgress;
// refract
uniform vec3 u_refractVector;
uniform float u_ior;
uniform float u_colorAberrationAmp;
uniform float u_chromaticAberration;
uniform float u_refractPower;
uniform vec4 u_fresnelColor;
// light
uniform vec3 u_specularLightVector;
uniform vec3 u_diffuseLightVector;
uniform vec4 u_ambientLightColor;
uniform float u_specularIntensity;
// line
uniform float u_lineLength;
uniform vec4 u_lineColor;

float fresnel(vec3 eyeVector, vec3 worldNormal, float power) {
  float fresnelFactor = abs(dot(eyeVector, worldNormal));
  float inversefresnelFactor = 1.0 - fresnelFactor;

  return pow(inversefresnelFactor, power);
}


vec3 sat(vec3 rgb, float intensity) {
  vec3 L = vec3(0.2125, 0.7154, 0.0721);
  vec3 grayscale = vec3(dot(rgb, L));
  return mix(grayscale, rgb, intensity);
}

const int LOOP = 4;

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec4 color = vec4(vec3(0.0), 1.0);
  float colorAberrationAmp = fresnel(vec3(0.0, 0.0, 1.0), v_normal, 1.0) * u_colorAberrationAmp;
  for ( int i = 0; i < LOOP; i ++ ) {
    float slide = float(i) / float(LOOP) * 0.1;
    vec3 refractedR = refract(u_refractVector, v_normal, 1.0 / u_ior);
    vec3 refractedG = refract(u_refractVector, v_normal, 1.0 / (u_ior + colorAberrationAmp));
    vec3 refractedB = refract(u_refractVector, v_normal, 1.0 / (u_ior - colorAberrationAmp));

    color.r += texture2D(u_texture, st + refractedR.xy * (u_refractPower + slide * 1.0) * u_chromaticAberration).r;
    color.g += texture2D(u_texture, st + refractedG.xy * (u_refractPower + slide * 2.0) * u_chromaticAberration).g;
    color.b += texture2D(u_texture, st + refractedB.xy * (u_refractPower + slide * 3.0) * u_chromaticAberration).b;

    color.rgb = sat(color.rgb, 1.05);
  }
  color /= float( LOOP );

  float depth = v_depth;

  if (u_side == 0) {
    // light
    vec3 diffuseLightVector = normalize(u_diffuseLightVector);
    float diffuse = max(dot(diffuseLightVector, v_normal), 0.0);
    color.rgb = color.rgb * diffuse;
    // 反射ベクトルとライトベクトルの内積で反射光を計算する
    vec3 reflectVector = normalize(reflect(v_eyeVector, v_normal));
    vec3 specularLightVector = normalize(u_specularLightVector);
    float specular = max(dot(reflectVector, specularLightVector), 0.0);
    specular = pow(specular, 16.0);
    color = vec4(color.rgb + specular * u_specularIntensity, 1.0);

    color.rgb = color.rgb + u_ambientLightColor.rgb;
  }
  if (u_side == 1) {
    color.a = color.a * depth + u_ambientLightColor.a;
  }

  // フラネル効果
  float f = fresnel(v_eyeVector, v_normal, 32.0);
  color = mix(color, u_fresnelColor, f);

  float smoothness = 0.5;
  float r = fract(sin(dot(floor(vec2(8.0, 8.0) * v_uv) ,vec2(12.9898,78.233))) * 43758.5453);
  float m = smoothstep(0.0, -smoothness, r - ((1.0 - u_detailProgress) * (1.0 + smoothness)));

  color = color * m;

  // 0に近い値になるほど縁に近い
  float edgeDetection = min(
    min(v_uv.x, 1.0 - v_uv.x),
    min(v_uv.y, 1.0 - v_uv.y)
  );
  vec4 lineColor = u_lineColor * depth;
  color = mix(
    lineColor,
    color,
    smoothstep(0.0, u_lineLength, edgeDetection)
  );

  gl_FragColor = color;
}
