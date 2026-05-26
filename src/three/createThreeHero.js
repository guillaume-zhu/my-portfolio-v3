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
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1

  /**
   * Environment map
   */
  const textureLoader = new THREE.TextureLoader()

  const environmentTexture = await textureLoader.loadAsync("/textures/scene-gradient.webp")

  environmentTexture.mapping = THREE.EquirectangularReflectionMapping
  environmentTexture.colorSpace = THREE.SRGBColorSpace

  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader

  const environmentMap = pmremGenerator.fromEquirectangular(environmentTexture).texture

  scene.background = environmentTexture
  scene.environment = environmentMap

  pmremGenerator.dispose()

  /**
   * Light
   */
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.05)
  directionalLight.position.set(3, 4, 5)
  scene.add(directionalLight)

  /**
   * Logo Model
   */
  const gltfLoader = new GLTFLoader()
  const gltf = await gltfLoader.loadAsync("/models/logo.glb")

  const logo = gltf.scene
  scene.add(logo)

  // Rotation
  const logoRotationAxis = new THREE.Vector3(0.2, 1, 0.1).normalize()

  // Material
  const silverMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.4,
    envMapIntensity: 1.2,
  })

  logo.traverse((child) => {
    if (!child.isMesh) return

    child.material = silverMaterial
  })

  /**
   * Scroll logic
   */
  let scrollProgress = 0

  const radius = 6
  const floorHeight = 3
  const floorCount = 3
  const totalHeight = floorHeight * (floorCount - 1)
  const totalCameraAngle = Math.PI * 0.5

  const setScrollProgress = (value) => {
    scrollProgress = value
  }

  const updateSceneFromScroll = () => {
    const currentY = scrollProgress * totalHeight
    const angle = -scrollProgress * totalCameraAngle

    logo.position.y = currentY

    camera.position.x = Math.sin(angle) * radius
    camera.position.y = currentY
    camera.position.z = Math.cos(angle) * radius

    camera.lookAt(0, currentY, 0)
  }
  /**
   * Animate
   */
  let previousTime = performance.now()

  const tick = (currentTime) => {
    const delta = (currentTime - previousTime) / 1000
    previousTime = currentTime

    updateSceneFromScroll()

    // Update logo
    logo.rotateOnAxis(logoRotationAxis, delta * 0.25)

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
  }

  window.requestAnimationFrame(tick)

  return {
    scene,
    camera,
    renderer,
    logo,
    setScrollProgress,
  }
}
