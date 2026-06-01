uniform float uHoverProgress;
uniform float uOpacity;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/noise.glsl;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vPosition);

    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0),2.0);
    float organicNoise = noise(vPosition * 2.4 + vec3(0.0, uTime * 0.2, 0.0));

    float reveal = smoothstep(
        1.0 - uHoverProgress,
        1.0 - uHoverProgress + 0.10,
        organicNoise
    );

    vec3 glassColorA = vec3(0.75, 0.95, 1.0);
    vec3 glassColorB = vec3(1.0, 0.55, 0.95);

    vec3 glassColor = mix(glassColorA, glassColorB, fresnel);

    float alpha = reveal * uHoverProgress * uOpacity;
    alpha *= mix(0.35, 1.0, fresnel);

    gl_FragColor = vec4(glassColor, alpha);
}   