uniform float uHoverProgress;
uniform float uOpacity;
uniform float uTime;

uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uRevealEdge;
uniform float uFresnelPower;
uniform float uDistortionStrength;

uniform sampler2D uSceneTexture;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;

#include ../includes/noise.glsl;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vPosition);

    // Fresnel
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), uFresnelPower);

    // Noise
    float organicNoise = noise(vPosition * uNoiseScale + vec3(0.0, uTime * uNoiseSpeed, 0.0));

    // Reveal
    float reveal = smoothstep(
        1.0 - uHoverProgress,
        1.0 - uHoverProgress + uRevealEdge,
        organicNoise
    );

    // ScreenUv
    vec2 screenUv = vScreenPosition.xy / vScreenPosition.w;
    screenUv = screenUv * 0.5 + 0.5;

    // Distortion
    float distortionNoiseX = noise( vPosition * uNoiseScale + vec3(uTime * uNoiseSpeed, 0.0, 0.0));
    float distortionNoiseY = noise( vPosition * uNoiseScale + vec3(12.4,uTime * uNoiseSpeed, 7.8));

    vec2 distortion = vec2(
        distortionNoiseX - 0.5,
        distortionNoiseY - 0.5
    ) * uDistortionStrength * reveal * uHoverProgress;

    vec2 distortedScreenUv = screenUv + distortion;

    vec3 sceneColor = texture2D(uSceneTexture, distortedScreenUv).rgb;

    // // Texture
    float alpha = reveal * uHoverProgress * uOpacity;
    alpha *= mix(0.35, 1.0, fresnel);

    gl_FragColor = vec4(sceneColor, alpha);
}   