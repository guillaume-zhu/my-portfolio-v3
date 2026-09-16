import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { createI18n } from "../../shared/i18n"
import { setupPlaygroundLinkHover } from "../../shared/link-hover/setupPlaygroundLinkHover"
import { createSiteHeader } from "../../shared/site-header/createSiteHeader"
import { setupHeaderVisibility } from "../../shared/site-header/setupHeaderVisibility"
import { createIncomingPageTransition } from "../../shared/page-transition/createPageTransition"
import { setupCrossPageTransitions } from "../../shared/page-transition/setupCrossPageTransitions"

const supportsI18n = ["ghibli-credits", "legal-notice"].includes(document.body.dataset.i18nPage)
const i18n = supportsI18n ? createI18n() : null

i18n?.applyTranslations()
createSiteHeader(i18n)
setupPlaygroundLinkHover()

const lenis = new Lenis({
  anchors: true,
  autoRaf: true,
})

setupHeaderVisibility(lenis)

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

document.fonts.ready.then(async () => {
  if (shouldRevealTransition) {
    await pageTransition.reveal()
  }
})
