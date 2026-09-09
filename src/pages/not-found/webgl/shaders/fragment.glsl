precision highp float;

uniform sampler2D u_image;
uniform vec2 u_imageResolution;
uniform vec2 u_resolution;
uniform float u_time;

uniform float u_idleSpeed;
uniform float u_idleStrength;
uniform vec2 u_idleFrequency;

uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform float u_strength;
uniform float u_radius;
uniform float u_zoom;

varying vec2 v_uv;

vec2 coverUv(vec2 uv, vec2 viewportResolution, vec2 imageResolution) {
  float viewportRatio = viewportResolution.x / viewportResolution.y;
  float imageRatio = imageResolution.x / imageResolution.y;
  vec2 scale = vec2(1.0);

  if (viewportRatio > imageRatio) {
    scale.y = imageRatio / viewportRatio;
  } else {
    scale.x = viewportRatio / imageRatio;
  }

  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = v_uv;
  float time = u_time * u_idleSpeed;

  vec2 idleFlow = vec2(
    sin(uv.y * u_idleFrequency.x + time) +
      sin(uv.x * 1.7 - time * 0.63) * 0.5,
    cos(uv.x * u_idleFrequency.y - time * 0.7) +
      cos(uv.y * 1.5 + time * 0.47) * 0.5
  ) / 1.5;
  vec2 idleOffset = idleFlow * u_idleStrength;

  vec2 mouseDelta = uv - u_mouse;
  mouseDelta.x *= u_resolution.x / u_resolution.y;

  float mouseInfluence = smoothstep(u_radius, 0.0, length(mouseDelta));
  vec2 mouseOffset = u_velocity * mouseInfluence * u_strength;

  vec2 imageUv = coverUv(uv + idleOffset - mouseOffset, u_resolution, u_imageResolution);
  imageUv = (imageUv - 0.5) / u_zoom + 0.5;
  gl_FragColor = texture2D(u_image, imageUv);
}
