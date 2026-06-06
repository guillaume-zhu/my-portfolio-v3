uniform float uSurfaceOffset;

uniform float uTime;
uniform float uHoverProgress;

uniform float uClickProgress;
uniform float uClickStrength;
uniform float uClickWaveFrequency;
uniform float uClickWaveSpeed;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;

void main() {
    // Click wave effect
    float clickEffect = uClickProgress * uHoverProgress;

    float waveA = sin(position.y * uClickWaveFrequency + uTime * uClickWaveSpeed);
    float waveB = sin(position.x * uClickWaveFrequency * 0.7 - uTime * uClickWaveSpeed * 0.6);

    float fluidWave = (waveA + waveB) * 0.5;

    float fluidOffset = fluidWave * uClickStrength * clickEffect;

    // Displacement
    vec3 displacedPosition = position + normal * (uSurfaceOffset + fluidOffset);
    
    vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vNormal = normalize(normal);
    vPosition = modelPosition.xyz;
    vScreenPosition = projectedPosition;
} 