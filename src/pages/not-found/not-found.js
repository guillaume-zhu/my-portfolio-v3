import { createI18n } from "../../shared/i18n"
import { prefersReducedMotion } from "../../shared/motion/preference"
import { createSiteHeader } from "../../shared/site-header/createSiteHeader"

import { createNotFoundScene } from "./webgl/createNotFoundScene"

const i18n = createI18n()

i18n.applyTranslations()
createSiteHeader(i18n)

const scene = createNotFoundScene({
  imageUrl: "/404/gradient-404.webp",
  reducedMotion: prefersReducedMotion,
})

window.addEventListener("pagehide", () => {
  scene?.destroy()
}, { once: true })
