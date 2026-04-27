import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/Addons.js"

export const createThreeHero = async () => {
  /**
   * Base
   */
  // Debug
  // const gui = new GUI()

  // Canvas
  const canvas = document.querySelector(".webgl")

  // Scene
  const scene = new THREE.Scene()

  // Sizes
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  }

  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
  })

  /**
   * Camera
   */
  const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
  camera.position.set(0, 0, 6)
  scene.add(camera)

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.pixelRatio)
  renderer.setClearColor("#6b6baf")
  renderer.outputColorSpace = THREE.SRGBColorSpace

  /**
   * Light
   */
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  /**
   * Model
   */
  const gltfLoader = new GLTFLoader()
  const gltf = await gltfLoader.loadAsync("/models/logo.glb")

  const logo = gltf.scene
  scene.add(logo)

  const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial())
  scene.add(cube)
  cube.position.x = -3

  /**
   * Scroll logic
   */
  let scrollProgress = 0

  const setScrollProgress = (value) => {
    scrollProgress = value
  }

  const updateSceneFromScroll = () => {
    logo.position.y = scrollProgress * 1.2
  }

  /**
   * Animate
   */
  const timer = new THREE.Timer()

  const tick = () => {
    timer.update()
    const delta = timer.getDelta()

    // Update logo
    logo.rotation.y += delta * 0.8
    cube.rotation.y += delta * 0.8

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
  }

  tick()

  return {
    scene,
    camera,
    renderer,
    logo,
    setScrollProgress,
  }
}
