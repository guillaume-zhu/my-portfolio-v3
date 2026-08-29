import { createI18n } from "../../shared/i18n"
import { createSiteHeader } from "../../shared/site-header/createSiteHeader"
import { createIncomingPageTransition } from "../../shared/page-transition/createPageTransition"
import { setupCrossPageTransitions } from "../../shared/page-transition/setupCrossPageTransitions"

const supportsI18n = ["ghibli-credits", "legal-notice"].includes(document.body.dataset.i18nPage)
const i18n = supportsI18n ? createI18n() : null

i18n?.applyTranslations()
createSiteHeader(i18n)

const { pageTransition, shouldRevealTransition } = createIncomingPageTransition()

setupCrossPageTransitions({
  pageTransition,
})

document.fonts.ready.then(async () => {
  if (shouldRevealTransition) {
    await pageTransition.reveal()
  }
})
