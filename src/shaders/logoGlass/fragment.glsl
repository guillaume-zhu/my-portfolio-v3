uniform float uHoverProgress;
uniform float uOpacity;
uniform float uTime;

uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uRevealEdge;
uniform float uFresnelPower;

varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/noise.glsl;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vPosition);

    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), uFresnelPower);

    float organicNoise = noise(vPosition * uNoiseScale + vec3(0.0, uTime * uNoiseSpeed, 0.0));

    float reveal = smoothstep(
        1.0 - uHoverProgress,
        1.0 - uHoverProgress + uRevealEdge,
        organicNoise
    );

    vec3 glassColorA = vec3(0.75, 0.95, 1.0);
    vec3 glassColorB = vec3(1.0, 0.55, 0.95);

    vec3 glassColor = mix(glassColorA, glassColorB, fresnel);

    float alpha = reveal * uHoverProgress * uOpacity;
    alpha *= mix(0.35, 1.0, fresnel);

    gl_FragColor = vec4(glassColor, alpha);
}   