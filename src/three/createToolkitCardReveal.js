import * as THREE from "three"
import GUI from "lil-gui"

import vertexShader from "../shaders/toolkitCardReveal/vertex.glsl"
import fragmentShader from "../shaders/toolkitCardReveal/fragment.glsl"

export function createToolkitCardReveal(canvas) {
  if (!(canvas instanceof HTMLCanvasElement)) return null

  // --------------
  // 1. Scene
  // --------------
  const scene = new THREE.Scene()
  const camera = new THREE.Camera()

  // --------------
  // 2. Camera
  // --------------
  const creamColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-cream")
    .trim()

  // --------------
  // 3. Uniforms
  // --------------
  const uniforms = {
    uProgress: {
      value: 0,
    },
    uTime: {
      value: 0,
    },
    uCreamColor: {
      value: new THREE.Color(creamColor),
    },

    uNoiseScale: {
      value: 2.0,
    },
    uNoiseStrength: {
      value: 0.15,
    },
    uNoiseSpeedX: {
      value: 0.45,
    },
    uNoiseSpeedY: {
      value: 0.35,
    },
  }

  //   const gui = new GUI({
  //     title: "Toolkit reveal",
  //   })

  //   const noiseFolder = gui.addFolder("Noise")

  //   noiseFolder.add(uniforms.uNoiseScale, "value", 1, 20, 0.1).name("Scale")

  //   noiseFolder.add(uniforms.uNoiseStrength, "value", 0, 1.0, 0.0001).name("Strength")

  //   noiseFolder.add(uniforms.uNoiseSpeedX, "value", -2, 2, 0.01).name("Speed X")

  //   noiseFolder.add(uniforms.uNoiseSpeedY, "value", -0.5, 0.5, 0.01).name("Speed Y")

  // --------------
  // 4. Shader plane
  // --------------
  const geometry = new THREE.PlaneGeometry(2, 2)

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  const plane = new THREE.Mesh(geometry, material)

  scene.add(plane)

  // --------------
  // 5. Renderer
  // --------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  })

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  // --------------
  // 6. Render
  // --------------
  const clock = new THREE.Clock()

  function render() {
    renderer.render(scene, camera)
  }

  function tick() {
    uniforms.uTime.value = clock.getElapsedTime()

    render()

    requestAnimationFrame(tick)
  }

  // --------------
  // 7. Resize
  // --------------
  function resize() {
    const width = Math.max(canvas.clientWidth, 1)
    const height = Math.max(canvas.clientHeight, 1)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)

    render()
    tick()
  }

  window.addEventListener("resize", resize)
  resize()

  // --------------
  // 8. Controls
  // --------------
  function setProgress(progress) {
    uniforms.uProgress.value = THREE.MathUtils.clamp(progress, 0, 1)

    render()
  }

  return {
    setProgress,
  }
}
