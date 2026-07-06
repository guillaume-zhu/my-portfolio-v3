import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

gsap.registerPlugin(ScrollTrigger, SplitText)

// ----------------------
// 1. Lenis
// ----------------------
const lenis = new Lenis({
  anchors: true,
})

lenis.on("scroll", ScrollTrigger.update)

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

// ----------------------
// 2. Init
// ----------------------
document.fonts.ready.then(() => {
  const galleryData = setupProjectGallery()

  setupProjectScroll(galleryData)
  setupProjectNext()

  ScrollTrigger.refresh()
})

// ----------------------
// 3. Functions
// ----------------------

// Project scroll
function setupProjectScroll(galleryData) {
  // ----------------------
  // 1. DOM selections
  // ----------------------
  const root = document.querySelector(".project-scroll")
  const pinHeight = root.querySelector(".project-scroll__pin-height")
  const container = root.querySelector(".project-scroll__container")
  const track = root.querySelector(".project-scroll__track")
  const galleryPanel = root.querySelector(".project-panel--gallery")

  // ----------------------
  // 2. Settings
  // ----------------------
  const getScrollDistance = () => {
    return track.scrollWidth - container.clientWidth
  }
  const getGalleryPosition = () => {
    return galleryPanel.offsetLeft
  }
  const getRemainingDistance = () => {
    return getScrollDistance() - getGalleryPosition()
  }
  const galleryScrollDistance = galleryData.totalSteps * window.innerHeight

  // ----------------------
  // 3. ScrollTrigger
  // ----------------------
  const pageTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: pinHeight,
      start: "top top",
      end: () => `+=${getScrollDistance() + galleryScrollDistance}`,
      scrub: true,
      pin: container,
      markers: false,
      invalidateOnRefresh: true,
    },
  })

  // Start -> Gallery
  pageTimeline.to(track, {
    x: () => -getGalleryPosition(),
    duration: () => getGalleryPosition(),
    ease: "none",
  })

  // Gallery -> Gallery end
  pageTimeline.fromTo(
    galleryData.timeline,
    {
      progress: 0,
    },
    {
      progress: 1,
      duration: galleryScrollDistance,
      ease: "none",
    },
  )

  // Gallery -> End
  pageTimeline.to(track, {
    x: () => -getScrollDistance(),
    duration: () => getRemainingDistance(),
    ease: "none",
  })

  // Context text reveal
  addProjectContentRevals(pageTimeline, root, container)
}

// Project gallery
function setupProjectGallery() {
  // ----------------------
  // 1. DOM selections
  // ----------------------
  const gallery = document.querySelector(".project-gallery")
  const slidesContainer = gallery.querySelector(".project-gallery__slides")
  const slides = [...gallery.querySelectorAll(".project-gallery__slide")]

  // ----------------------
  // 2. Settings
  // ----------------------
  const flexValues = [0.1, 0.12, 0.56, 0.12, 0.1]
  const clipPathValues = [15, 5, 0, 5, 15, 15]

  // ----------------------
  // 3. Calculated values
  // ----------------------
  const totalSteps = slides.length - 5
  gsap.set(slidesContainer, {
    height: window.innerHeight + (totalSteps - 2) * 0.01 * window.innerHeight,
  })

  // ----------------------
  // 4. Initial state
  // ----------------------
  slides.forEach((slide, index) => {
    if (index >= 5) return

    const media = slide.querySelector(".project-gallery__media")

    gsap.set(slide, {
      flex: flexValues[index],
    })
    gsap.set(media, {
      clipPath: `inset(0 ${clipPathValues[index]}% round 20px)`,
    })
  })

  // ----------------------
  // 5. Animation timeline
  // ----------------------
  const galleryTimeline = gsap.timeline({
    paused: true,

    defaults: {
      duration: 1,
      ease: "none",
    },
  })

  // ----------------------
  // 6. Exit/Entry animation
  // ----------------------
  for (let step = 0; step < totalSteps; step++) {
    const outgoingMedia = slides[step].querySelector(".project-gallery__media")

    // Flex out
    galleryTimeline.to(
      slides[step],
      {
        flex: 0,
      },
      step,
    )

    // ClipPath out
    galleryTimeline.to(
      outgoingMedia,
      {
        clipPath: "inset(0 15% round 20px)",
      },
      step,
    )

    // Go up
    galleryTimeline.to(
      slidesContainer,
      {
        y: `-=${0.01 * window.innerHeight}`,
      },
      step,
    )

    // Attribute visible slide
    for (let position = 0; position < 5; position++) {
      const slideIndex = step + 1 + position
      const media = slides[slideIndex].querySelector(".project-gallery__media")

      // Flex in
      galleryTimeline.to(
        slides[slideIndex],
        {
          flex: flexValues[position],
        },
        step,
      )

      // ClipPath in
      galleryTimeline.fromTo(
        media,
        {
          clipPath: `inset(0 ${clipPathValues[position + 1]}% round 20px)`,
        },
        {
          clipPath: `inset(0 ${clipPathValues[position]}% round 20px)`,
        },
        step,
      )
    }
  }

  return {
    totalSteps,
    timeline: galleryTimeline,
  }
}

// Project content reveal
function addProjectContentRevals(pageTimeline, root, container) {
  // ----------------------
  // 1. DOM selections
  // ----------------------
  const context = root.querySelector(".project-context")
  const contextPanel = context.closest(".project-panel--context")
  const revealElements = context.querySelectorAll(".project-context__text, .project-context__link")
  const categories = context.querySelectorAll(".project-context__category")
  const ellipse = root.querySelector(".project-ellipse")

  // ----------------------
  // 2. Split text
  // ----------------------
  const contentSplit = SplitText.create(revealElements, {
    type: "lines",
    linesClass: "project-context__line",
  })

  // ----------------------
  // 3. Initial states
  // ----------------------
  gsap.set(categories, {
    opacity: 0,
    y: 20,
  })
  gsap.set(ellipse, {
    opacity: 0,
    y: 20,
  })

  // ----------------------
  // 4. Timing calcutation
  // ----------------------

  const getContextLeft = () => {
    return contextPanel.offsetLeft + context.offsetLeft
  }
  const getContextRevealStart = () => {
    return getContextLeft() + context.offsetWidth - container.clientWidth
  }
  const getContextRevealEnd = () => {
    return getContextLeft() + context.offsetWidth / 2 - container.clientWidth / 2
  }

  // ----------------------
  // 5. Text lines reveal
  // ----------------------
  const contextRevealDuration = getContextRevealEnd() - getContextRevealStart()
  const lineDuration = contextRevealDuration / contentSplit.lines.length

  pageTimeline.to(
    contentSplit.lines,
    {
      maskImage: "linear-gradient(90deg, #000 100%, transparent 125%)",
      webkitMaskImage: "linear-gradient(90deg, #000 100%, transparent 125%)",
      duration: lineDuration,
      ease: "power1.inOut",
      stagger: {
        each: lineDuration,
      },
    },
    getContextRevealStart(),
  )

  // ----------------------
  // 6. Categories reveal
  // ----------------------
  const categoryDuration = contextRevealDuration * 0.2
  const categoryStagger = contextRevealDuration * 0.08

  pageTimeline.to(
    categories,
    {
      opacity: 1,
      y: 0,
      duration: categoryDuration,
      ease: "power2.out",
      stagger: {
        each: categoryStagger,
      },
    },
    getContextRevealStart(),
  )

  // ----------------------
  // 7. Ellipse reveal
  // ----------------------
  const ellipseDuration = contextRevealDuration * 0.4

  pageTimeline.to(
    ellipse,
    {
      opacity: 1,
      y: 0,
      duration: ellipseDuration,
      ease: "power2.out",
    },
    getContextRevealEnd(),
  )
}

// Project next
function setupProjectNext() {
  // ----------------------
  // 1. DOM selections
  // ----------------------
  const root = document.querySelector(".project-next")
  const link = root.querySelector(".project-next__link")
  const left = root.querySelector(".project-next__word--left")
  const right = root.querySelector(".project-next__right")
  const mediasContainer = root.querySelector(".project-next__medias")
  const medias = root.querySelectorAll(".project-next__media")

  // ----------------------
  // 2. Animation timeline
  // ----------------------
  const nextTimeline = gsap.timeline({
    paused: true,
  })

  // ----------------------
  // 3. Text positions
  // ----------------------
  const rootRect = root.getBoundingClientRect()
  const leftRect = left.getBoundingClientRect()
  const rightRect = right.getBoundingClientRect()

  const margin = 0.1 * root.clientWidth

  const leftCurrentLeft = leftRect.left - rootRect.left
  const leftTargetLeft = margin
  const leftDistance = leftTargetLeft - leftCurrentLeft

  const rightCurrentRight = rightRect.right - rootRect.left
  const rightTargetRight = root.clientWidth - margin
  const rightDistance = rightTargetRight - rightCurrentRight

  nextTimeline.to(left, {
    x: leftDistance,
    duration: 0.8,
    ease: "expo.inOut",
  })
  nextTimeline.to(
    right,
    {
      x: rightDistance,
      duration: 0.8,
      ease: "expo.inOut",
    },
    "<",
  )

  // ----------------------
  // 4. Media center position
  // ----------------------
  const leftFinalRight = leftRect.right + leftDistance
  const rightFinalLeft = rightRect.left + rightDistance

  const centerXViewport = (leftFinalRight + rightFinalLeft) / 2
  const centerYViewport = (leftRect.top + leftRect.bottom) / 2

  const mediasContainerRect = mediasContainer.getBoundingClientRect()

  const mediaStartX = centerXViewport - mediasContainerRect.left
  const mediaStartY = centerYViewport - mediasContainerRect.top

  // ----------------------
  // 5. Media distribution
  // ----------------------
  const yPercentMin = -150
  const yPercentMax = 50
  const mediaCount = medias.length

  nextTimeline.fromTo(
    medias,
    {
      display: "none",
      scale: 0.8,
      rotate: () => {
        return (Math.random() - 0.5) * 10
      },
      x: mediaStartX,
      y: mediaStartY,
      xPercent: () => {
        return -50 + (Math.random() - 0.5) * 120
      },
      yPercent: (index) => {
        return yPercentMin + (index / (mediaCount - 1)) * (yPercentMax - yPercentMin)
      },
    },
    {
      display: "block",
      scale: () => {
        return Math.random() / 5 + 1
      },
      rotate: () => {
        return (Math.random() - 0.5) * 10
      },
      duration: 0.3,
      ease: "back.out(2)",
      stagger: {
        each: 0.045,
        from: "random",
      },
    },
    "<0.3",
  )

  // ----------------------
  // 6. Hover interactions
  // ----------------------
  function handleMouseEnter() {
    nextTimeline.play()
  }

  function handleMouseLeave() {
    nextTimeline.reverse()
  }

  link.addEventListener("mouseenter", handleMouseEnter)
  link.addEventListener("mouseleave", handleMouseLeave)
}
