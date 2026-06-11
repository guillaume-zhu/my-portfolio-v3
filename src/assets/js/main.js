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

  const text = element.textContent
  element.innerHTML = text
    .split("")
    .map((char) => (char === " " ? "<span>&nbsp;</span>" : `<span class="letter">${char}</span>`))
    .join("")

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

// Trajectory
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
