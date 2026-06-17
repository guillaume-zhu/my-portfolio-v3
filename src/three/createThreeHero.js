import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/Addons.js"
import GUI from "lil-gui"

import logoGlassVertexShader from "../shaders/logoGlass/vertex.glsl"
import logoGlassFragmentShader from "../shaders/logoGlass/fragment.glsl"

export const createThreeHero = async () => {
  /**
   * Base
   */
  // Debug
  // const gui = new GUI()

  // Loaders
  const textureLoader = new THREE.TextureLoader()

  // Canvas
  const canvas = document.querySelector(".webgl")

  // Scene
  const scene = new THREE.Scene()

  // Rayscaster
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  let hoverTarget = 0
  let hoverProgress = 0
  let clickProgress = 0
  let clickTime = 0
  let isInteractive = true

  const clickPosition = new THREE.Vector3()

  // Sizes & Events
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  }

  // -- Resize
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

    sceneRenderTarget.setSize(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)
  })

  // -- Mouse
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1
    mouse.y = -(event.clientY / sizes.height) * 2 + 1
  })

  window.addEventListener("click", () => {
    if (!isInteractive) return
    if (!hoverTarget) return
    if (hoverProgress < 0.75) return

    raycaster.setFromCamera(mouse, camera)

    const clickIntersects = raycaster.intersectObject(logoHitBox)

    if (clickIntersects.length === 0) return

    clickPosition.copy(clickIntersects[0].point)
    clickTime = performance.now() * 0.001

    clickProgress = 1
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
  // Setup
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

  // Render Target
  const sceneRenderTarget = new THREE.WebGLRenderTarget(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio,
    {
      samples: 4,
    },
  )

  /**
   * Environment map
   */

  const environmentTexture = await textureLoader.loadAsync("/textures/scene-gradient.webp")

  environmentTexture.mapping = THREE.EquirectangularReflectionMapping
  environmentTexture.colorSpace = THREE.SRGBColorSpace

  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

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

  // Model group
  const gltfLoader = new GLTFLoader()
  const gltf = await gltfLoader.loadAsync("/models/logo.glb")

  const logoGroup = new THREE.Group()
  scene.add(logoGroup)

  const logo = gltf.scene
  logoGroup.add(logo)

  const glassLogo = logo.clone(true)
  logoGroup.add(glassLogo)

  // Hitbox
  const logoBox = new THREE.Box3().setFromObject(logo)
  const logoSize = logoBox.getSize(new THREE.Vector3())
  const logoCenter = logoBox.getCenter(new THREE.Vector3())

  const logoHitBox = new THREE.Mesh(
    new THREE.BoxGeometry(logoSize.x, logoSize.y, logoSize.z),
    new THREE.MeshBasicMaterial({
      visible: false,
    }),
  )

  logoHitBox.position.copy(logoCenter)
  logoGroup.add(logoHitBox)

  // Silver Material
  const silverMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.4,
    envMapIntensity: 1.2,
  })

  logo.traverse((child) => {
    if (!child.isMesh) return

    child.material = silverMaterial
    child.renderOrder = 1
  })

  // Glass Shader Material
  const glassMaterial = new THREE.ShaderMaterial({
    vertexShader: logoGlassVertexShader,
    fragmentShader: logoGlassFragmentShader,

    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,

    uniforms: {
      // Glass vertex offset
      uSurfaceOffset: { value: 0.0005 },

      // Hover fragment
      uHoverProgress: { value: 0 },
      uOpacity: { value: 1.0 },

      uTime: { value: 0 },

      uNoiseScale: { value: 2.0 },
      uNoiseSpeed: { value: 0.1 },
      uRevealEdge: { value: 0.1 },
      uFresnelPower: { value: 1.2 },

      uDistortionStrength: { value: 0.025 },
      uChromaticAberration: { value: 0.0045 },

      uSceneTexture: { value: sceneRenderTarget.texture },

      // Click fragment
      uClickProgress: { value: 0 },
      uClickPosition: { value: new THREE.Vector3() },
      uClickTime: { value: 0 },
      uClickRadius: { value: 1.2 },
      uClickWaveFrequency: { value: 20.0 },
      uClickWaveSpeed: { value: 7.0 },
      uClickRippleStrength: { value: 0.02 },
      uClickGlowStrength: { value: 0.5 },
      uClickRippleNoise: { value: 0.05 },
    },
  })

  glassLogo.traverse((child) => {
    if (!child.isMesh) return

    child.material = glassMaterial
    child.renderOrder = 2
  })

  // const clickFolder = gui.addFolder("Click ripple")

  // Rotation
  const logoRotationAxis = new THREE.Vector3(0.2, 1, 0.1).normalize()
  const logoBaseRotationSpeed = 0.2

  /**
   * Text planes
   */
  const createTextPlane = async ({ path, width, height, position, rotation }) => {
    const texture = await textureLoader.loadAsync(path)

    texture.colorSpace = THREE.SRGBColorSpace

    const geometry = new THREE.PlaneGeometry(width, height)

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    })

    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(position.x, position.y, position.z)
    mesh.rotation.set(rotation.x, rotation.y, rotation.z)

    scene.add(mesh)

    return mesh
  }

  // Positions and scale
  const multiplyer1 = 2
  const multiplyer2 = 0.85
  const multiplyer3 = 0.6

  const textName = await createTextPlane({
    path: "/textures/texts/text-name.png",
    width: 5.5 * multiplyer1,
    height: 1.4 * multiplyer1,
    position: { x: 0, y: 0, z: -2.5 },
    rotation: { x: 0, y: 0, z: 0 },
  })

  const textArt = await createTextPlane({
    path: "/textures/texts/text-art-director-justified.png",
    width: 5.5 * multiplyer2,
    height: 1.4 * multiplyer2,
    position: { x: 1, y: 5.25, z: -1.75 },
    rotation: { x: 0, y: -Math.PI * 0.5, z: 0 },
  })

  const textCreative = await createTextPlane({
    path: "/textures/texts/text-creative-developer-justified.png",
    width: 5.5 * multiplyer3,
    height: 1.4 * multiplyer3,
    position: { x: -1, y: 6.5, z: 1.25 },
    rotation: { x: 0, y: -Math.PI * 0.5, z: 0 },
  })

  textName.material.opacity = 1
  textArt.material.opacity = 0
  textCreative.material.opacity = 0

  /**
   * Scroll logic
   */
  let scrollProgress = 0
  let scrollRotationBoost = 0

  const maxScrollRotationBoost = 2.5
  const scrollVelocityNormalizer = 2000

  const radius = 6
  const floorHeight = 3
  const floorCount = 3
  const totalHeight = floorHeight * (floorCount - 1)
  const totalCameraAngle = Math.PI * 0.5

  const setScrollProgress = (value, velocity = 0) => {
    scrollProgress = value

    const normalizedVelocity = THREE.MathUtils.clamp(
      Math.abs(velocity) / scrollVelocityNormalizer,
      0,
      1,
    )

    const boost = normalizedVelocity * maxScrollRotationBoost
    scrollRotationBoost = Math.max(scrollRotationBoost, boost)
  }

  const updateSceneFromScroll = () => {
    const currentY = scrollProgress * totalHeight
    const angle = -scrollProgress * totalCameraAngle

    logoGroup.position.y = currentY

    camera.position.x = Math.sin(angle) * radius
    camera.position.y = currentY
    camera.position.z = Math.cos(angle) * radius

    camera.lookAt(0, currentY, 0)

    const nameTextOpacity = 1 - THREE.MathUtils.smoothstep(scrollProgress, 0.2, 0.4)
    const roleTextOpacity = THREE.MathUtils.smoothstep(scrollProgress, 0.72, 0.9)

    textName.material.opacity = nameTextOpacity
    textArt.material.opacity = roleTextOpacity
    textCreative.material.opacity = roleTextOpacity
  }

  /**
   * Animate
   */
  let previousTime = performance.now()

  const tick = (currentTime) => {
    const delta = (currentTime - previousTime) / 1000
    previousTime = currentTime

    // Update glass logo shader
    glassMaterial.uniforms.uTime.value = currentTime * 0.001

    // Update screen
    updateSceneFromScroll()

    // Raycaster
    if (isInteractive) {
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObject(logoHitBox)

      // -- hover
      hoverTarget = intersects.length > 0 ? 1 : 0
      document.body.style.cursor = hoverTarget ? "pointer" : "default"
    } else {
      hoverTarget = 0
    }

    hoverProgress = THREE.MathUtils.damp(hoverProgress, hoverTarget, 4.5, delta)

    glassMaterial.uniforms.uHoverProgress.value = hoverProgress

    // -- click
    clickProgress = THREE.MathUtils.damp(clickProgress, 0, 3.5, delta)

    glassMaterial.uniforms.uClickProgress.value = clickProgress
    glassMaterial.uniforms.uClickPosition.value.copy(clickPosition)
    glassMaterial.uniforms.uClickTime.value = clickTime

    // Update logo
    scrollRotationBoost = THREE.MathUtils.damp(scrollRotationBoost, 0, 1.5, delta)

    const logoRotationSpeed = logoBaseRotationSpeed + scrollRotationBoost
    logoGroup.rotateOnAxis(logoRotationAxis, delta * logoRotationSpeed)

    // Render
    logo.visible = false
    glassLogo.visible = false

    renderer.setRenderTarget(sceneRenderTarget)
    renderer.render(scene, camera)

    logo.visible = true
    glassLogo.visible = true

    renderer.setRenderTarget(null)
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
  }

  window.requestAnimationFrame(tick)

  return {
    scene,
    camera,
    renderer,
    logoGroup,
    setScrollProgress,

    setInteractive: (value) => {
      isInteractive = value

      if (!isInteractive) {
        hoverTarget = 0
        document.body.style.cursor = "default"
      }
    },
  }
}
