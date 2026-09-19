import * as THREE from "three"

import { loadContactEnvironment } from "./loadContactEnvironment"
import { loadContactTextures } from "./loadContactTextures"

const MOBILE_BREAKPOINT = 700
const MAX_PIXEL_RATIO = 1.5
const SPHERE_ROTATION_SPEED = 0.04
const SPHERE_ROTATION_HERO_SPEED = 0.3
const SPHERE_FLOAT_SPEED = 0.55
const INITIAL_VISUAL_MODE = "hero"
const HERO_VIEW_ROTATION_Y = THREE.MathUtils.degToRad(-10)

const LAYOUTS = {
  desktop: {
    referenceWidth: 1440,
    referenceHeight: 1023,
    exportScale: 2,
    floatAmplitude: 25,
    planes: {
      headline: {
        align: "center",
        x: 720.5,
        top: 260,
        minScale: 0.7,
      },
      availability: {
        align: "center",
        x: 720.5,
        top: 584.41,
        minScale: 0.7,
      },
      services: {
        anchor: "bottom-left",
        left: 92,
        bottom: 136,
      },
      contact: {
        anchor: "bottom-left",
        left: 93,
        bottom: 81.5,
      },
    },
    sphere: {
      centerX: 1177,
      centerY: 926.5,
      diameter: 940,
    },
  },
  mobile: {
    referenceWidth: 390,
    referenceHeight: 844,
    exportScale: 1,
    floatAmplitude: 30,
    planes: {
      headline: {
        align: "center",
        x: 195,
        top: 101,
      },
      availability: {
        align: "center",
        x: 195,
        top: 238,
      },
      services: {
        align: "left",
        x: 77,
        top: 611,
      },
      contact: {
        align: "left",
        x: 78,
        top: 740,
      },
    },
    sphere: {
      centerX: 335.5,
      centerY: 520.5,
      diameter: 429,
    },
  },
}

function createTextPlane(scene) {
  const geometry = new THREE.PlaneGeometry(1, 1)
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  const mesh = new THREE.Mesh(geometry, material)

  mesh.position.z = 10
  mesh.renderOrder = 10
  scene.add(mesh)

  return mesh
}

function createRoundedFrameGeometry(width, height, radius) {
  const halfWidth = width * 0.5
  const halfHeight = height * 0.5
  const safeRadius = Math.min(Math.max(radius, 0), halfWidth, halfHeight)
  const shape = new THREE.Shape()

  shape.moveTo(-halfWidth + safeRadius, -halfHeight)
  shape.lineTo(halfWidth - safeRadius, -halfHeight)
  shape.absarc(
    halfWidth - safeRadius,
    -halfHeight + safeRadius,
    safeRadius,
    -Math.PI * 0.5,
    0,
    false,
  )
  shape.lineTo(halfWidth, halfHeight - safeRadius)
  shape.absarc(halfWidth - safeRadius, halfHeight - safeRadius, safeRadius, 0, Math.PI * 0.5, false)
  shape.lineTo(-halfWidth + safeRadius, halfHeight)
  shape.absarc(
    -halfWidth + safeRadius,
    halfHeight - safeRadius,
    safeRadius,
    Math.PI * 0.5,
    Math.PI,
    false,
  )
  shape.lineTo(-halfWidth, -halfHeight + safeRadius)
  shape.absarc(
    -halfWidth + safeRadius,
    -halfHeight + safeRadius,
    safeRadius,
    Math.PI,
    Math.PI * 1.5,
    false,
  )
  shape.closePath()

  return new THREE.ShapeGeometry(shape)
}

export function createContactScene({ canvas, root, language = "en", reducedMotion = false } = {}) {
  if (!(canvas instanceof HTMLCanvasElement) || !(root instanceof HTMLElement)) {
    return null
  }

  const frame = root.querySelector(".contact__frame")

  if (!(frame instanceof HTMLElement)) {
    return null
  }

  let renderer

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      stencil: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    })
  } catch (error) {
    console.error("Unable to initialize the Contact WebGL renderer.", error)
    return null
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false

  const scene = new THREE.Scene()
  const backgroundScene = new THREE.Scene()
  const backgroundMaskScene = new THREE.Scene()

  scene.background = null

  const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 2000)
  const backgroundCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)

  camera.position.set(0, 0, 1000)
  camera.lookAt(0, 0, 0)
  backgroundCamera.position.set(0, 0, 6)
  backgroundCamera.lookAt(0, 0, 0)

  backgroundCamera.rotation.y = HERO_VIEW_ROTATION_Y

  const backgroundMaskMaterial = new THREE.MeshBasicMaterial({
    colorWrite: false,
    depthTest: false,
    depthWrite: false,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: THREE.ReplaceStencilOp,
    stencilZFail: THREE.ReplaceStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  })
  const backgroundMask = new THREE.Mesh(new THREE.BufferGeometry(), backgroundMaskMaterial)

  backgroundMaskScene.add(backgroundMask)

  const backgroundUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.backgroundCube.uniforms)
  const backgroundMaterial = new THREE.ShaderMaterial({
    name: "ContactHeroBackgroundMaterial",
    uniforms: backgroundUniforms,
    vertexShader: THREE.ShaderLib.backgroundCube.vertexShader,
    fragmentShader: THREE.ShaderLib.backgroundCube.fragmentShader,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  })

  Object.defineProperty(backgroundMaterial, "envMap", {
    get() {
      return this.uniforms.envMap.value
    },
  })

  const backgroundGeometry = new THREE.BoxGeometry(1, 1, 1)
  const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial)

  backgroundMesh.onBeforeRender = function handleBackgroundBeforeRender(
    renderer,
    renderedScene,
    activeCamera,
  ) {
    this.matrixWorld.copyPosition(activeCamera.matrixWorld)
  }

  backgroundScene.add(backgroundMesh)

  const headlinePlane = createTextPlane(scene)
  const availabilityPlane = createTextPlane(scene)
  const servicesPlane = createTextPlane(scene)
  const contactPlane = createTextPlane(scene)

  const textPlanes = {
    headline: headlinePlane,
    availability: availabilityPlane,
    services: servicesPlane,
    contact: contactPlane,
  }

  const sphereGeometry = new THREE.SphereGeometry(1, 64, 48)
  const texturedSphereMaterial = new THREE.MeshBasicMaterial({
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  })
  const silverSphereMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.4,
    envMapIntensity: 1.2,
  })
  const sphere = new THREE.Mesh(sphereGeometry, texturedSphereMaterial)
  const sphereInitialRotationY = -Math.PI * 0.25 + HERO_VIEW_ROTATION_Y

  sphere.rotation.y = sphereInitialRotationY
  sphere.renderOrder = 0
  scene.add(sphere)

  const textureLoader = loadContactTextures({ language })
  const environmentLoader = loadContactEnvironment({ renderer })
  const viewport = {
    width: 1,
    height: 1,
  }

  let textures = null
  let environmentMap = null
  let currentVisualMode = INITIAL_VISUAL_MODE
  let currentLayoutName = null
  let sphereBaseY = 0
  let sphereFloatAmplitude = 0
  let elapsedTime = 0
  let lastFrameTime = 0
  let animationFrameId = null
  let isReady = false
  let isRunning = false
  let wantsToRun = true
  let isDestroyed = false
  let contextLost = false

  function getLayoutName() {
    return viewport.width <= MOBILE_BREAKPOINT ? "mobile" : "desktop"
  }

  function getLayoutTransform(layout) {
    const scale = Math.min(
      viewport.width / layout.referenceWidth,
      viewport.height / layout.referenceHeight,
    )

    return {
      scale,
      offsetX: (viewport.width - layout.referenceWidth * scale) * 0.5,
      offsetY: (viewport.height - layout.referenceHeight * scale) * 0.5,
    }
  }

  function screenToWorld(screenX, screenY, z = 0) {
    return {
      x: screenX - viewport.width * 0.5,
      y: viewport.height * 0.5 - screenY,
      z,
    }
  }

  function setVisualMode(mode) {
    if (mode !== "contact" && mode !== "hero") return

    currentVisualMode = mode

    if (mode === "hero") {
      sphere.material = silverSphereMaterial
      scene.environment = environmentMap
      scene.environmentRotation.y = HERO_VIEW_ROTATION_Y
    } else {
      sphere.material = texturedSphereMaterial
      scene.environment = null
    }

    if (isReady && !contextLost) {
      render()
    }
  }

  function applyPlaneLayout(plane, asset, item, layout, transform, groupCenterY = null) {
    const referenceWidth = asset.width / layout.exportScale
    const referenceHeight = referenceWidth / asset.aspectRatio
    const planeScale = Math.max(transform.scale, item.minScale ?? 0)
    const width = referenceWidth * planeScale
    const height = referenceHeight * planeScale
    const referenceCenterX = item.align === "left" ? item.x + referenceWidth * 0.5 : item.x
    const referenceCenterY = item.top + referenceHeight * 0.5
    const screenY =
      groupCenterY === null
        ? transform.offsetY + referenceCenterY * transform.scale
        : transform.offsetY +
          groupCenterY * transform.scale +
          (referenceCenterY - groupCenterY) * planeScale
    const position = screenToWorld(
      transform.offsetX + referenceCenterX * transform.scale,
      screenY,
      10,
    )

    plane.scale.set(width, height, 1)
    plane.position.set(position.x, position.y, position.z)
  }

  function applyBottomLeftPlaneLayout(plane, asset, item, layout, transform, frameBounds) {
    const referenceWidth = asset.width / layout.exportScale
    const referenceHeight = referenceWidth / asset.aspectRatio
    const contentScale = Math.max(transform.scale, 0.9)

    const width = referenceWidth * contentScale
    const height = referenceHeight * contentScale

    const position = screenToWorld(
      frameBounds.left + item.left * transform.scale + width * 0.5,
      frameBounds.bottom - item.bottom * contentScale - height * 0.5,
      10,
    )

    plane.scale.set(width, height, 1)
    plane.position.set(position.x, position.y, position.z)
  }

  function applyTextureSet(layoutName) {
    if (!textures || currentLayoutName === layoutName) return

    Object.entries(textPlanes).forEach(([name, plane]) => {
      plane.material.map = textures[layoutName][name].texture
      plane.material.needsUpdate = true
    })

    texturedSphereMaterial.map = textures[layoutName].sphere.texture
    texturedSphereMaterial.needsUpdate = true

    currentLayoutName = layoutName
  }

  function applyEnvironmentBackdropLayout(frameBounds) {
    const frameWidth = Math.max(frameBounds.width, 1)
    const frameHeight = Math.max(frameBounds.height, 1)
    const frameRadius = Number.parseFloat(window.getComputedStyle(frame).borderTopLeftRadius) || 0
    const position = screenToWorld(
      frameBounds.left + frameWidth * 0.5,
      frameBounds.top + frameHeight * 0.5,
    )

    backgroundMask.geometry.dispose()
    backgroundMask.geometry = createRoundedFrameGeometry(frameWidth, frameHeight, frameRadius)
    backgroundMask.position.set(position.x, position.y, 0)

    backgroundCamera.aspect = frameWidth / frameHeight
    backgroundCamera.updateProjectionMatrix()
  }

  function applyLayout() {
    if (!textures) return

    const layoutName = getLayoutName()
    const layout = LAYOUTS[layoutName]
    const transform = getLayoutTransform(layout)
    const frameBounds = frame.getBoundingClientRect()
    let desktopTextGroupCenterY = null

    if (layoutName === "desktop") {
      const availabilityAsset = textures.desktop.availability
      const availabilityReferenceWidth = availabilityAsset.width / LAYOUTS.desktop.exportScale
      const availabilityReferenceHeight = availabilityReferenceWidth / availabilityAsset.aspectRatio

      desktopTextGroupCenterY =
        (layout.planes.headline.top +
          layout.planes.availability.top +
          availabilityReferenceHeight) *
        0.5
    }

    applyTextureSet(layoutName)
    applyEnvironmentBackdropLayout(frameBounds)

    Object.entries(textPlanes).forEach(([name, plane]) => {
      const item = layout.planes[name]

      if (layoutName === "desktop" && item.anchor === "bottom-left") {
        applyBottomLeftPlaneLayout(
          plane,
          textures[layoutName][name],
          item,
          layout,
          transform,
          frameBounds,
        )
        return
      }

      const groupCenterY =
        layoutName === "desktop" && (name === "headline" || name === "availability")
          ? desktopTextGroupCenterY
          : null

      applyPlaneLayout(plane, textures[layoutName][name], item, layout, transform, groupCenterY)
    })

    const spherePosition = screenToWorld(
      transform.offsetX + layout.sphere.centerX * transform.scale,
      transform.offsetY + layout.sphere.centerY * transform.scale,
    )
    const sphereRadius = layout.sphere.diameter * transform.scale * 0.5

    sphere.scale.setScalar(sphereRadius)
    sphere.position.x = spherePosition.x
    sphereBaseY = spherePosition.y
    sphereFloatAmplitude = layout.floatAmplitude * transform.scale
    sphere.position.y = sphereBaseY
  }

  function render() {
    if (isDestroyed || contextLost) return false

    renderer.clear(true, true, true)

    if (currentVisualMode === "hero" && environmentMap) {
      renderer.render(backgroundMaskScene, camera)
      renderer.render(backgroundScene, backgroundCamera)
      renderer.clearDepth()
    }

    renderer.render(scene, camera)
    return true
  }

  function resize() {
    if (isDestroyed) return

    viewport.width = Math.max(root.clientWidth, 1)
    viewport.height = Math.max(root.clientHeight, 1)

    camera.left = viewport.width * -0.5
    camera.right = viewport.width * 0.5
    camera.top = viewport.height * 0.5
    camera.bottom = viewport.height * -0.5
    camera.updateProjectionMatrix()

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
    renderer.setSize(viewport.width, viewport.height, false)

    applyLayout()

    if (isReady && !contextLost) {
      render()
    }
  }

  function stopAnimationLoop() {
    isRunning = false

    if (animationFrameId === null) return

    window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  function tick(currentTime) {
    animationFrameId = null

    if (!isRunning || isDestroyed || contextLost) return

    const deltaTime = lastFrameTime ? Math.min((currentTime - lastFrameTime) / 1000, 1 / 30) : 0

    lastFrameTime = currentTime
    elapsedTime += deltaTime

    sphere.rotation.y = sphereInitialRotationY + elapsedTime * SPHERE_ROTATION_SPEED
    sphere.position.y =
      sphereBaseY + Math.sin(elapsedTime * SPHERE_FLOAT_SPEED) * sphereFloatAmplitude

    if (currentVisualMode === "hero") {
      scene.environmentRotation.y = HERO_VIEW_ROTATION_Y + elapsedTime * SPHERE_ROTATION_HERO_SPEED
    }

    try {
      render()
    } catch (error) {
      console.error("Unable to render the Contact WebGL scene.", error)
      destroy()
      return
    }

    if (isRunning) {
      animationFrameId = window.requestAnimationFrame(tick)
    }
  }

  function startAnimationLoop() {
    if (isDestroyed || contextLost || !isReady || isRunning || reducedMotion || document.hidden) {
      return
    }

    isRunning = true
    lastFrameTime = 0
    animationFrameId = window.requestAnimationFrame(tick)
  }

  function start() {
    if (isDestroyed) return

    wantsToRun = true

    if (reducedMotion) {
      render()
      return
    }

    startAnimationLoop()
  }

  function stop() {
    wantsToRun = false
    stopAnimationLoop()
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stopAnimationLoop()
      return
    }

    if (wantsToRun) {
      startAnimationLoop()
    } else if (isReady) {
      render()
    }
  }

  function handleContextLost(event) {
    event.preventDefault()
    contextLost = true
    stopAnimationLoop()
    root.classList.remove("is-webgl-ready")
  }

  function handleContextRestored() {
    if (isDestroyed || !isReady) return

    contextLost = false

    try {
      resize()
      render()
      root.classList.add("is-webgl-ready")

      if (wantsToRun) {
        startAnimationLoop()
      }
    } catch (error) {
      console.error("Unable to restore the Contact WebGL scene.", error)
      destroy()
    }
  }

  const resizeObserver = new ResizeObserver(resize)

  resizeObserver.observe(root)
  window.addEventListener("resize", resize, { passive: true })
  document.addEventListener("visibilitychange", handleVisibilityChange)
  canvas.addEventListener("webglcontextlost", handleContextLost)
  canvas.addEventListener("webglcontextrestored", handleContextRestored)

  resize()

  const ready = (async () => {
    try {
      const [loadedTextures, loadedEnvironment] = await Promise.all([
        textureLoader.ready,
        environmentLoader.ready,
      ])

      if (!loadedTextures || !loadedEnvironment || isDestroyed) return false

      textures = loadedTextures
      environmentMap = loadedEnvironment.environmentMap
      backgroundMaterial.uniforms.envMap.value = loadedEnvironment.backgroundMap
      setVisualMode(currentVisualMode)

      currentLayoutName = null
      applyLayout()

      await Promise.all([
        renderer.compileAsync(backgroundMaskScene, camera),
        renderer.compileAsync(backgroundScene, backgroundCamera),
        renderer.compileAsync(scene, camera),
      ])

      if (isDestroyed || contextLost) return false
      if (!render()) return false

      isReady = true
      root.classList.add("is-webgl-ready")

      if (wantsToRun) {
        startAnimationLoop()
      }

      return true
    } catch (error) {
      if (!isDestroyed) {
        console.error("Unable to prepare the Contact WebGL scene.", error)
        destroy()
      }

      return false
    }
  })()

  function destroy() {
    if (isDestroyed) return

    isDestroyed = true
    wantsToRun = false
    root.classList.remove("is-webgl-ready")

    stopAnimationLoop()
    resizeObserver.disconnect()

    window.removeEventListener("resize", resize)
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    canvas.removeEventListener("webglcontextlost", handleContextLost)
    canvas.removeEventListener("webglcontextrestored", handleContextRestored)

    textureLoader.dispose()
    environmentLoader.dispose()

    Object.values(textPlanes).forEach((plane) => {
      plane.geometry.dispose()
      plane.material.dispose()
    })

    scene.environment = null
    backgroundMaterial.uniforms.envMap.value = null

    sphereGeometry.dispose()
    texturedSphereMaterial.dispose()
    silverSphereMaterial.dispose()
    backgroundMask.geometry.dispose()
    backgroundMaskMaterial.dispose()
    backgroundGeometry.dispose()
    backgroundMaterial.dispose()

    scene.clear()
    backgroundScene.clear()
    backgroundMaskScene.clear()
    renderer.dispose()

    textures = null
    environmentMap = null
  }

  return {
    ready,
    start,
    stop,
    resize,
    destroy,
    setVisualMode,
  }
}
