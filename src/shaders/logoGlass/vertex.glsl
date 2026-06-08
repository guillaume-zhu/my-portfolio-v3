uniform float uSurfaceOffset;

uniform float uTime;
uniform float uHoverProgress;

uniform float uClickProgress;
uniform vec3 uClickPosition;
uniform float uClickTime;
uniform float uClickRadius;
uniform float uClickStrength;
uniform float uClickWaveFrequency;
uniform float uClickWaveSpeed;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;

void main() {
    // Click wave effect
    float clickEffect = uClickProgress * uHoverProgress;

    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    float distanceToClick = distance(worldPosition, uClickPosition);

    float clickMask = 1.0 - smoothstep(0.0, uClickRadius, distanceToClick);

    float clickElapsedTime = uTime - uClickTime;

    float ripple = sin(
        (distanceToClick * uClickWaveFrequency) - (clickElapsedTime * uClickWaveSpeed)
    );

    float fluidOffset = ripple * clickMask * uClickStrength * clickEffect;

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