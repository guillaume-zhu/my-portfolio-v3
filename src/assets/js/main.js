import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { createThreeHero } from "../../three/createThreeHero"

gsap.registerPlugin(ScrollTrigger)

const threeHero = await createThreeHero()
