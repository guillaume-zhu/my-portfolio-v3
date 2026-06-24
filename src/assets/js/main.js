import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { createThreeHero } from "../../three/createThreeHero"
import { createToolkitCardReveal } from "../../three/createToolkitCardReveal"
import { createProjectLetterPhysics } from "./projects/createProjectLetterPhysics"

gsap.registerPlugin(ScrollTrigger)

// ----------------------
// Global setup
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
  setupTrajectorySentences()
  setupTrajectoryToToolkitTransition()
  setupToolkit()
  setupProjects()

  ScrollTrigger.refresh()
})

// ----------------------
// Functions
// ----------------------

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

      // Change UI mode
      tl.to(
        {},
        {
          duration: 0.001,
          onStart: () => {
            document.body.classList.add("is-visual-fullscreen")
          },
          onReverseComplete: () => {
            document.body.classList.remove("is-visual-fullscreen")
          },
        },
        "<",
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

  links.forEach((link) => {
    wrapProjectLetters(link)
  })

  // ----------------------
  // 2. Project physics
  // ----------------------
  const projectPhysics = createProjectLetterPhysics(links)

  // ----------------------
  // 3. Initial state
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
  // 4. ScrollTrigger Pin
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
      projectPhysics.setScrollVelocity(self.getVelocity())
    },
  })

  // ----------------------
  // 5. Timeline
  // ----------------------
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: pinHeight,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      markers: true,
    },
  })

  // ----------------------
  // 6. Animations
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

  // Hold
  tl.to(
    {},
    {
      duration: 0.8,
    },
  )
}
