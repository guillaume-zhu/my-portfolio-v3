import { createI18n } from "../../shared/i18n"
import { setupPlaygroundLinkHover } from "../../shared/link-hover/setupPlaygroundLinkHover"
import { createIncomingPageTransition } from "../../shared/page-transition/createPageTransition"
import { setupCrossPageTransitions } from "../../shared/page-transition/setupCrossPageTransitions"
import { createSiteHeader } from "../../shared/site-header/createSiteHeader"

const i18n = createI18n()

i18n.applyTranslations()
createSiteHeader(i18n)
setupPlaygroundLinkHover()

const { pageTransition, shouldRevealTransition } = createIncomingPageTransition()

setupCrossPageTransitions({
  pageTransition,
})

document.fonts.ready.then(async () => {
  if (shouldRevealTransition) {
    await pageTransition.reveal()
  }
})
