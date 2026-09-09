import fragmentShader from "./shaders/fragment.glsl"
import vertexShader from "./shaders/vertex.glsl"

const DEFAULT_CONFIG = Object.freeze({
  radius: 0.35,
  velocityGain: 0.25,
  positionDamping: 0.1,
  velocityDamping: 0.15,
  strengthRise: 0.15,
  strengthDecay: 0.03,
  idleStrength: 0.01,
  idleSpeed: 1,
  idleFrequency: [5, 20],
  zoom: 1.05,
  maxPixelRatio: 1.5,
})

function frameIndependentDamping(damping, deltaTime) {
  return 1 - Math.pow(1 - damping, deltaTime * 60)
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader
  }

  const message = gl.getShaderInfoLog(shader)

  gl.deleteShader(shader)
  throw new Error(message || "Unable to compile the 404 shader.")
}

function createProgram(gl) {
  const program = gl.createProgram()
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader)
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader)

  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)

  gl.deleteShader(vertex)
  gl.deleteShader(fragment)

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program
  }

  const message = gl.getProgramInfoLog(program)

  gl.deleteProgram(program)
  throw new Error(message || "Unable to link the 404 shader program.")
}

function loadTexture(gl, imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.decoding = "async"

    image.addEventListener(
      "load",
      () => {
        const texture = gl.createTexture()

        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

        resolve({
          texture,
          width: image.naturalWidth || 1,
          height: image.naturalHeight || 1,
        })
      },
      { once: true },
    )

    image.addEventListener(
      "error",
      () => {
        reject(new Error(`Unable to load the 404 texture: ${imageUrl}`))
      },
      { once: true },
    )

    image.src = imageUrl
  })
}

export function createNotFoundScene({ imageUrl, reducedMotion = false, ...options } = {}) {
  const canvas = document.querySelector(".not-found__canvas")
  const scene = canvas?.closest(".not-found__scene")

  if (!canvas || !scene || !imageUrl) return null

  const config = {
    ...DEFAULT_CONFIG,
    ...options,
  }

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
    stencil: false,
  })

  if (!gl) return null

  let program

  try {
    program = createProgram(gl)
  } catch (error) {
    console.error("Unable to initialize the 404 WebGL scene.", error)
    return null
  }

  const positionBuffer = gl.createBuffer()
  const positionLocation = gl.getAttribLocation(program, "a_position")
  const uniformLocations = {
    image: gl.getUniformLocation(program, "u_image"),
    imageResolution: gl.getUniformLocation(program, "u_imageResolution"),
    resolution: gl.getUniformLocation(program, "u_resolution"),
    time: gl.getUniformLocation(program, "u_time"),
    idleSpeed: gl.getUniformLocation(program, "u_idleSpeed"),
    idleStrength: gl.getUniformLocation(program, "u_idleStrength"),
    idleFrequency: gl.getUniformLocation(program, "u_idleFrequency"),
    mouse: gl.getUniformLocation(program, "u_mouse"),
    velocity: gl.getUniformLocation(program, "u_velocity"),
    strength: gl.getUniformLocation(program, "u_strength"),
    radius: gl.getUniformLocation(program, "u_radius"),
    zoom: gl.getUniformLocation(program, "u_zoom"),
  }

  let animationFrame = 0
  let elapsedTime = 0
  let lastFrameTime = 0
  const targetMouse = { x: 0.5, y: 0.5 }
  const smoothedMouse = { x: 0.5, y: 0.5 }
  const previousMouse = { x: 0.5, y: 0.5 }
  const rawVelocity = { x: 0, y: 0 }
  const smoothedVelocity = { x: 0, y: 0 }
  let strength = 0
  let pointerActive = false
  let texture = null
  let isDestroyed = false
  let isRunning = false

  const supportsPointerInteraction = window.matchMedia("(hover: hover) and (pointer: fine)").matches

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

  gl.useProgram(program)
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  gl.uniform1i(uniformLocations.image, 0)
  gl.uniform1f(uniformLocations.idleSpeed, config.idleSpeed)
  gl.uniform1f(uniformLocations.idleStrength, reducedMotion ? 0 : config.idleStrength)
  gl.uniform2fv(uniformLocations.idleFrequency, config.idleFrequency)
  gl.uniform1f(uniformLocations.radius, config.radius)
  gl.uniform1f(uniformLocations.zoom, config.zoom)

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, config.maxPixelRatio)
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr))

    if (canvas.width === width && canvas.height === height) return

    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, width, height)
  }

  function render(frameTime = 0) {
    if (isDestroyed || !texture) return

    resize()

    const deltaTime = lastFrameTime
      ? Math.min(Math.max((frameTime - lastFrameTime) / 1000, 1 / 240), 1 / 30)
      : 1 / 60

    lastFrameTime = frameTime
    elapsedTime += deltaTime

    const positionFactor = frameIndependentDamping(config.positionDamping, deltaTime)

    smoothedMouse.x += (targetMouse.x - smoothedMouse.x) * positionFactor
    smoothedMouse.y += (targetMouse.y - smoothedMouse.y) * positionFactor

    rawVelocity.x = ((smoothedMouse.x - previousMouse.x) / deltaTime) * config.velocityGain
    rawVelocity.y = ((smoothedMouse.y - previousMouse.y) / deltaTime) * config.velocityGain
    previousMouse.x = smoothedMouse.x
    previousMouse.y = smoothedMouse.y

    const velocityFactor = frameIndependentDamping(config.velocityDamping, deltaTime)

    smoothedVelocity.x += (rawVelocity.x - smoothedVelocity.x) * velocityFactor
    smoothedVelocity.y += (rawVelocity.y - smoothedVelocity.y) * velocityFactor

    const pointerSpeed = Math.hypot(smoothedVelocity.x, smoothedVelocity.y)
    const targetStrength = pointerActive ? Math.min(pointerSpeed * 6, 1) : 0
    const strengthDamping = strength < targetStrength ? config.strengthRise : config.strengthDecay
    const strengthFactor = frameIndependentDamping(strengthDamping, deltaTime)

    strength += (targetStrength - strength) * strengthFactor

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform2f(uniformLocations.mouse, smoothedMouse.x, smoothedMouse.y)
    gl.uniform2f(uniformLocations.velocity, smoothedVelocity.x, smoothedVelocity.y)
    gl.uniform1f(uniformLocations.strength, strength)
    gl.uniform2f(uniformLocations.resolution, canvas.width, canvas.height)
    gl.uniform1f(uniformLocations.time, elapsedTime)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    scene.classList.add("is-webgl-ready")

    if (isRunning) {
      animationFrame = requestAnimationFrame(render)
    }
  }

  function start() {
    if (isDestroyed || isRunning || reducedMotion || document.hidden) return

    isRunning = true
    lastFrameTime = 0
    animationFrame = requestAnimationFrame(render)
  }

  function stop() {
    isRunning = false
    cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }

  function handlePointerMove(event) {
    const bounds = scene.getBoundingClientRect()

    targetMouse.x = (event.clientX - bounds.left) / bounds.width
    targetMouse.y = 1 - (event.clientY - bounds.top) / bounds.height
    pointerActive = true
  }

  function handlePointerLeave() {
    pointerActive = false
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stop()
      return
    }

    start()
  }

  function handleResize() {
    if (!reducedMotion || !texture) return

    render()
  }

  function handleContextLost(event) {
    event.preventDefault()
    stop()
    scene.classList.remove("is-webgl-ready")
  }

  if (supportsPointerInteraction && !reducedMotion) {
    scene.addEventListener("pointerenter", handlePointerMove, { passive: true })
    scene.addEventListener("pointermove", handlePointerMove, { passive: true })
    scene.addEventListener("pointerleave", handlePointerLeave)
  }

  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("resize", handleResize, { passive: true })
  canvas.addEventListener("webglcontextlost", handleContextLost)

  loadTexture(gl, imageUrl)
    .then((loadedImage) => {
      if (isDestroyed) {
        gl.deleteTexture(loadedImage.texture)
        return
      }

      texture = loadedImage.texture
      gl.uniform2f(uniformLocations.imageResolution, loadedImage.width, loadedImage.height)

      if (reducedMotion) {
        render()
        return
      }

      start()
    })
    .catch((error) => {
      console.error("Unable to prepare the 404 WebGL texture.", error)
    })

  function destroy() {
    if (isDestroyed) return

    isDestroyed = true
    stop()

    scene.removeEventListener("pointerenter", handlePointerMove)
    scene.removeEventListener("pointermove", handlePointerMove)
    scene.removeEventListener("pointerleave", handlePointerLeave)
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("resize", handleResize)
    canvas.removeEventListener("webglcontextlost", handleContextLost)

    if (texture) gl.deleteTexture(texture)

    gl.deleteBuffer(positionBuffer)
    gl.deleteProgram(program)
  }

  return {
    destroy,
  }
}
