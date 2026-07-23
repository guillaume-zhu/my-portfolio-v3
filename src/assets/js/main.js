import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { createSiteHeader } from "../components/createSiteHeader"
import { createIncomingPageTransition } from "./transitions/createPageTransition"
import { setupCrossPageTransitions } from "./transitions/setupCrossPageTransitions"

import { createThreeHero } from "../../three/createThreeHero"
import { createToolkitCardReveal } from "../../three/createToolkitCardReveal"
import { createProjectLetterPhysics } from "./projects/createProjectLetterPhysics"
import { setupProjectImageHover } from "./projects/setupProjectImageHover"

// ----------------------
// Global setup
// ----------------------
gsap.registerPlugin(ScrollTrigger)

createSiteHeader()

const lenis = new Lenis({
  anchors: true,
})

lenis.on("scroll", ScrollTrigger.update)

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

const { pageTransition, shouldRevealTransition } = createIncomingPageTransition()

const sectionNavigation = createSectionNavigation()

setupCrossPageTransitions({
  pageTransition,

  onNavigateStart: () => {
    lenis.stop()
  },

  onNavigateCancelled: () => {
    lenis.start()
  },
})

window.addEventListener("pagehide", () => {
  lenis.start()
})

window.addEventListener("pageshow", () => {
  lenis.start()
})

// ----------------------
// Scene scroll animation
// ----------------------
const threeHero = await createThreeHero()

setupHeroScroll(threeHero)
setupHeroToManifestoTransition()

// ----------------------
// Sections Animations
// ----------------------
document.fonts.ready.then(() => {
  setupManifesto()
  setupTrajectory()
  const trajectorySentencesTimeline = setupTrajectorySentences()
  setupTrajectoryToToolkitTransition()
  setupToolkit()
  const projectsTimeline = setupProjects()
  const nextSectionTrigger = setupNextSection()

  setupHeaderTheme()

  ScrollTrigger.refresh()

  // Update Lenis with final document height with GSAP pin spacers
  lenis.resize()

  sectionNavigation.init({
    trajectorySentencesTimeline,
    projectsTimeline,
    nextSectionTrigger,
  })
})

// ----------------------
// Helpers
// ----------------------
// Wrap letters in span
function wrapLettersInSpan(element) {
  if (!element || element.dataset.splitted === "true") return

  const lines = element.innerHTML.trim().split(/<br\s*\/?>/i)

  element.innerHTML = lines
    .map((line) =>
      line
        .trim()
        .split("")
        .map((char) =>
          char === " " ? "<span>&nbsp;</span>" : `<span class="letter">${char}</span>`,
        )
        .join(""),
    )
    .join("<br />")

  element.dataset.splitted = "true"
}

// Wrap project letters
function wrapProjectLetters(element) {
  const text = element.textContent.trim()

  element.setAttribute("aria-label", text)

  element.innerHTML = text
    .split("")
    .map((char) => {
      const content = char === " " ? "&nbsp;" : char

      return `
    <span class="project-letter" aria-hidden="true">
      <span class="project-letter__content">
        ${content}
      </span>
    </span>
    `
    })
    .join("")
}

// Convert progress into 0 -> 1 between two values
function getPhaseProgress(progress, start, end) {
  return gsap.utils.clamp(0, 1, (progress - start) / (end - start))
}

// Header body interface color
function setInterfaceColor(color) {
  if (document.body.dataset.interfaceColor === color) return
  document.body.dataset.interfaceColor = color
}

// ----------------------
// Functions
// ----------------------
// Main page section navigation
function createSectionNavigation() {
  // ----------------------
  // 1. Navigation settings
  // ----------------------
  const supportedHashes = new Set(["#parcours", "#toolkit", "#projects", "#contact"])

  const interfaceColorByHash = {
    "#parcours": "cream",
    "#toolkit": "cream",
    "#projects": "dark",
    "#contact": "cream",
  }

  // ----------------------
  // 2. Initial hash
  // ----------------------
  const initialHash = supportedHashes.has(window.location.hash) ? window.location.hash : null

  // Prevent native scrolling before GSAP creates its pin spacing
  if (initialHash) {
    history.scrollRestoration = "manual"

    history.replaceState(null, "", window.location.pathname + window.location.search)

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    })
  }

  // ----------------------
  // 3. Calculate destination
  // ----------------------
  function getTargetScroll(hash, references) {
    const { trajectorySentencesTimeline, projectsTimeline, nextSectionTrigger } = references

    if (hash === "#parcours") {
      const trajectoryTrigger = trajectorySentencesTimeline?.scrollTrigger

      return trajectoryTrigger ? trajectoryTrigger.start + 1 : null
    }

    if (hash === "#projects") {
      return projectsTimeline?.scrollTrigger?.labelToScroll("projects-visible")
    }

    if (hash === "#contact") {
      return nextSectionTrigger ? nextSectionTrigger.end - 1 : null
    }

    const targetElement = document.querySelector(hash)

    if (!targetElement) return null

    return targetElement.getBoundingClientRect().top + window.scrollY
  }

  // ----------------------
  // 4. Update URL
  // ----------------------
  function updateUrl(hash, historyMode) {
    const targetUrl = `${window.location.pathname}` + `${window.location.search}` + `${hash}`

    if (historyMode === "replace") {
      history.replaceState(null, "", targetUrl)
      return
    }

    if (window.location.hash !== hash) {
      history.pushState(null, "", targetUrl)
    }
  }

  // ----------------------
  // 5. Scroll to destination
  // ----------------------
  function scrollToSection(hash, references, { immediate = false, historyMode = "push" } = {}) {
    const targetScroll = getTargetScroll(hash, references)

    if (targetScroll == null) return false

    lenis.scrollTo(targetScroll, {
      immediate,
      force: true,
    })

    // An immediate jump does not naturally pass through every theme trigger
    if (immediate) {
      ScrollTrigger.update()
      setInterfaceColor(interfaceColorByHash[hash])
    }

    updateUrl(hash, historyMode)

    return true
  }

  // Undo the scroll performed by native navigation
  function resetNativeAnchorContainer(hash) {
    const targetElement = document.querySelector(hash)
    const scrollContainer = targetElement?.closest(".next-section__container")

    if (!scrollContainer) return

    scrollContainer.scrollTop = 0
    scrollContainer.scrollLeft = 0
  }

  // ----------------------
  // 6. Handle hero link
  // ----------------------
  function setupHeroLink() {
    const logo = document.querySelector(".site-header__logo")

    if (!logo) return

    logo.addEventListener("click", async (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const isAlreadyOnHero = !window.location.hash && window.scrollY <= 1

      if (isAlreadyOnHero) return

      pageTransition.setColor("cream")
      lenis.stop()

      try {
        await pageTransition.run(
          () => {
            lenis.scrollTo(0, {
              immediate: true,
              force: true,
            })

            ScrollTrigger.update()
            setInterfaceColor("cream")

            history.pushState(null, "", window.location.pathname + window.location.search)
          },
          {
            mode: "circle",
          },
        )
      } finally {
        lenis.start()
      }
    })
  }

  // ----------------------
  // 6. Handle homepage links
  // ----------------------
  function setupInternalLinks(references) {
    const links = document.querySelectorAll("a[href]")

    links.forEach((link) => {
      const linkUrl = new URL(link.href, window.location.href)
      const hash = linkUrl.hash

      if (!supportedHashes.has(hash)) return

      link.addEventListener("click", async (event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        pageTransition.setColor(interfaceColorByHash[hash])

        lenis.stop()

        try {
          await pageTransition.run(() => {
            scrollToSection(hash, references, { immediate: true })
          })
        } finally {
          lenis.start()
        }
      })
    })
  }

  // ----------------------
  // 7. Public initialization
  // ----------------------
  function init(references) {
    setupHeroLink()
    setupInternalLinks(references)

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash

      if (!supportedHashes.has(hash)) return

      resetNativeAnchorContainer(hash)

      requestAnimationFrame(() => {
        scrollToSection(hash, references, {
          immediate: true,
          historyMode: "replace",
        })
      })
    })

    if (!initialHash) {
      if (shouldRevealTransition) {
        pageTransition.reveal({
          mode: "circle",
        })
      }

      return
    }

    function openInitialSection() {
      // Recalculate every pin after all page resources are loaded
      ScrollTrigger.refresh()
      lenis.resize()

      requestAnimationFrame(async () => {
        scrollToSection(initialHash, references, {
          immediate: true,
          historyMode: "replace",
        })

        history.scrollRestoration = "auto"

        if (shouldRevealTransition) {
          await pageTransition.reveal()
        }
      })
    }

    if (document.readyState === "complete") {
      openInitialSection()
    } else {
      window.addEventListener("load", openInitialSection, {
        once: true,
      })
    }
  }

  return {
    init,
  }
}

// Header setup theme
function setupHeaderTheme() {
  // Hero to manifesto
  const manifesto = document.querySelector(".manifesto")

  ScrollTrigger.create({
    trigger: manifesto,
    start: "top -425px",

    onEnter: () => {
      setInterfaceColor("dark")
    },

    onEnterBack: () => {
      setInterfaceColor("dark")
    },

    onLeaveBack: () => {
      setInterfaceColor("cream")
    },

    markers: false,
  })

  // Manifesto to trajectory
  const trajectory = document.querySelector(".trajectory")

  ScrollTrigger.create({
    trigger: trajectory,
    start: "top 80px",

    onEnter: () => {
      setInterfaceColor("cream")
    },

    onEnterBack: () => {
      setInterfaceColor("cream")
    },

    onLeaveBack: () => {
      setInterfaceColor("dark")
    },

    markers: false,
  })

  // Project to next section
  const nextSection = document.querySelector(".next-section")

  ScrollTrigger.create({
    trigger: nextSection,
    start: "top 80px",

    onEnter: () => {
      setInterfaceColor("cream")
    },

    onEnterBack: () => {
      setInterfaceColor("cream")
    },

    onLeaveBack: () => {
      setInterfaceColor("dark")
    },
  })
}

// Scene Hero
function setupHeroScroll(threeHero) {
  ScrollTrigger.create({
    trigger: ".hero-three",
    start: "top top",
    end: "+=4000",
    scrub: true,
    pin: true,
    markers: false,

    onEnter: () => {
      threeHero.setInteractive(true)
    },

    onEnterBack: () => {
      threeHero.setInteractive(true)
    },

    onLeave: () => {
      threeHero.setInteractive(false)
    },

    onLeaveBack: () => {
      threeHero.setInteractive(false)
    },

    onUpdate: (self) => {
      threeHero.setScrollProgress(self.progress, self.getVelocity())
    },
  })
}
// Hero to Manifesto transition
function setupHeroToManifestoTransition() {
  gsap.to(".hero-three__frame", {
    scaleX: 0.98,
    scaleY: 0.98,
    borderRadius: "0px 0px 32px 32px",
    ease: "none",

    scrollTrigger: {
      trigger: ".manifesto",
      start: "top bottom-=500",
      end: "top bottom-=900",
      scrub: true,
      markers: false,
    },
  })
}

// Manifesto
function setupManifesto() {
  const text = document.querySelector(".manifesto .text")
  if (!text) return

  wrapLettersInSpan(text)

  const letters = document.querySelectorAll(".manifesto .letter")
  const distance = text.clientWidth - document.body.clientWidth
  const overlapDistance = 1175
  const pinDistance = Math.max(distance - overlapDistance, 1)

  // 1. Pin only
  ScrollTrigger.create({
    trigger: ".manifesto .container",
    start: "top top",
    end: "+=" + pinDistance,
    pin: true,
    markers: false,
  })

  // 2. Text horizontal animation
  const scrollTween = gsap.to(text, {
    x: -distance,
    ease: "none",
    scrollTrigger: {
      trigger: ".manifesto .container",
      start: "top top",
      end: "+=" + distance,
      scrub: true,
      markers: false,
    },
  })

  letters.forEach((letter) => {
    gsap.from(letter, {
      yPercent: (Math.random() - 0.5) * 400,
      rotation: (Math.random() - 0.5) * 60,
      ease: "elastic.out(1.2, 1)",
      scrollTrigger: {
        trigger: letter,
        containerAnimation: scrollTween,
        start: "left 100%",
        end: "left 0%",
        scrub: 0.5,
      },
    })
  })

  // Manifesto to trajectory transition
  const manifesto = document.querySelector(".manifesto")

  gsap.to(".manifesto .container", {
    scaleX: 0.98,
    scaleY: 0.98,
    borderRadius: "0px 0px 32px 32px",
    ease: "none",

    scrollTrigger: {
      trigger: ".trajectory",
      start: "top bottom",
      end: "top 50%",
      scrub: true,
      markers: false,

      onUpdate: (self) => {
        manifesto.classList.toggle("is-exiting", self.progress > 0)
      },

      onLeaveBack: () => {
        manifesto.classList.remove("is-exiting")
      },
    },
  })
}

// Trajectory title
function setupTrajectory() {
  const root = document.querySelector(".trajectory")
  root.querySelectorAll(".container").forEach((container) => {
    const title = container.querySelector(".title")
    wrapLettersInSpan(title)

    const dist = container.clientHeight - title.clientHeight

    ScrollTrigger.create({
      trigger: container,
      pin: title,
      start: "top top",
      end: "+=" + dist,
    })

    const letters = container.querySelectorAll("span")
    letters.forEach((letter) => {
      const randomDistance = Math.random() * dist

      gsap.from(letter, {
        y: randomDistance,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "+=" + randomDistance,
          scrub: true,
        },
      })
    })

    gsap.to(title, {
      scale: 0.6,
      transformOrigin: "center center",
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top+=" + dist * 0.75 + " top",
        end: "top+=" + dist + " top",
        scrub: true,
      },
    })

    const weightDuration = 200

    gsap.to(title, {
      fontWeight: 400,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top+=" + dist + " top",
        end: "top+=" + (dist + weightDuration) + " top",
        scrub: true,
        markers: false,
      },
    })
  })
}

// Trajectory sentences
function setupTrajectorySentences() {
  const root = document.querySelector(".trajectory-sentences")
  if (!root) return

  const pinHeight = root.querySelector(".trajectory-sentences__pin-height")
  const container = root.querySelector(".trajectory-sentences__container")
  const sentences = root.querySelectorAll(".trajectory-sentences__sentence")

  const visualLeft = root.querySelector(".trajectory-sentences__visual--left")
  const visualRight = root.querySelector(".trajectory-sentences__visual--right")

  // Initial visuals positions
  gsap.set(visualLeft, {
    xPercent: -100,
    yPercent: -50,
  })

  gsap.set(visualRight, {
    xPercent: 100,
    yPercent: -50,
  })

  sentences.forEach((sentence) => {
    wrapLettersInSpan(sentence)
  })

  // Pin full sequence
  ScrollTrigger.create({
    trigger: pinHeight,
    start: "top top",
    end: "bottom bottom",
    pin: container,
    markers: false,
  })

  // Timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pinHeight,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      markers: false,
    },
  })

  sentences.forEach((sentence, index) => {
    const nextSentence = sentences[index + 1]

    const isNextDialogue = nextSentence?.classList.contains("is-dialogue")
    const isNextBoth = nextSentence?.classList.contains("is-both")

    // Switch to cream theme "Aujourd'hui"
    if (isNextDialogue) {
      tl.set(
        [root],
        {
          backgroundColor: "var(--color-cream)",
        },
        "<+=0.2",
      )

      tl.set(
        sentences,
        {
          color: "var(--color-dark)",
        },
        "<",
      )

      tl.to(
        {},
        {
          duration: 0.0001,

          onStart: () => {
            setInterfaceColor("dark")
          },
          onReverseComplete: () => {
            setInterfaceColor("cream")
          },
        },
        "<",
      )
    }

    // Visuals enter
    if (isNextBoth) {
      tl.to(
        visualLeft,
        {
          xPercent: -30,
          opacity: 1,
          ease: "power3.out",
        },
        "<+=0.15",
      )

      tl.to(
        visualRight,
        {
          xPercent: 30,
          opacity: 1,
          ease: "power3.out",
        },
        "<",
      )
    }

    if (!nextSentence) return

    // Exit sentence
    tl.to(sentence, {
      yPercent: -50,
      y: "-50vh",
      ease: "power3.in",
    })

    // Exit letter stag
    tl.to(
      sentence.querySelectorAll("span"),
      {
        yPercent: -50,
        y: "-50vh",
        stagger: 0.02,
        ease: "power3.in",
      },
      "<+=0.1",
    )

    // Entry sentence
    tl.from(
      nextSentence,
      {
        yPercent: 50,
        y: "50vh",
        ease: "power3.out",
      },
      "<+=0.10",
    )

    // Entry letter stag
    tl.from(
      nextSentence.querySelectorAll("span"),
      {
        yPercent: 50,
        y: "50vh",
        ease: "power3.out",
        stagger: 0.02,
      },
      "<",
    )

    // Final image sequence "les deux"
    if (isNextBoth) {
      // 1 join
      tl.to(
        visualLeft,
        {
          xPercent: 0,
          width: "calc(50vw + 1px)",
          ease: "power3.inOut",
        },
        "<",
      )

      tl.to(
        visualRight,
        {
          xPercent: 0,
          width: "calc(50vw + 1px)",
          ease: "power3.inOut",
        },
        "<",
      )

      tl.set(
        nextSentence,
        {
          color: "var(--color-cream)",
        },
        ">-=0.05",
      )

      // 2 fullscreen
      tl.to(
        [visualLeft, visualRight],
        {
          height: "100vh",
          borderRadius: "0px",
          ease: "power3.inOut",
        },
        ">+=0.2",
      )

      // Change header color over fullscreen visuals
      tl.to(
        {},
        {
          duration: 0.001,

          onStart: () => {
            setInterfaceColor("cream")
          },

          onReverseComplete: () => {
            setInterfaceColor("dark")
          },
        },
        ">-35%",
      )

      // Hold final state
      tl.to({}, { duration: 0.4 })

      // Change backgroud color for transition
      tl.set(
        root,
        {
          backgroundColor: "var(--color-black)",
        },
        ">",
      )
    }
  })
  return tl
}

// Trajectory to Toolkit transition
function setupTrajectoryToToolkitTransition() {
  const trajectoryFrame = document.querySelector(".trajectory-sentences__container")
  const toolkit = document.querySelector(".toolkit")
  const toolkitTitle = document.querySelector(".toolkit__title")

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: toolkit,
      start: "top bottom",
      end: "top 50%",
      scrub: true,
      markers: false,
    },
  })

  tl.to(
    trajectoryFrame,
    {
      scaleX: 0.98,
      scaleY: 0.98,
      borderRadius: "0px 0px 32px 32px",
      transformOrigin: "center top",
      ease: "none",
    },
    0,
  )

  tl.fromTo(
    toolkitTitle,
    {
      fontWeight: 500,
    },
    { fontWeight: 700, ease: "none" },
    0,
  )
}

// Toolkit
function setupToolkit() {
  // ----------------------
  // 1. Dom selections
  // ----------------------
  const root = document.querySelector(".toolkit")
  if (!root) return

  const pinHeight = root.querySelector(".toolkit__pin-height")
  const container = root.querySelector(".toolkit__container")
  const wheel = root.querySelector(".toolkit__wheel--frontend")
  const slots = root.querySelectorAll(".toolkit__wheel--frontend .toolkit__slot")
  const artWheel = root.querySelector(".toolkit__wheel--art-direction")
  const artSlots = root.querySelectorAll(".toolkit__wheel--art-direction .toolkit__slot")

  const transitionSlot = root.querySelector(".toolkit__slot--transition")
  const flipCard = transitionSlot?.querySelector(".toolkit-card__flipper")

  const subtitleFront = root.querySelector(".toolkit__subtitle--front")
  const subtitleArt = root.querySelector(".toolkit__subtitle--art")

  const artTransitionCard = artWheel?.querySelector(".toolkit-card--transition")
  const artTransitionSlot = artTransitionCard?.closest(".toolkit__slot")
  const artTransitionReveal = artTransitionCard?.querySelector(".toolkit-card__cream-reveal")

  const cardReveal = createToolkitCardReveal(artTransitionReveal)

  // ----------------------
  // 2. Settings
  // ----------------------
  // Cards
  const angle = 3.5
  const cardScalePop = 0.94
  const cardEasePop = "elastic.out(0.6, 0.3)"
  const cardDurationPop = 0.5

  // Phases
  const frontDeckEnd = 0.28
  const collapseEnd = 0.33
  const flipEnd = 0.43
  const artDeckEnd = 0.71
  const finalCollapseEnd = 0.76
  const cardLiftEnd = 0.82
  const cardPlayEnd = 0.87
  const fullscreenStart = 0.97
  const headerDarkStart = 0.9925
  const finalTransitionEnd = 1

  // Subtitle
  const subtitleOffset = 75

  // Interactions
  const hoverZIndex = slots.length + 10

  // Final transition card
  const transitionCardMaxScale = 1.5
  const transitionCardLiftEase = gsap.parseEase("power4.inOut")
  const transitionCardPLayEase = gsap.parseEase("power3.in")
  const transitionCardFullscreenScale = 8
  const transitionCardFullScreenEase = gsap.parseEase("power3.in")

  // ----------------------
  // 3. States
  // ----------------------
  let currentIndex = 0
  let currentWheelIndex = 0

  let currentArtIndex = 0
  let currentArtWheelIndex = 0

  let isCollapsed = false

  // ----------------------
  // 4. Helpers
  // ----------------------
  // Convert progress into 0 -> 1
  const getPhaseProgress = (progress, start, end) => {
    return gsap.utils.clamp(0, 1, (progress - start) / (end - start))
  }

  // ----------------------
  // 5. Initial state functions
  // ----------------------
  function resetToolkitState() {
    currentIndex = 0
    currentWheelIndex = 0

    currentArtIndex = 0
    currentArtWheelIndex = 0

    isCollapsed = false
  }

  function setInitialFrontendDeckState() {
    // Cards
    slots.forEach((slot, index) => {
      slot.classList.toggle("is-visible", index === 0)

      gsap.set(slot, {
        rotation: index * angle,
        zIndex: index + 1,
        scale: 1,
      })
    })

    wheel.classList.add("is-interactive")

    // Wheel
    gsap.set(wheel, {
      rotation: 0,
      autoAlpha: 1,
      pointerEvents: "auto",
    })
  }

  function setInitialArtDeckState() {
    artSlots.forEach((slot, index) => {
      slot.classList.toggle("is-visible", index === 0)

      gsap.set(slot, {
        rotation: index * angle,
        zIndex: index + 1,
        scale: 1,
      })
    })

    gsap.set(artTransitionCard, {
      scale: 1,
    })
    gsap.set(artTransitionReveal, {
      autoAlpha: 1,
    })

    artWheel.classList.remove("is-interactive")

    gsap.set(artWheel, {
      rotation: 0,
      autoAlpha: 0,
      pointerEvents: "none",
    })
  }

  function setInitialTransitionState() {
    // Flip
    gsap.set(flipCard, {
      rotationY: 0,
    })

    // Subtitle
    gsap.set(subtitleFront, {
      autoAlpha: 1,
      y: 0,
    })
    gsap.set(subtitleArt, {
      autoAlpha: 0,
      y: subtitleOffset,
    })
  }

  function setInitialState() {
    resetToolkitState()
    setInitialFrontendDeckState()
    setInitialArtDeckState()
    setInitialTransitionState()

    cardReveal.setProgress(0)
  }

  // ----------------------
  // 6. Interctions
  // ----------------------
  // Hover cards
  function setupCardHover(deckSlots) {
    deckSlots.forEach((slot, index) => {
      const card = slot.querySelector(".toolkit-card")
      if (!card) return

      card.addEventListener("pointerenter", () => {
        gsap.set(slot, {
          zIndex: hoverZIndex,
        })
      })

      card.addEventListener("pointerleave", () => {
        gsap.set(slot, {
          zIndex: index + 1,
        })
      })
    })
  }

  // ----------------------
  // 7. Init
  // ----------------------
  setInitialState()
  setupCardHover(slots)
  setupCardHover(artSlots)

  // ----------------------
  // 8. Scroll animation
  // ----------------------
  ScrollTrigger.create({
    trigger: pinHeight,
    start: "top top",
    end: "bottom bottom",
    pin: container,
    scrub: true,
    markers: false,

    onUpdate: (self) => {
      const isCreamCoveringHeader = self.progress >= headerDarkStart

      setInterfaceColor(isCreamCoveringHeader ? "dark" : "cream")
      // ----------------------
      // 0. Decks visibility & interactive state
      // ----------------------
      const isArtDeckActive = self.progress >= flipEnd

      gsap.set(artWheel, {
        autoAlpha: isArtDeckActive ? 1 : 0,
        pointerEvents: isArtDeckActive ? "auto" : "none",
      })

      gsap.set(wheel, {
        autoAlpha: isArtDeckActive ? 0 : 1,
        pointerEvents: isArtDeckActive ? "none" : "auto",
      })

      artWheel.classList.toggle("is-interactive", isArtDeckActive)
      wheel.classList.toggle("is-interactive", !isArtDeckActive)

      // ----------------------
      // 1. Front deck index
      // ----------------------
      const frontProgress = Math.min(self.progress / frontDeckEnd, 1)
      const index = Math.min(Math.floor(frontProgress * slots.length), slots.length - 1)

      // ----------------------
      // 2. Front cards visibility
      // ----------------------
      // Change card visibility when the index changes
      if (index !== currentIndex) {
        if (index > currentIndex) {
          for (let i = currentIndex + 1; i <= index; i++) {
            slots[i].classList.add("is-visible")

            gsap.fromTo(
              slots[i],
              {
                scale: cardScalePop,
              },
              {
                scale: 1,
                ease: cardEasePop,
                duration: cardDurationPop,
              },
            )
          }
        } else {
          for (let i = currentIndex; i > index; i--) {
            slots[i].classList.remove("is-visible")
          }
        }

        currentIndex = index
      }

      // ----------------------
      // 3. Front deck wheel opening
      // ----------------------
      // Negative rotation to keep deck centered
      if (self.progress < frontDeckEnd) {
        if (index !== currentWheelIndex) {
          gsap.to(wheel, {
            rotation: -(index * angle) / 2,
            ease: cardEasePop,
            duration: cardDurationPop,
            overwrite: true,
          })

          currentWheelIndex = index
        }

        return
      }

      // ----------------------
      // 4. Front deck collapse
      // ----------------------
      // Cards collapse to center between frontDeckEnd and collapseEnd
      const collapseProgress = getPhaseProgress(self.progress, frontDeckEnd, collapseEnd)

      slots.forEach((slot, slotIndex) => {
        const openRotation = slotIndex * angle
        const currentRotation = openRotation * (1 - collapseProgress)

        gsap.set(slot, {
          rotation: currentRotation,
        })
      })

      const openWheelRotation = -((slots.length - 1) * angle) / 2
      const currentWheelRotation = openWheelRotation * (1 - collapseProgress)

      gsap.set(wheel, {
        rotation: currentWheelRotation,
      })

      // ----------------------
      // 5. Collapse visibility
      // ----------------------
      // After collapse, keep only Shopify/Figma card visible
      if (self.progress >= collapseEnd && !isCollapsed) {
        slots.forEach((slot) => {
          if (slot !== transitionSlot) {
            slot.classList.remove("is-visible")
          }
        })

        transitionSlot.classList.add("is-visible")
        isCollapsed = true
      }

      // Scroll back, restore Front cards visible
      if (self.progress < collapseEnd && isCollapsed) {
        slots.forEach((slot, index) => {
          slot.classList.toggle("is-visible", index <= currentIndex)
        })

        isCollapsed = false
      }

      // ----------------------
      // 6. Flip + subtitle transition
      // ----------------------
      const flipProgress = getPhaseProgress(self.progress, collapseEnd, flipEnd)

      // Flip card
      gsap.set(flipCard, {
        rotationY: 180 * flipProgress,
      })

      // Switch subtitle
      gsap.set(subtitleFront, {
        autoAlpha: 1 - flipProgress,
        y: -subtitleOffset * flipProgress,
      })
      gsap.set(subtitleArt, {
        autoAlpha: flipProgress,
        y: subtitleOffset * (1 - flipProgress),
      })

      // ----------------------
      // 8. Art Direction card visibility
      // ----------------------
      const artProgress = getPhaseProgress(self.progress, flipEnd, artDeckEnd)
      const artIndex = Math.min(Math.floor(artProgress * artSlots.length), artSlots.length - 1)

      if (artIndex !== currentArtIndex) {
        if (artIndex > currentArtIndex) {
          for (let i = currentArtIndex + 1; i <= artIndex; i++) {
            artSlots[i].classList.add("is-visible")

            gsap.fromTo(
              artSlots[i],
              {
                scale: cardScalePop,
              },
              {
                scale: 1,
                ease: cardEasePop,
                duration: cardDurationPop,
              },
            )
          }
        } else {
          for (let i = currentArtIndex; i > artIndex; i--) {
            artSlots[i].classList.remove("is-visible")
          }
        }

        currentArtIndex = artIndex
      }

      // ----------------------
      // 9. Art Direction wheel opening
      // ----------------------
      if (artIndex !== currentArtWheelIndex) {
        gsap.to(artWheel, {
          rotation: -(artIndex * angle) / 2,
          ease: cardEasePop,
          duration: cardDurationPop,
          overwrite: true,
        })
      }

      currentArtWheelIndex = artIndex

      // ----------------------
      // 10. Art Direction deck collpase
      // ----------------------
      if (self.progress >= artDeckEnd) {
        const finalCollapseProgress = getPhaseProgress(self.progress, artDeckEnd, finalCollapseEnd)

        gsap.killTweensOf(artWheel)

        artSlots.forEach((slot, slotIndex) => {
          const openRotation = slotIndex * angle
          const currentRotation = openRotation * (1 - finalCollapseProgress)

          gsap.set(slot, {
            rotation: currentRotation,
          })
        })

        const openArtWheelRotation = -((artSlots.length - 1) * angle) / 2
        const currentArtWheelRotation = openArtWheelRotation * (1 - finalCollapseProgress)

        gsap.set(artWheel, {
          rotation: currentArtWheelRotation,
        })

        gsap.set(artTransitionSlot, {
          zIndex: artSlots.length + 20,
        })
      }

      // ----------------------
      // 11. Transition card lift
      // ----------------------
      if (self.progress >= finalCollapseEnd && self.progress < cardLiftEnd) {
        const liftProgress = getPhaseProgress(self.progress, finalCollapseEnd, cardLiftEnd)
        const easedLiftProgress = transitionCardLiftEase(liftProgress)

        const liftScale = gsap.utils.interpolate(1, transitionCardMaxScale, easedLiftProgress)

        gsap.set(artTransitionCard, {
          scale: liftScale,
        })
      }

      // ----------------------
      // 12. Transition card play
      // ----------------------
      if (self.progress >= cardLiftEnd && self.progress < cardPlayEnd) {
        const playProgress = getPhaseProgress(self.progress, cardLiftEnd, cardPlayEnd)
        const easedPlayProgress = transitionCardPLayEase(playProgress)

        const playScale = gsap.utils.interpolate(transitionCardMaxScale, 1, easedPlayProgress)

        gsap.set(artTransitionCard, {
          scale: playScale,
        })
      }

      // ----------------------
      // 13. Transition card cream reveal
      // ----------------------
      const revealProgress = getPhaseProgress(self.progress, cardPlayEnd, fullscreenStart)

      cardReveal.setProgress(revealProgress)

      // ----------------------
      // 14. Transition card hold
      // ----------------------
      if (self.progress >= cardPlayEnd && self.progress < fullscreenStart) {
        gsap.set(artTransitionCard, {
          scale: 1,
        })
      }

      // ----------------------
      // 15. Transition card fullscreen
      // ----------------------
      if (self.progress >= fullscreenStart) {
        const fullScreenProgress = getPhaseProgress(
          self.progress,
          fullscreenStart,
          finalTransitionEnd,
        )
        const easedFullscreenProgress = transitionCardFullScreenEase(fullScreenProgress)

        const fullscreenScale = gsap.utils.interpolate(
          1,
          transitionCardFullscreenScale,
          easedFullscreenProgress,
        )

        gsap.set(artTransitionCard, {
          scale: fullscreenScale,
        })
      }
    },

    // Reset out of scroll
    onLeaveBack: () => {
      setInitialState()
    },
  })
}

// Projects
function setupProjects() {
  // ----------------------
  // 1. Dom selections
  // ----------------------
  const root = document.querySelector(".projects")
  const pinHeight = root.querySelector(".projects__pin-height")
  const container = root.querySelector(".projects__container")

  const title = root.querySelector(".projects__title")
  const links = root.querySelectorAll(".projects__link")

  // ----------------------
  // 2. Device capabilities
  // ----------------------

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches

  // ----------------------
  // 2. Letters setup
  // ----------------------
  links.forEach((link) => {
    wrapProjectLetters(link)
  })

  // ----------------------
  // 4. Letters hover
  // ----------------------

  if (canHover) {
    setupProjectImageHover(links)
  }

  // ----------------------
  // 5. Project physics
  // ----------------------
  const projectPhysics = createProjectLetterPhysics(links)

  // ----------------------
  // 6. Initial state
  // ----------------------
  gsap.set(title, {
    autoAlpha: 0,
    yPercent: 40,
  })

  gsap.set(links, {
    autoAlpha: 0,
    yPercent: 35,
  })

  // ----------------------
  // 7. ScrollTrigger Pin
  // ----------------------
  ScrollTrigger.create({
    trigger: pinHeight,
    start: "top top",
    end: "bottom bottom",
    pin: container,
    markers: false,

    onEnter: () => {
      projectPhysics.start()
    },

    onEnterBack: () => {
      projectPhysics.start()
    },

    onLeave: () => {
      projectPhysics.settleAndStop()
    },

    onLeaveBack: () => {
      projectPhysics.settleAndStop()
    },

    onUpdate: (self) => {
      const scrollVelocity = self.getVelocity()

      if (Math.abs(scrollVelocity) > 4000) {
        projectPhysics.setScrollVelocity(0)
        return
      }

      projectPhysics.setScrollVelocity(scrollVelocity)
    },
  })

  // ----------------------
  // 8. Timeline
  // ----------------------
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pinHeight,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      markers: false,
    },
  })

  // ----------------------
  // 6. Title and links global Animations
  // ----------------------
  // Title
  tl.to(title, {
    autoAlpha: 1,
    yPercent: 0,
    duration: 0.4,
    ease: "power3.out",
  })

  // Links
  tl.to(
    links,
    {
      autoAlpha: 1,
      yPercent: 0,
      duration: 0.5,
      stagger: 0.18,
      ease: "power3.out",
    },
    ">",
  )

  // Cross-page navigation target after final physics
  tl.addLabel("projects-visible")

  // Projects to what's next section transition
  tl.to(container, {
    scaleX: 0.98,
    scaleY: 0.98,
    borderRadius: "0px 0px 32px 32px",
    transformOrigin: "center top",
    duration: 0.2,
    ease: "none",
  })

  return tl
}

// What's next section
function setupNextSection() {
  // ----------------------
  // 1. DOM selections
  // ----------------------
  const root = document.querySelector(".next-section")
  if (!root) return

  const pinHeight = root.querySelector(".next-section__pin-height")
  const container = root.querySelector(".next-section__container")
  const intro = root.querySelector(".next-section__intro")

  const svg = root.querySelector(".next-section__svg")
  const path = root.querySelector("#nextPath")
  const text = root.querySelector(".next-section__text")
  const textPath = root.querySelector("#nextTextPath")
  const creamTextPart = root.querySelector("#nextTextCream")
  const gradientTextPart = root.querySelector("#nextTextGradientPart")

  const orb = root.querySelector("#nextOrb")
  const footer = root.querySelector(".next-footer")

  // ----------------------
  // 2. SVG dimensions
  // ----------------------
  const viewBox = svg.viewBox.baseVal
  const viewBoxWidth = viewBox.width
  const viewBoxHeight = viewBox.height

  svg.style.aspectRatio = viewBoxWidth / viewBoxHeight

  const svgWidth = svg.getBoundingClientRect().width
  const containerWidth = container.getBoundingClientRect().width

  const scaleFactor = containerWidth / svgWidth

  // ----------------------
  // 3. SVG camera position & Initial state
  // ----------------------
  const position = {
    x: 0,
    y: 0,
  }

  gsap.set(orb, {
    autoAlpha: 0,
  })
  gsap.set(footer, {
    clipPath: "circle(0px at 50% 50%)",
  })

  function updateViewBox() {
    svg.setAttribute("viewBox", `${position.x} ${position.y} ${viewBoxWidth} ${viewBoxHeight}`)
  }

  // ----------------------
  // 4. Smooth viewBox movement
  // ----------------------
  const tweenOptions = {
    duration: 0.2,
    ease: "power1",
    onUpdate: updateViewBox,
  }

  const xTo = gsap.quickTo(position, "x", tweenOptions)
  const yTo = gsap.quickTo(position, "y", tweenOptions)

  // ----------------------
  // 5. Text preparation
  // ----------------------
  const creamFullText = creamTextPart.textContent.trim() + " "
  const gradientFullText = gradientTextPart.textContent.trim().replace(/\.$/, "")

  const gradientMeasureText = `${gradientFullText}.`

  const creamCharacters = creamFullText.split("")
  const gradientCharacters = gradientFullText.split("")

  const totalCharacters = creamCharacters.length + gradientCharacters.length

  creamTextPart.textContent = creamFullText
  gradientTextPart.textContent = gradientMeasureText
  const textLengthWithDot = textPath.getComputedTextLength()

  gradientTextPart.textContent = gradientFullText
  const textLength = textPath.getComputedTextLength()

  const orbLength = textLength + (textLengthWithDot - textLength) / 2

  creamTextPart.textContent = ""
  gradientTextPart.textContent = ""

  // ----------------------
  // 6. Path points generation & Helpers
  // ----------------------
  const stepCount = 1000
  const points = []

  for (let i = 0; i < stepCount; i++) {
    const progress = i / (stepCount - 1)
    const length = progress * orbLength
    const point = path.getPointAtLength(length)

    points.push({
      x: point.x,
      y: point.y,
    })
  }

  const orbPoint = path.getPointAtLength(orbLength)

  gsap.set(orb, {
    attr: {
      cx: orbPoint.x,
      cy: orbPoint.y,
    },
    autoAlpha: 0,
  })

  // Get footer center SVG -> XY point
  function getFooterCenterAsSvgPoint() {
    const footerRect = footer.getBoundingClientRect()

    const svgPoint = svg.createSVGPoint()

    svgPoint.x = footerRect.left + footerRect.width / 2
    svgPoint.y = footerRect.top + footerRect.height / 2

    const screenMatrix = svg.getScreenCTM()

    if (!screenMatrix) return orbPoint

    return svgPoint.matrixTransform(screenMatrix.inverse())
  }

  // Get middle free space above footer
  function getTextLiftY() {
    const containerRect = container.getBoundingClientRect()
    const footerRect = footer.getBoundingClientRect()

    const topAreaHeight = footerRect.top - containerRect.top
    const topAreaCenterY = topAreaHeight / 2
    const containerCenterY = containerRect.height / 2

    return topAreaCenterY - containerCenterY
  }

  // ----------------------
  // 7. Intro fade
  // ----------------------
  gsap.to(intro, {
    autoAlpha: 0,
    // y: -30,
    ease: "power2.out",

    scrollTrigger: {
      trigger: pinHeight,
      start: "top top",
      end: "top+=25% top",
      scrub: true,
      markers: false,
    },
  })

  // ----------------------
  // 8. Scroll settings
  // ----------------------
  // Text path progression
  const pathStart = 0.28
  const pathEnd = 0.82

  // Orb transition
  const orbRevealStart = 0.06

  const orbMoveStart = 0.3
  const orbMoveEnd = 0.6

  const orbStartRadius = 12
  const orbEndRadius = 12

  // Text movement
  const textLiftStart = orbMoveStart
  const textLiftEnd = orbMoveEnd
  const textLiftY = -200

  // Footer reveal when orb at center of footer
  const footerRevealStart = orbMoveEnd
  const footerRevealEnd = 1

  // Orb fade when footer reveal reach orb same radius
  const orbFadeRadiusStart = orbEndRadius * 0.85
  const orbFadeRadiusEnd = orbEndRadius * 1.35

  // ----------------------
  // 8. Pinned scroll section
  // ----------------------
  const nextSectionTrigger = ScrollTrigger.create({
    trigger: pinHeight,
    start: "top top",
    end: "bottom bottom",
    pin: container,
    scrub: true,
    markers: false,

    onUpdate: (self) => {
      // Progress phases
      const pathProgress = getPhaseProgress(self.progress, pathStart, pathEnd)
      const finalProgress = getPhaseProgress(self.progress, pathEnd, 1)

      // Camera follows path
      const pointIndex = Math.floor(pathProgress * (points.length - 1))
      const point = points[pointIndex]

      xTo(point.x - (viewBoxWidth * scaleFactor) / 2)
      yTo(point.y - viewBoxHeight / 2 - 30)

      // Text reveal
      const visibleCharacters = Math.floor(pathProgress * totalCharacters)

      const visibleCreamCharacters = Math.min(visibleCharacters, creamCharacters.length)
      const visibleGradientCharacters = Math.max(0, visibleCharacters - creamCharacters.length)

      const nextCreamText = creamCharacters.slice(0, visibleCreamCharacters).join("")
      const nextGradientText = gradientCharacters.slice(0, visibleGradientCharacters).join("")

      if (creamTextPart.textContent !== nextCreamText) {
        creamTextPart.textContent = nextCreamText
      }

      if (gradientTextPart.textContent !== nextGradientText) {
        gradientTextPart.textContent = nextGradientText
      }

      // Orb visibility
      const isOrbVisible = finalProgress > orbRevealStart

      // Text natural scroll movement
      const textLiftProgress = getPhaseProgress(finalProgress, textLiftStart, textLiftEnd)

      gsap.set(text, {
        autoAlpha: 1,
        y: textLiftY * textLiftProgress,
      })

      // Orb movement
      const orbMoveProgress = getPhaseProgress(finalProgress, orbMoveStart, orbMoveEnd)

      const footerCenterPoint = getFooterCenterAsSvgPoint()

      const orbX = gsap.utils.interpolate(orbPoint.x, footerCenterPoint.x, orbMoveProgress)
      const orbY = gsap.utils.interpolate(orbPoint.y, footerCenterPoint.y, orbMoveProgress)
      const orbRadius = gsap.utils.interpolate(orbStartRadius, orbEndRadius, orbMoveProgress)
      const orbColor = gsap.utils.interpolate("#ff6b4a", "#9b7cff", orbMoveProgress)

      // Footer reveal starts after orb movement
      const footerRevealProgress = getPhaseProgress(
        finalProgress,
        footerRevealStart,
        footerRevealEnd,
      )

      const footerRevealRadius = gsap.utils.interpolate(
        0,
        Math.hypot(footer.offsetWidth, footer.offsetHeight),
        footerRevealProgress,
      )

      gsap.set(footer, {
        clipPath: `circle(${footerRevealRadius}px at 50% 50%)`,
        webkitClipPath: `circle(${footerRevealRadius}px at 50% 50%)`,
        pointerEvents: footerRevealProgress > 0.4 ? "auto" : "none",
      })

      // Orb fades only when footer circle reaches orb radius
      const orbFadeProgress = getPhaseProgress(
        footerRevealRadius,
        orbFadeRadiusStart,
        orbFadeRadiusEnd,
      )

      gsap.set(orb, {
        autoAlpha: isOrbVisible ? 1 - orbFadeProgress : 0,
        attr: {
          cx: orbX,
          cy: orbY,
          r: orbRadius,
          fill: orbColor,
        },
      })
    },
  })

  return nextSectionTrigger
}
