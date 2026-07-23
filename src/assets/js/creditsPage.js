import { createSiteHeader } from "../components/createSiteHeader"
import { createIncomingPageTransition } from "./transitions/createPageTransition"
import { setupCrossPageTransitions } from "./transitions/setupCrossPageTransitions"

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
