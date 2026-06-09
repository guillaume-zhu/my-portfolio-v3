import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { createThreeHero } from "../../three/createThreeHero"

gsap.registerPlugin(ScrollTrigger)

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
const heroFrame = document.querySelector(".hero-three__frame")

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

// Scene to Manifesto transition
gsap.to(".hero-three__frame", {
  scaleX: 0.98,
  scaleY: 0.98,
  borderRadius: "Opx 0px 32px 32px",
  ease: "none",

  scrollTrigger: {
    trigger: ".manifesto",
    start: "top bottom-=500",
    end: "top bottom-=900",
    scrub: true,
    markers: true,
  },
})

// ----------------------
// Manifesto
// ----------------------
document.fonts.ready.then(() => {
  const text = document.querySelector(".manifesto .text")
  wrapLettersInSpan(text)

  const letters = document.querySelectorAll(".manifesto .letter")
  const distance = text.clientWidth - document.body.clientWidth

  const scrollTween = gsap.to(text, {
    x: -distance,
    ease: "none",
    scrollTrigger: {
      trigger: ".manifesto .container",
      pin: true,
      end: "+=" + distance,
      markers: false,
      scrub: true,
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
})

const wrapLettersInSpan = (element) => {
  const text = element.textContent
  element.innerHTML = text
    .split("")
    .map((char) => (char === " " ? "<span>&nbsp;</span>" : `<span class="letter">${char}</span>`))
    .join("")
}
