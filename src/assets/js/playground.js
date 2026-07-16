import { gsap } from "gsap"
import { Observer } from "gsap/Observer"

gsap.registerPlugin(Observer)

// ----------------------
// 1. Dom selections
// ----------------------
const stage = document.querySelector(".playground-sphere__stage")
const medias = stage.querySelectorAll(".playground-sphere__media")
const totalMedias = medias.length

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
  medias.forEach((media, index) => {
    const [x, y, z] = getTransformedPosition(index)
    const rot = getOrientationMatrix(x, -y, z)

    const position = `translate3d(${x * radius}px, ${-y * radius}px, ${z * radius}px)`
    const orientation = `matrix3d(${rot[0]},${rot[3]},${rot[6]},0,${rot[1]},${rot[4]},${rot[7]},0,${rot[2]},${rot[5]},${rot[8]},0,0,0,0,1)`

    media.style.transform = `${position} ${orientation} scaleX(-1)`
  })
}

renderMedias()

// ----------------------
// 8. Responsive radius + perspective + depth
// ----------------------
const container = document.querySelector(".playground-sphere__container")

const mm = gsap.matchMedia()

mm.add(
  {
    isMobile: "(max-width: 500px)",
    isTablet: "(min-width: 501px) and (max-width: 1400px)",
    isDesktop: "(min-width: 1401px)",
  },
  (context) => {
    const { isMobile, isTablet } = context.conditions

    if (isMobile) {
      radius = 310
      gsap.set(stage, { translateZ: "250px" })
      gsap.set(container, { perspective: "1000px" })
    } else if (isTablet) {
      radius = 980
      gsap.set(stage, { translateZ: "-310px" })
      gsap.set(container, { perspective: "3920px" })
    } else {
      radius = 0.7 * window.innerWidth
      gsap.set(stage, { translateZ: "-22vw" })
      gsap.set(container, { perspective: "280vw" })
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

let snapTween = null

function snapToIndex(index, instant) {
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

  snapTween = gsap.to(snap, {
    t: 1,
    duration: 1,
    ease: "expo.inOut",
    onUpdate() {
      for (let k = 0; k < 9; k++) {
        m[k] = mStart[k]
      }
      premultiply3x3(axisAngleMatrix(ax, ay, 0, angle * snap.t))
      renderMedias()
    },
    onComplete() {
      snapTween = null
    },
  })
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

function onMediaClick(e) {
  if (dragDist > 3) return

  const media = e.target.closest(".playground-sphere__media")
  if (!media) return

  const index = Array.prototype.indexOf.call(medias, media)
  if (index === -1) return

  moving = false
  snapToIndex(index)
}

stage.addEventListener("click", onMediaClick)

// ----------------------
// 19. Center the closest card immediately on page load
// ----------------------
snapToClosest(true)
