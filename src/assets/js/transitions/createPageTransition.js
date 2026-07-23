import gsap from "gsap"

const DEFAULT_TRANSITION_COLOR = "cream"

function normalizeTransitionColor(color) {
  return color === "dark" ? "dark" : DEFAULT_TRANSITION_COLOR
}

function applyTransitionColor(transition, color) {
  const normalizedColor = normalizeTransitionColor(color)

  transition.classList.remove("page-transition--cream", "page-transition--dark")

  transition.classList.add(`page-transition--${normalizedColor}`)

  return normalizedColor
}

function getOrCreateTransitionElement() {
  let transition = document.querySelector(".page-transition")

  if (transition) {
    return transition
  }

  transition = document.createElement("div")
  transition.classList.add("page-transition")
  transition.setAttribute("aria-hidden", "true")

  document.body.appendChild(transition)

  return transition
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}

export function createPageTransition({
  initiallyCovered = false,
  color = DEFAULT_TRANSITION_COLOR,
} = {}) {
  const transition = getOrCreateTransitionElement()

  let currentColor = applyTransitionColor(transition, color)

  let isTransitioning = initiallyCovered

  gsap.set(transition, {
    xPercent: initiallyCovered ? 0 : 100,
    borderRadius: initiallyCovered ? "0 60vh 60vh 0" : "60vh 0 0 60vh",
    pointerEvents: initiallyCovered ? "auto" : "none",
  })

  function setColor(color) {
    currentColor = applyTransitionColor(transition, color)

    return currentColor
  }

  function cover() {
    if (isTransitioning) return Promise.resolve(false)

    isTransitioning = true

    return new Promise((resolve) => {
      gsap.to(transition, {
        xPercent: 0,
        duration: 0.85,
        ease: "expo.inOut",
        pointerEvents: "auto",

        onComplete: () => {
          resolve(true)
        },
      })
    })
  }

  async function reveal({ mode = "slide" } = {}) {
    await waitForNextPaint()

    gsap.set(transition, {
      borderRadius: "0 60vh 60vh 0",
    })

    return new Promise((resolve) => {
      gsap.to(transition, {
        xPercent: -100,
        duration: 0.75,
        ease: "power4.out",

        onComplete: () => {
          gsap.set(transition, {
            xPercent: 100,
            borderRadius: "60vh 0 0 60vh",
            pointerEvents: "none",
          })

          isTransitioning = false
          resolve(true)
        },
      })
    })
  }

  async function run(onCovered) {
    const didCover = await cover()

    if (!didCover) return false

    if (typeof onCovered === "function") {
      await onCovered()
    }

    await reveal()

    return true
  }

  async function navigateTo(url, { color = DEFAULT_TRANSITION_COLOR } = {}) {
    const transitionColor = setColor(color)

    const didCover = await cover()

    if (!didCover) return false

    sessionStorage.setItem("pageTransitionPending", "true")
    sessionStorage.setItem("pageTransitionColor", transitionColor)

    window.location.href = url

    return true
  }

  function reset() {
    gsap.killTweensOf(transition)

    gsap.set(transition, {
      xPercent: 100,
      borderRadius: "60vh 0 0 60vh",
      pointerEvents: "none",
    })

    isTransitioning = false
  }

  return {
    element: transition,
    cover,
    reveal,
    reset,
    run,
    navigateTo,
    setColor,
  }
}

export function createIncomingPageTransition() {
  const shouldRevealTransition = sessionStorage.getItem("pageTransitionPending") === "true"

  const storedColor = sessionStorage.getItem("pageTransitionColor")

  sessionStorage.removeItem("pageTransitionPending")
  sessionStorage.removeItem("pageTransitionColor")

  const transitionColor = normalizeTransitionColor(storedColor)

  const pageTransition = createPageTransition({
    initiallyCovered: shouldRevealTransition,
    color: transitionColor,
  })

  return {
    pageTransition,
    shouldRevealTransition,
    transitionColor,
  }
}
