import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { createThreeHero } from "../../three/createThreeHero"

gsap.registerPlugin(ScrollTrigger)

const threeHero = await createThreeHero()

ScrollTrigger.create({
  trigger: ".hero-three",
  start: "top top",
  end: "+=4000",
  scrub: true,
  pin: true,
  markers: true,

  onUpdate: (self) => {
    threeHero.setScrollProgress(self.progress, self.getVelocity())
  },
})
