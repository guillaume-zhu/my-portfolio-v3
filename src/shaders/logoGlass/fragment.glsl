uniform float uHoverProgress;
uniform float uOpacity;
uniform float uTime;

uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uRevealEdge;
uniform float uFresnelPower;

uniform float uDistortionStrength;
uniform float uChromaticAberration;

uniform sampler2D uSceneTexture;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;

#include ../includes/noise.glsl;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vPosition);

    // Fresnel
    float facing = abs(dot(normal, viewDirection));

    float fresnel = pow(
    1.0 - clamp(facing, 0.0, 1.0),
    uFresnelPower
);

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

    // Chromatic Aberration
    vec2 chromaticDirection = normalize(distortion + vec2(0.0001));
    vec2 chromaticOffset = chromaticDirection * uChromaticAberration * reveal * uHoverProgress;

    float red = texture2D(uSceneTexture, distortedScreenUv + chromaticOffset).r;
    float green = texture2D(uSceneTexture, distortedScreenUv).g;
    float blue = texture2D(uSceneTexture, distortedScreenUv - chromaticOffset).b;

    vec3 sceneColor = vec3(red, green, blue);
    

    // Tint
    vec3 glassTint = vec3(0.90, 0.95, 1);

    float tintStrength = mix(0.12, 0.28, fresnel);
    
    vec3 finalColor = mix(sceneColor, glassTint, tintStrength);

    // Alpha
    float alpha = reveal * uHoverProgress * uOpacity;


    gl_FragColor = vec4(finalColor, alpha);
    // gl_FragColor = vec4(vec3(fresnel), 1.0);
}   