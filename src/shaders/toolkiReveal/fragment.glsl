uniform float uProgress;
uniform vec3 uCreamColor;
uniform vec2 uResolution;
uniform vec2 uOrigin;

varying vec2 vUv;

#include ../includes/noise.glsl;

void main() {
    float aspectRatio = uResolution.x / uResolution.y;
    float edgeSoftness = 0.001;
float noiseScale = 1.4;
float noiseStrength = 0.035;

    // New center
    vec2 centeredUv = vUv - uOrigin;

    // Adapt center to ratio
    centeredUv.x *= aspectRatio;

    // Distance from center
    float distanceFromCenter = length(centeredUv);

    // Direction
    vec2 direction = distanceFromCenter > 0.0001 
    ? normalize(centeredUv)
    : vec2(0.0);

    // Noise
    float noisePhase = uProgress * 1.5;
    float largeNoise = noise(
    vec3(direction * 2.5, noisePhase)
    );

    float detailNoise = noise(
    vec3(direction * 8.0, 4.0 + noisePhase)
    );
    
    float noiseValue = noise(vec3(direction * noiseScale, 0.0));

    float centeredNoise = (noiseValue - 0.5) * 2.0;

    // Max radius
    float maxDistanceX = max(uOrigin.x, 1.0 - uOrigin.x) * aspectRatio;
    float maxDistanceY = max(uOrigin.y, 1.0 - uOrigin.y);
    float maxRadius = length(vec2(maxDistanceX, maxDistanceY));

    // Radius with scrollProgress
    float radius = mix(- edgeSoftness, maxRadius + edgeSoftness, uProgress);
    float noisyRadius = radius + centeredNoise * noiseStrength;


    float noiseEnvelope = sin(uProgress * 3.14);

    float distortedRadius = radius + centeredNoise * noiseStrength * noiseEnvelope;

    // Reveal with distanceFromCenter, before, in, out of radius and edgeSoft
    float reveal = 1.0 - smoothstep(
    noisyRadius - edgeSoftness,
    noisyRadius + edgeSoftness,
    distanceFromCenter
);

    gl_FragColor = vec4(vec3(uCreamColor), reveal);
}