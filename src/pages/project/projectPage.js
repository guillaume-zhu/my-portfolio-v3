import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { createSiteHeader } from "../../shared/site-header/createSiteHeader"
import { createIncomingPageTransition } from "../../shared/page-transition/createPageTransition"
import { setupCrossPageTransitions } from "../../shared/page-transition/setupCrossPageTransitions"

gsap.registerPlugin(ScrollTrigger, SplitText)

createSiteHeader()

// ----------------------
// 1. Global setup — Lenis and page transitions
// ----------------------
const lenis = new Lenis({
  anchors: true,
})

lenis.on("scroll", ScrollTrigger.update)

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

// Transition pages
const { pageTransition, shouldRevealTransition } = createIncomingPageTransition()
setupCrossPageTransitions({
  pageTransition,

  onNavigateStart: () => {
    lenis.stop()
  },

  onNavigateCancelled: () => {
    lenis.start()
  },
})

// ----------------------
// 2. Responsive initialization
// ----------------------
document.fonts.ready.then(async () => {
  setupProjectIntro()
  setupProjectGalleryVideoPlayback()

  const projectMedia = gsap.matchMedia()

  projectMedia.add("(min-width: 901px) and (min-height: 651px), (min-width: 1025px)", () => {
    const galleryData = setupProjectGallery()
    const cleanupProjectScroll = setupProjectScroll(galleryData)
    const cleanupProjectNext = setupProjectNext()

    return () => {
      cleanupProjectScroll()
      cleanupProjectNext()
    }
  })

  projectMedia.add("(max-width: 900px), (max-width: 1024px) and (max-height: 650px)", () => {
    const galleryData = setupProjectGallery()
    const cleanupContentReveals = setupMobileProjectContentReveals()
    setupMobileProjectEllipseReveal()
    setupMobileProjectGallery(galleryData)
    setupMobileProjectNext()

    return () => {
      cleanupContentReveals()
    }
  })

  ScrollTrigger.refresh()

  if (shouldRevealTransition) {
    await pageTransition.reveal()
  }
})

// ============================================================
// 3. Shared behaviors — desktop and mobile
// ============================================================

// Gallery video playback
function setupProjectGalleryVideoPlayback() {
  const galleryPanel = document.querySelector(".project-panel--gallery")

  if (!galleryPanel) return

  const videos = galleryPanel.querySelectorAll("video")

  if (!videos.length) return

  const ellipsePanel = document.querySelector(".project-panel--ellipse")
  const activationPanels = [ellipsePanel, galleryPanel].filter(Boolean)
  const intersectingPanels = new Set()

  const syncPlayback = () => {
    const shouldPlay = intersectingPanels.size > 0

    videos.forEach((video) => {
      if (shouldPlay) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          intersectingPanels.add(entry.target)
        } else {
          intersectingPanels.delete(entry.target)
        }
      })

      syncPlayback()
    },
    {
      rootMargin: "1000px",
    },
  )

  activationPanels.forEach((panel) => {
    observer.observe(panel)
  })
}

// Intro
function setupProjectIntro() {
  const title = document.querySelector(".project-intro__title")
  const visuals = document.querySelectorAll(".project-intro__visual")
  const backLink = document.querySelector(".project-back")

  const introTimeline = gsap.timeline({
    defaults: {
      ease: "power3.out",
    },
  })

  introTimeline.to(visuals, {
    opacity: 1,
    scale: 1,
    duration: 2,
    stagger: 0.08,
  })

  introTimeline.to(
    title,
    {
      opacity: 1,
      y: 0,
      duration: 2,
    },
    "<+=0.25",
  )

  introTimeline.to(
    backLink,
    {
      opacity: 1,
      duration: 2,
    },
    "<+=0.25",
  )
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
  const updateSlidesHeight = () => {
    const galleryHeight = gallery.clientHeight

    gsap.set(slidesContainer, {
      height: galleryHeight + (totalSteps - 2) * 0.01 * galleryHeight,
    })
  }

  updateSlidesHeight()

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
        y: () => `-=${0.01 * gallery.clientHeight}`,
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
    refresh: () => {
      const currentProgress = galleryTimeline.progress()

      galleryTimeline.progress(0)
      updateSlidesHeight()
      galleryTimeline.invalidate()
      galleryTimeline.progress(currentProgress)
    },
  }
}

// ============================================================
// 4. Desktop behaviors
// ============================================================

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
  const getGalleryScrollDistance = () => {
    return galleryData.totalSteps * window.innerHeight
  }

  // ----------------------
  // 3. ScrollTrigger
  // ----------------------
  const pageTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: pinHeight,
      start: "top top",
      end: () => `+=${getScrollDistance() + getGalleryScrollDistance()}`,
      scrub: true,
      pin: container,
      markers: false,
      invalidateOnRefresh: true,
      onRefreshInit: galleryData.refresh,
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
      duration: () => getGalleryScrollDistance(),
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
  const cleanupContentReveals = addProjectContentRevals(pageTimeline, root, container)

  return () => {
    cleanupContentReveals()
  }
}

// Project content reveal
function addProjectContentRevals(pageTimeline, root, container) {
  // ----------------------
  // 1. DOM selections
  // ----------------------
  const context = root.querySelector(".project-context")
  const contextPanel = context.closest(".project-panel--context")
  const textsContainer = context.querySelector(".project-context__texts")
  const revealElements = context.querySelectorAll(".project-context__text, .project-context__link")
  const categories = context.querySelectorAll(".project-context__category")
  const ellipse = root.querySelector(".project-ellipse")

  // ----------------------
  // 2. Initial states
  // ----------------------
  gsap.set(textsContainer, {
    visibility: "visible",
  })
  gsap.set(categories, {
    opacity: 0,
    y: 20,
  })
  gsap.set(ellipse, {
    opacity: 0,
    y: 20,
  })

  // ----------------------
  // 3. Timing calculation
  // ----------------------
  const getContextLeft = () => {
    return contextPanel.offsetLeft + context.offsetLeft
  }

  const getContextRevealOffset = () => {
    return context.offsetWidth * 0.2
  }

  const getContextRevealStart = () => {
    return (
      getContextLeft() +
      context.offsetWidth -
      container.clientWidth -
      getContextRevealOffset()
    )
  }

  const getContextRevealEnd = () => {
    return (
      getContextLeft() +
      context.offsetWidth / 2 -
      container.clientWidth / 2 -
      getContextRevealOffset()
    )
  }

  // ----------------------
  // 4. Split text and content reveal
  // ----------------------
  const contentSplit = SplitText.create(revealElements, {
    type: "lines",
    linesClass: "project-context__line",
    onSplit: (split) => {
      const contextRevealStart = getContextRevealStart()
      const contextRevealEnd = getContextRevealEnd()
      const contextRevealDuration = contextRevealEnd - contextRevealStart

      const lineDuration = contextRevealDuration / split.lines.length
      const categoryDuration = contextRevealDuration * 0.2
      const categoryStagger = contextRevealDuration * 0.08
      const ellipseDuration = contextRevealDuration * 0.4

      const contentTimeline = gsap.timeline()

      contentTimeline.to(
        split.lines,
        {
          maskImage: "linear-gradient(90deg, #000 100%, transparent 125%)",
          webkitMaskImage: "linear-gradient(90deg, #000 100%, transparent 125%)",
          duration: lineDuration,
          ease: "power1.inOut",
          stagger: {
            each: lineDuration,
          },
        },
        0,
      )

      contentTimeline.to(
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
        0,
      )

      contentTimeline.to(
        ellipse,
        {
          opacity: 1,
          y: 0,
          duration: ellipseDuration,
          ease: "power2.out",
        },
        contextRevealDuration,
      )

      pageTimeline.add(contentTimeline, contextRevealStart)

      return contentTimeline
    },
  })

  // ----------------------
  // 5. Resize refresh
  // ----------------------
  const refreshContentSplit = () => {
    contentSplit.split()
  }

  ScrollTrigger.addEventListener("refreshInit", refreshContentSplit)

  return () => {
    ScrollTrigger.removeEventListener("refreshInit", refreshContentSplit)
    contentSplit.revert()
  }
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
  // 2. Layout measurements
  // ----------------------
  const measureNextLayout = () => {
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

    const leftFinalRight = leftRect.right + leftDistance
    const rightFinalLeft = rightRect.left + rightDistance

    const centerXViewport = (leftFinalRight + rightFinalLeft) / 2
    const centerYViewport = (leftRect.top + leftRect.bottom) / 2

    const mediasContainerRect = mediasContainer.getBoundingClientRect()

    return {
      leftDistance,
      rightDistance,
      mediaStartX: centerXViewport - mediasContainerRect.left,
      mediaStartY: centerYViewport - mediasContainerRect.top,
    }
  }

  let nextLayout = measureNextLayout()

  // ----------------------
  // 3. Media distribution
  // ----------------------
  const yPercentMin = -150
  const yPercentMax = 50
  const mediaCount = medias.length

  const mediaTransforms = [...medias].map(() => {
    return {
      startRotate: (Math.random() - 0.5) * 10,
      startXPercent: -50 + (Math.random() - 0.5) * 120,
      endScale: Math.random() / 5 + 1,
      endRotate: (Math.random() - 0.5) * 10,
    }
  })

  // ----------------------
  // 4. Animation timeline
  // ----------------------
  const nextTimeline = gsap.timeline({
    paused: true,
  })

  nextTimeline.to(left, {
    x: () => nextLayout.leftDistance,
    duration: 0.8,
    ease: "expo.inOut",
  })
  nextTimeline.to(
    right,
    {
      x: () => nextLayout.rightDistance,
      duration: 0.8,
      ease: "expo.inOut",
    },
    "<",
  )

  nextTimeline.fromTo(
    medias,
    {
      display: "none",
      scale: 0.8,
      rotate: (index) => {
        return mediaTransforms[index].startRotate
      },
      x: () => nextLayout.mediaStartX,
      y: () => nextLayout.mediaStartY,
      xPercent: (index) => {
        return mediaTransforms[index].startXPercent
      },
      yPercent: (index) => {
        return yPercentMin + (index / (mediaCount - 1)) * (yPercentMax - yPercentMin)
      },
    },
    {
      display: "block",
      scale: (index) => {
        return mediaTransforms[index].endScale
      },
      rotate: (index) => {
        return mediaTransforms[index].endRotate
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
  // 5. Resize refresh
  // ----------------------
  const refreshNextLayout = () => {
    const currentProgress = nextTimeline.progress()

    nextTimeline.progress(0)
    nextLayout = measureNextLayout()
    nextTimeline.invalidate()
    nextTimeline.progress(currentProgress)
  }

  ScrollTrigger.addEventListener("refreshInit", refreshNextLayout)

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

  return () => {
    ScrollTrigger.removeEventListener("refreshInit", refreshNextLayout)
    link.removeEventListener("mouseenter", handleMouseEnter)
    link.removeEventListener("mouseleave", handleMouseLeave)
  }
}

// ============================================================
// 5. Mobile behaviors
// ============================================================

// Project content reveal
function setupMobileProjectContentReveals() {
  const context = document.querySelector(".project-context")
  const textsContainer = context.querySelector(".project-context__texts")
  const revealElements = context.querySelectorAll(".project-context__text, .project-context__link")
  const categories = context.querySelectorAll(".project-context__category")

  gsap.set(textsContainer, {
    visibility: "visible",
  })

  gsap.set(categories, {
    opacity: 0,
    y: 20,
  })

  const contentSplit = SplitText.create(revealElements, {
    type: "lines",
    linesClass: "project-context__line",
    autoSplit: true,
    onSplit: (split) => {
      const contextTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: context,
          start: "top 75%",
          end: "top 20%",
          scrub: true,
        },
      })

      contextTimeline.to(
        categories,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
          stagger: 0.12,
        },
        0,
      )

      contextTimeline.to(
        split.lines,
        {
          maskImage: "linear-gradient(90deg, #000 100%, transparent 125%)",
          webkitMaskImage: "linear-gradient(90deg, #000 100%, transparent 125%)",
          duration: 0.5,
          ease: "power1.inOut",
          stagger: 0.5,
        },
        0.1,
      )

      return contextTimeline
    },
  })

  return () => {
    contentSplit.revert()
  }
}

// Project ellipse reveal
function setupMobileProjectEllipseReveal() {
  const ellipse = document.querySelector(".project-ellipse")
  const visual = ellipse.querySelector(".project-ellipse__visual")

  gsap.fromTo(
    ellipse,
    {
      opacity: 0,
      y: 20,
    },
    {
      opacity: 1,
      y: 0,
      ease: "power2.out",
      scrollTrigger: {
        trigger: visual,
        start: "top 85%",
        end: "top 45%",
        scrub: true,
      },
    },
  )
}

// Project gallery
function setupMobileProjectGallery(galleryData) {
  const galleryPanel = document.querySelector(".project-panel--gallery")
  const scrollDistanceFactor = 0.6

  gsap.fromTo(
    galleryData.timeline,
    {
      progress: 0,
    },
    {
      progress: 1,
      ease: "none",
      scrollTrigger: {
        trigger: galleryPanel,
        start: "top top",
        end: () => `+=${galleryData.totalSteps * window.innerHeight * scrollDistanceFactor}`,
        scrub: true,
        pin: true,
        invalidateOnRefresh: true,
        onRefreshInit: galleryData.refresh,
      },
    },
  )
}

// Project next
function setupMobileProjectNext() {
  const root = document.querySelector(".project-next")
  const medias = root.querySelectorAll(".project-next__media")

  gsap.fromTo(
    medias,
    {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.3,
      ease: "back.out(2)",
      stagger: {
        each: 0.06,
        from: "random",
      },
      scrollTrigger: {
        trigger: root,
        start: "top 55%",
        toggleActions: "play none none reverse",
      },
    },
  )
}
