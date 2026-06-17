import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { createThreeHero } from "../../three/createThreeHero"

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
      fontWeight: 300,
    },
    { fontWeight: 700, ease: "none" },
    0,
  )
}

// Toolkit
function setupToolkit() {
  // DOM selections
  const root = document.querySelector(".toolkit")
  if (!root) return

  const pinHeight = root.querySelector(".toolkit__pin-height")
  const container = root.querySelector(".toolkit__container")
  const wheel = root.querySelector(".toolkit__wheel--frontend")
  const slots = root.querySelectorAll(".toolkit__wheel--frontend .toolkit__slot")

  if (!pinHeight || !container || !wheel || !slots.length) return

  // Settings
  const angle = 3.5
  let currentIndex = 0
  const hoverZIndex = slots.length + 10

  // Initial state
  slots.forEach((slot, index) => {
    slot.classList.toggle("is-visible", index === 0)

    gsap.set(slot, {
      rotation: index * angle,
      zIndex: index + 1,
    })
  })

  gsap.set(wheel, {
    rotation: 0,
  })

  // Hover z-index
  slots.forEach((slot, index) => {
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

  // Scroll animation
  ScrollTrigger.create({
    trigger: pinHeight,
    start: "top top",
    end: "bottom bottom",
    pin: container,
    scrub: true,
    markers: true,

    onUpdate: (self) => {
      const index = Math.min(Math.floor(self.progress * slots.length), slots.length - 1)

      if (index === currentIndex) return

      // Card and wheel animation + reactive index
      if (index > currentIndex) {
        for (let i = currentIndex + 1; i <= index; i++) {
          slots[i].classList.add("is-visible")

          gsap.fromTo(
            slots[i],
            {
              scale: 0.94,
            },
            {
              scale: 1,
              ease: "elastic.out(0.6, 0.3)",
              duration: 0.5,
            },
          )
        }
      } else {
        for (let i = currentIndex; i > index; i--) {
          slots[i].classList.remove("is-visible")
        }
      }

      gsap.to(wheel, {
        rotation: -(index * angle) / 2,
        ease: "elastic.out(0.6,0.3)",
        duration: 0.5,
        overwrite: true,
      })

      currentIndex = index
    },

    // Reset out of scroll
    onLeaveBack: () => {
      currentIndex = 0

      slots.forEach((slot, index) => {
        slot.classList.toggle("is-visible", index === 0)
      })

      gsap.set(wheel, {
        rotation: 0,
      })
    },
  })
}
