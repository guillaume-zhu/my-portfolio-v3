import { gsap } from "gsap"
import { Observer } from "gsap/Observer"

import { createSiteHeader } from "../../shared/site-header/createSiteHeader"
import { prefersReducedMotion } from "../../shared/motion/preference"
import { createIncomingPageTransition } from "../../shared/page-transition/createPageTransition"
import { setupCrossPageTransitions } from "../../shared/page-transition/setupCrossPageTransitions"

gsap.registerPlugin(Observer)
createSiteHeader()

// Page transition
const { pageTransition, shouldRevealTransition } = createIncomingPageTransition()

setupCrossPageTransitions({
  pageTransition,
})

// ----------------------
// 1. Dom selections
// ----------------------
const sphere = document.querySelector(".playground-sphere")
const stage = document.querySelector(".playground-sphere__stage")
const medias = stage.querySelectorAll(".playground-sphere__media")
const totalMedias = medias.length
const initialMedia = stage.querySelector(".playground-sphere__media--first")
const initialMediaIndex = initialMedia ? Array.prototype.indexOf.call(medias, initialMedia) : 0

const caption = document.querySelector(".playground-sphere__caption")
const captionTitle = caption.querySelector(".playground-sphere__caption-title")
const captionMeta = caption.querySelector(".playground-sphere__caption-meta")

let introProgress = 0
let currentCaptionIndex = -1
let isCaptionVisible = false
let canShowCaption = false

const videoStates = []

// ----------------------
// 2. Sphere config
// ----------------------
let radius = 500
const goldenAngle = Math.PI * (3 - Math.sqrt(5))

// ----------------------
// 3. Position on sphere (Fibonacci spiral)
// ----------------------
function getSpherePosition(index) {
  const y = 1 - (2 * index) / (totalMedias - 1 || 1)
  const phi = Math.acos(y) - Math.PI / 2
  const theta = (index * goldenAngle) % (2 * Math.PI)

  return {
    x: Math.cos(phi) * Math.cos(theta),
    y: Math.sin(phi),
    z: Math.cos(phi) * Math.sin(theta),
  }
}

// ----------------------
// 4. Orientation tangent to the sphere
// ----------------------
function getOrientationMatrix(fx, fy, fz) {
  // Initial up vector
  let ux = 0
  let uy = -1
  let uz = 0

  // Cross product up × forward = "right" vector
  let rx = uy * fz - uz * fy
  let ry = uz * fx - ux * fz
  let rz = ux * fy - uy * fx

  let len = Math.hypot(rx, ry, rz)
  if (len < 1e-6) {
    ux = 0
    uy = 0
    uz = 1
    rx = uy * fz - uz * fy
    ry = uz * fx - ux * fz
    rz = ux * fy - uy * fx
    len = Math.hypot(rx, ry, rz)
  }

  // Normalize right vector
  const il = 1 / len
  rx *= il
  ry *= il
  rz *= il

  // Cross product forward × right = card's actual "up" vector
  const ux2 = fy * rz - fz * ry
  const uy2 = fz * rx - fx * rz
  const uz2 = fx * ry - fy * rx

  // 3x3 matrix ready to plug into CSS matrix3d
  return [rx, -ux2, fx, ry, -uy2, fy, rz, -uz2, fz]
}

// ----------------------
// 5. Sphere rotation state
// ----------------------
let m = [1, 0, 0, 0, 1, 0, 0, 0, 1]
const mTmp = [0, 0, 0, 0, 0, 0, 0, 0, 0]

function premultiply3x3(left) {
  for (let i = 0; i < 3; i++) {
    const a = left[i * 3],
      b = left[i * 3 + 1],
      c = left[i * 3 + 2]
    for (let j = 0; j < 3; j++) {
      mTmp[i * 3 + j] = a * m[j] + b * m[3 + j] + c * m[6 + j]
    }
  }
  for (let k = 0; k < 9; k++) m[k] = mTmp[k]
}

// ----------------------
// 6. Card base positions (computed once) + Apply Sphere rotation
// ----------------------
const basePositions = []
medias.forEach((_, index) => {
  basePositions.push(getSpherePosition(index))
})

function getTransformedPosition(index) {
  const p = basePositions[index]
  return [
    m[0] * p.x + m[1] * p.y + m[2] * p.z,
    m[3] * p.x + m[4] * p.y + m[5] * p.z,
    m[6] * p.x + m[7] * p.y + m[8] * p.z,
  ]
}
// ----------------------
// 7. Render: apply current position + orientation to each card
// ----------------------
function renderMedias() {
  const secondaryRevealProgress = gsap.utils.clamp(0, 1, (introProgress - 0.04) / 0.22)

  medias.forEach((media, index) => {
    const [x, y, z] = getTransformedPosition(index)
    const cardProgress = z > 0 ? introProgress : 1

    // Final card direction when fully placed on sphere
    const finalDirX = x
    const finalDirY = -y
    const finalDirZ = z

    // Blend start direction (0,0,1) to final direction
    const blendX = finalDirX * cardProgress
    const blendY = finalDirY * cardProgress
    const blendZ = finalDirZ * cardProgress + (1 - cardProgress)

    // Calculate and normalize direction
    const blendLen = Math.hypot(blendX, blendY, blendZ) || 1
    const dirX = blendX / blendLen
    const dirY = blendY / blendLen
    const dirZ = blendZ / blendLen

    // Calculate final orientation on sphere to be tangeant
    const rot = getOrientationMatrix(dirX, dirY, dirZ)

    // Translation grows from 0 to full radius
    const tx = x * radius * cardProgress
    const ty = -y * radius * cardProgress
    const tz = z * radius * cardProgress

    // Apply transformation to CSS
    const position = `translate3d(${tx}px, ${ty}px, ${tz}px)`
    const orientation = `matrix3d(${rot[0]},${rot[3]},${rot[6]},0,${rot[1]},${rot[4]},${rot[7]},0,${rot[2]},${rot[5]},${rot[8]},0,0,0,0,1)`

    media.style.transform = `${position} ${orientation} scaleX(-1) scale(var(--click-scale))`
    media.style.opacity = index === initialMediaIndex ? "1" : String(secondaryRevealProgress)
  })
}

renderMedias()

// ----------------------
// 8. Responsive radius + perspective + depth
// ----------------------
const container = document.querySelector(".playground-sphere__container")

const mm = gsap.matchMedia()

function applyFluidSphereSettings(radiusScale = 1) {
  const viewportWidth = window.innerWidth
  const cardWidth = medias[0].offsetWidth

  const widthBasedRadius = 0.6 * viewportWidth * radiusScale
  const cardBasedRadius = 2.5 * cardWidth * radiusScale
  const heightBasedRadiusLimit = 1.1 * window.innerHeight * radiusScale

  const cardSpacingRadius = Math.min(cardBasedRadius, heightBasedRadiusLimit)

  radius = Math.max(widthBasedRadius, cardSpacingRadius)

  const frontDepth = 0.38 * viewportWidth

  gsap.set(stage, {
    translateZ: `${frontDepth - radius}px`,
  })

  gsap.set(container, {
    perspective: `${viewportWidth * 2.8}px`,
  })
}

mm.add(
  {
    isMobile: "(max-width: 500px)",
    isTablet: "(min-width: 501px) and (max-width: 1400px)",
    isDesktop: "(min-width: 1401px)",
    isCompactMobileLandscape:
      "(orientation: landscape) and (max-width: 500px) and (max-height: 420px)",
  },
  (context) => {
    const { isMobile, isTablet, isCompactMobileLandscape } = context.conditions

    if (isMobile) {
      radius = isCompactMobileLandscape ? 215 : 340
      gsap.set(stage, {
        translateZ: isCompactMobileLandscape ? "355px" : "230px",
      })
      gsap.set(container, { perspective: "1000px" })
    } else if (isTablet) {
      applyFluidSphereSettings(1.06)
    } else {
      applyFluidSphereSettings()
    }

    renderMedias()
  },
)

// ----------------------
// 9. Gesture state
// ----------------------
// smooth = eased value used to rotate sphere
// target = raw value pushing smooth
const smooth = { x: 0, y: 0 }
const target = { x: 0, y: 0 }

let prevX = 0
let prevY = 0

let moving = false

// ----------------------
// 10. Convert eased gesture into rotation, applied to m
// ----------------------
const R = [0, 0, 0, 0, 0, 0, 0, 0, 0]

function updateMedias() {
  const dY = ((smooth.y - prevY) * Math.PI) / 180
  const dX = ((smooth.x - prevX) * Math.PI) / 180
  prevY = smooth.y
  prevX = smooth.x

  if (dX !== 0 || dY !== 0) {
    const cy = Math.cos(dY),
      sy = Math.sin(dY)
    const cx = Math.cos(dX),
      sx = Math.sin(dX)

    R[0] = cy
    R[1] = 0
    R[2] = sy
    R[3] = sx * sy
    R[4] = cx
    R[5] = -sx * cy
    R[6] = -cx * sy
    R[7] = sx
    R[8] = cx * cy

    premultiply3x3(R)
  }

  renderMedias()
  updateCaption()
  positionCaption()
  updateVideoVisibility()
}

// ----------------------
// 11. Ease smooth toward target
// ----------------------
const quickY = gsap.quickTo(smooth, "y", {
  duration: 2,
  ease: "power2",
  onUpdate: updateMedias,
  onComplete: settle,
})
const quickX = gsap.quickTo(smooth, "x", {
  duration: 2,
  ease: "power2",
})

// ----------------------
// 12. Reset gesture tracking to zero without visually jumping
// ----------------------
function rebase() {
  target.x = target.y = 0
  prevX = prevY = 0
  quickX(0, 0)
  quickY(0, 0)
  smooth.x = smooth.y = 0
}

// ----------------------
// 13. Track gesture start/end
// ----------------------
function onInput() {
  cancelSnap()

  if (!moving) {
    moving = true
    rebase()
  }
}

function endGesture() {
  moving = false
  settle()
}

// ----------------------
// 14. Observer: listen to wheel and drag
// ----------------------
const gsapObs = Observer.create({
  target: container,
  type: "wheel,touch,pointer",
  onWheel: (e) => {
    onInput()
    target.y -= e.deltaX / 10
    target.x -= e.deltaY / 10
    quickY(target.y)
    quickX(target.x)
  },
  onPress: () => {
    dragDist = 0
  },
  onDrag: (e) => {
    dragDist += Math.abs(e.deltaX) + Math.abs(e.deltaY)
    onInput()
    target.y += e.deltaX * 0.15
    target.x += e.deltaY * 0.15
    quickY(target.y)
    quickX(target.x)
  },
  onDragEnd: endGesture,
  onStop: endGesture,
})

// ----------------------
// 15. Find the front-facing card closest to screen center
// ----------------------
function findClosestIndex() {
  let closestIndex = 0
  let closestDist = Infinity

  for (let i = 0; i < totalMedias; i++) {
    const result = getTransformedPosition(i)
    const x = result[0]
    const y = result[1]
    const z = result[2]

    if (z <= 0) continue

    const dist = x * x + y * y

    if (dist < closestDist) {
      closestDist = dist
      closestIndex = i
    }
  }
  return closestIndex
}

// ----------------------
// 16. Rotate the sphere so a given card lands at screen center
// ----------------------
// Helper rotation matrix
function axisAngleMatrix(ax, ay, az, angle) {
  const c = Math.cos(angle),
    s = Math.sin(angle),
    t = 1 - c
  return [
    t * ax * ax + c,
    t * ax * ay - s * az,
    t * ax * az + s * ay,
    t * ax * ay + s * az,
    t * ay * ay + c,
    t * ay * az - s * ax,
    t * ax * az - s * ay,
    t * ay * az + s * ax,
    t * az * az + c,
  ]
}

let selectedMediaIndex = initialMediaIndex
let snapTween = null

function cancelSnap() {
  const tween = snapTween
  if (!tween) return

  tween.kill()

  if (snapTween === tween) {
    snapTween = null
  }
}

function snapToIndex(index, instant) {
  selectedMediaIndex = index
  cancelSnap()

  // Initial position
  const [vx, vy, vz] = getTransformedPosition(index)

  // How decentred is
  const sin = Math.hypot(vx, vy)
  if (sin < 0.02) return

  // Axes and angle to apply to get to center
  const ax = vy / sin
  const ay = -vx / sin
  const angle = Math.acos(Math.max(-1, Math.min(1, vz)))

  rebase()

  // Instant initial snap
  if (instant) {
    premultiply3x3(axisAngleMatrix(ax, ay, 0, angle))
    renderMedias()
    return
  }

  // Copy m
  const mStart = m.slice()
  const snap = { t: 0 }

  const tween = gsap.to(snap, {
    t: 1,
    duration: prefersReducedMotion ? 0.25 : 1,
    ease: prefersReducedMotion ? "power2.out" : "expo.inOut",
    onUpdate() {
      for (let k = 0; k < 9; k++) {
        m[k] = mStart[k]
      }
      premultiply3x3(axisAngleMatrix(ax, ay, 0, angle * snap.t))
      renderMedias()
      updateCaption()
      positionCaption()
      updateVideoVisibility()
    },
    onComplete() {
      if (snapTween === tween) {
        snapTween = null
      }
    },
  })

  snapTween = tween
}

// ----------------------
// 17. Trigger the snap once everything has fully stopped moving
// ----------------------
function snapToClosest(instant) {
  snapToIndex(findClosestIndex(), instant)
}

function settle() {
  if (moving || snapTween) return
  if (Math.abs(target.x - smooth.x) > 0.5 || Math.abs(target.y - smooth.y) > 0.5) return
  snapToClosest()
}

// ----------------------
// 18. Click on a card: rotate the sphere to center it
// ----------------------
let dragDist = 0

function getMediaWaveTargets(clickedIndex) {
  const clickedPosition = basePositions[clickedIndex]

  return basePositions
    .map((position, index) => {
      const dotProduct =
        clickedPosition.x * position.x +
        clickedPosition.y * position.y +
        clickedPosition.z * position.z

      const angularDistance = Math.acos(gsap.utils.clamp(-1, 1, dotProduct))

      return {
        index,
        angularDistance,
      }
    })
    .sort((a, b) => a.angularDistance - b.angularDistance)
    .slice(0, 9)
}

function playMediaClickWave(clickedIndex) {
  const waveTargets = getMediaWaveTargets(clickedIndex)

  waveTargets.forEach(({ index }, rank) => {
    const media = medias[index]
    const isClickedMedia = rank === 0

    const neighborProgress = Math.max(0, rank - 1) / Math.max(1, waveTargets.length - 2)

    const pressScale = isClickedMedia ? 0.85 : gsap.utils.interpolate(0.95, 0.978, neighborProgress)

    const reboundScale = isClickedMedia
      ? 1.02
      : gsap.utils.interpolate(1.02, 1.008, neighborProgress)

    gsap.to(media, {
      keyframes: [
        {
          "--click-scale": pressScale,
          duration: 0.1,
          ease: "power2.in",
        },
        {
          "--click-scale": reboundScale,
          duration: 0.4,
          ease: "back.out(2)",
        },
        {
          "--click-scale": 1,
          duration: 0.2,
          ease: "power2.out",
        },
      ],
      delay: rank * 0.025,
      overwrite: true,
    })
  })
}

function selectMedia(index) {
  moving = false
  playMediaClickWave(index)
  snapToIndex(index)
}

function onMediaClick(e) {
  if (dragDist > 3) return

  const media = e.target.closest(".playground-sphere__media")
  if (!media) return

  const index = Array.prototype.indexOf.call(medias, media)
  if (index === -1) return

  selectMedia(index)
}

function onSphereKeydown(event) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return

  event.preventDefault()

  const direction = event.key === "ArrowRight" ? 1 : -1
  const nextIndex = (selectedMediaIndex + direction + totalMedias) % totalMedias

  selectMedia(nextIndex)
}

stage.addEventListener("click", onMediaClick)
sphere.addEventListener("keydown", onSphereKeydown)

// ----------------------
// 19. Center the closest card immediately on page load
// ----------------------
snapToIndex(initialMediaIndex, true)

// ----------------------
// 20. Intro animation: explode cards from center to their sphere position
// ----------------------
gsapObs.disable()

const intro = { progress: 0 }
let isObserverEnabled = false
const introTimeline = gsap.timeline({
  paused: true,
})

gsap.set(stage, {
  scale: 0.8,
})

introTimeline.to(
  stage,
  {
    scale: 1,
    duration: 1.4,
    ease: "power3.out",
  },
  0,
)

introTimeline.to(
  intro,
  {
    progress: 1,
    duration: 3,
    ease: "power4.out",

    onUpdate: () => {
      introProgress = intro.progress
      renderMedias()

      if (!isObserverEnabled && introProgress >= 0.7) {
        isObserverEnabled = true
        gsapObs.enable()
      }
    },

    onComplete: () => {
      updateVideoVisibility()
    },
  },
  0,
)

introTimeline.call(
  () => {
    canShowCaption = true
    updateCaption()
  },
  [],
  ">-=2.5",
)

function startPlaygroundIntro() {
  if (prefersReducedMotion) {
    if (shouldRevealTransition) {
      pageTransition.reveal()
    }

    introTimeline.progress(1)
    return
  }

  if (shouldRevealTransition) {
    pageTransition.reveal()
    gsap.delayedCall(0.2, () => {
      introTimeline.play()
    })
    return
  }

  gsap.delayedCall(0.15, () => {
    introTimeline.play()
  })
}

startPlaygroundIntro()

// ----------------------
// 21. Update shared caption based on centered card
// ----------------------

function updateCaption() {
  if (!canShowCaption) {
    caption.classList.remove("is-visible")
    return
  }

  const index = findClosestIndex()
  const [, , z] = getTransformedPosition(index)

  const hasCenteredCard = z > 0.98

  if (!hasCenteredCard) {
    caption.classList.remove("is-visible")
    isCaptionVisible = false
    return
  }

  if (index === currentCaptionIndex && isCaptionVisible) return

  currentCaptionIndex = index

  const media = medias[index]
  captionTitle.textContent = media.dataset.title || ""
  captionMeta.textContent = media.dataset.meta || ""

  caption.classList.add("is-visible")
  isCaptionVisible = true
  positionCaption()
}

function positionCaption() {
  if (currentCaptionIndex === -1) return

  const [x, y, z] = getTransformedPosition(currentCaptionIndex)

  const rot = getOrientationMatrix(x, -y, z)

  // Same projection as the cards
  const tx = x * radius * introProgress
  const ty = -y * radius * introProgress
  const tz = z * radius * introProgress

  const centeredMedia = medias[currentCaptionIndex]
  const cardHalfHeight = centeredMedia.offsetHeight / 2
  const captionGap = parseFloat(getComputedStyle(container).getPropertyValue("--caption-gap")) || 20
  const offset = cardHalfHeight + captionGap

  const position = `translate3d(${tx}px, ${ty}px, ${tz}px)`
  const orientation = `matrix3d(${rot[0]},${rot[3]},${rot[6]},0,${rot[1]},${rot[4]},${rot[7]},0,${rot[2]},${rot[5]},${rot[8]},0,0,0,0,1)`
  const localOffset = `translateY(${offset}px)`

  caption.style.transform = `${position} ${orientation} ${localOffset} scaleX(-1)`
}

// ----------------------
// 22. Play/pause videos based on sphere visibility
// ----------------------

medias.forEach((media, index) => {
  const video = media.querySelector("video")
  videoStates[index] = video ? "paused" : null
})

const PLAY_THRESHOLD = prefersReducedMotion ? 0.96 : 0.9
const PAUSE_THRESHOLD = prefersReducedMotion ? 0.92 : 0.85

function updateVideoVisibility() {
  for (let i = 0; i < totalMedias; i++) {
    if (videoStates[i] === null) continue

    const [, , z] = getTransformedPosition(i)
    const video = medias[i].querySelector("video")

    if (videoStates[i] === "paused" && z > PLAY_THRESHOLD) {
      videoStates[i] = "playing"
      video.play().catch(() => {})
    } else if (videoStates[i] === "playing" && z < PAUSE_THRESHOLD) {
      videoStates[i] = "paused"
      video.pause()
    }
  }
}

// ----------------------
// 23. Resize
// ----------------------

let resizeFrame = null

window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame)

  resizeFrame = requestAnimationFrame(() => {
    if (window.innerWidth > 500) {
      applyFluidSphereSettings()
      renderMedias()
    }

    positionCaption()
  })
})
