import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis({
  anchors: true,
})

lenis.on("scroll", ScrollTrigger.update)

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

const galleryData = setupProjectGallery()
setupProjectScroll(galleryData)

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
}

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
