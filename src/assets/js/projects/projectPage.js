import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

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
      markers: true,
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
  pageTimeline.to(
    {},
    {
      duration: galleryScrollDistance,
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
  const gallery = document.querySelector(".project-gallery")

  if (!gallery) return
  // ----------------------
  // 1. DOM selections
  // ----------------------
  const slidesContainer = gallery.querySelector(".project-gallery__slides")
  const slides = [...gallery.querySelectorAll(".project-gallery__slide")]

  // ----------------------
  // 2. Settings
  // ----------------------
  const flexValues = [0.1, 0.12, 0.56, 0.12, 0.1]
  const clipPathValues = [15, 5, 0, 5, 15]

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

  return {
    totalSteps,
  }
}
