import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { createThreeHero } from "../../three/createThreeHero"

gsap.registerPlugin(ScrollTrigger)

const threeHero = await createThreeHero()

const heroFrame = document.querySelector(".hero-three__frame")
console.log(heroFrame)

// Scene scroll animation
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
  borderRadius: "32px",
  ease: "none",

  scrollTrigger: {
    trigger: ".manifesto",
    start: "top bottom-=100",
    end: "top bottom-=750",
    scrub: true,
    markers: false,
  },
})
