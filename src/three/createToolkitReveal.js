import * as THREE from "three"

import toolkitRevealVertexShader from "../shaders/toolkiReveal/vertex.glsl"
import toolkitRevealFragmentShader from "../shaders/toolkiReveal/fragment.glsl"

export function createToolkitReveal() {
  // ----------------------
  // 1. DOM selection
  // ----------------------
  const canvas = document.querySelector(".toolkit__reveal-canvas")

  // ----------------------
  // 2. Scene
  // ----------------------
  const scene = new THREE.Scene()
  const camera = new THREE.Camera()

  // ----------------------
  // 3. Cream color
  // ----------------------
  const creamColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-cream")
    .trim()

  // ----------------------
  // 4. Shader
  // ----------------------
  const uniforms = {
    uProgress: { value: 0 },
    uCreamColor: { value: new THREE.Color(creamColor) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uOrigin: { value: new THREE.Vector2(0.5, 0.5) },
  }

  const geometry = new THREE.PlaneGeometry(2, 2)

  const material = new THREE.ShaderMaterial({
    vertexShader: toolkitRevealVertexShader,
    fragmentShader: toolkitRevealFragmentShader,
    uniforms: uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  const plane = new THREE.Mesh(geometry, material)

  scene.add(plane)

  // ----------------------
  // 5. Renderer
  // ----------------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  })

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  // ----------------------
  // 6. Render
  // ----------------------
  function render() {
    renderer.render(scene, camera)
  }

  // ----------------------
  // 7. Controls
  // ----------------------
  function setProgress(progress) {
    uniforms.uProgress.value = THREE.MathUtils.clamp(progress, 0, 1)

    render()
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect()

    uniforms.uResolution.value.set(width, height)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(Math.max(width, 1), Math.max(height, 1), false)
  }

  function setOriginFromElement(element) {
    if (!element) return

    const canvasRect = canvas.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()

    const centerX = elementRect.left + elementRect.width / 2
    const centerY = elementRect.top + elementRect.height / 2

    const originX = (centerX - canvasRect.left) / canvasRect.width
    const originY = 1 - (centerY - canvasRect.top) / canvasRect.height

    uniforms.uOrigin.value.set(originX, originY)

    render()
  }

  function destroy() {
    window.removeEventListener("resize", resize)

    geometry.dispose()
    material.dispose()
    renderer.dispose()
  }

  // ----------------------
  // 8. Init
  // ----------------------
  window.addEventListener("resize", resize)

  resize()
  setProgress(0)

  return {
    setProgress,
    setOriginFromElement,
    resize,
    destroy,
  }
}
