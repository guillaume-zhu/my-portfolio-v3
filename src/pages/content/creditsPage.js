import { createSiteHeader } from "../../shared/site-header/createSiteHeader"
import { createIncomingPageTransition } from "../../shared/page-transition/createPageTransition"
import { setupCrossPageTransitions } from "../../shared/page-transition/setupCrossPageTransitions"

createSiteHeader()

const { pageTransition, shouldRevealTransition } = createIncomingPageTransition()

setupCrossPageTransitions({
  pageTransition,
})

document.fonts.ready.then(async () => {
  if (shouldRevealTransition) {
    await pageTransition.reveal()
  }
})
