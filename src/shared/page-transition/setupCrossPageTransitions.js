// Detect color
const DEFAULT_TRANSITION_COLOR = "cream"

const transitionColorByPath = {
  "/projects/memories-of-ghibli": "dark",
  "/projects/pulse-festival": "cream",
  "/projects/mae-webflow": "cream",
  "/projects/ornate": "dark",
  "/projects/mirage": "dark",
  "/playground": "dark",
  "/mentions-legales": "dark",
}

const homeTransitionColorByHash = {
  "#parcours": "cream",
  "#toolkit": "cream",
  "#projects": "dark",
  "#contact": "cream",
}

function normalizePathname(pathname) {
  return pathname.replace(/\/+$/, "") || "/"
}

function getTransitionColor(targetUrl) {
  const pathname = normalizePathname(targetUrl.pathname)

  if (pathname === "/") {
    return homeTransitionColorByHash[targetUrl.hash] || DEFAULT_TRANSITION_COLOR
  }

  if (pathname.includes("credits")) {
    return "dark"
  }

  return transitionColorByPath[pathname] || DEFAULT_TRANSITION_COLOR
}

// Detect modified click
function isModifiedClick(event) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

// Identify real page from url
function getDocumentKey(url) {
  const pathname = url.pathname.replace(/\/+$/, "") || "/"

  return `${url.origin}${pathname}${url.search}`
}

// Verify if link = same page
function staysOnCurrentDocument(targetUrl) {
  const currentUrl = new URL(window.location.href)

  return getDocumentKey(targetUrl) === getDocumentKey(currentUrl)
}

export function setupCrossPageTransitions({
  pageTransition,
  onNavigateStart,
  onNavigateCancelled,
}) {
  let isNavigating = false

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return

    isNavigating = false
    pageTransition.reset()
    onNavigateCancelled?.()
  })

  document.addEventListener("click", async (event) => {
    if (event.defaultPrevented || isModifiedClick(event)) return
    if (!(event.target instanceof Element)) return

    const link = event.target.closest("a[href]")

    if (!link) return
    if (link.hasAttribute("download")) return
    if (link.target && link.target !== "_self") return

    const targetUrl = new URL(link.href, window.location.href)

    if (targetUrl.origin !== window.location.origin) return
    if (staysOnCurrentDocument(targetUrl)) return

    event.preventDefault()

    if (isNavigating) return

    isNavigating = true
    onNavigateStart?.()

    try {
      const transitionColor = getTransitionColor(targetUrl)

      const didNavigate = await pageTransition.navigateTo(targetUrl.href, {
        color: transitionColor,
      })

      if (!didNavigate) {
        isNavigating = false
        onNavigateCancelled?.()
      }
    } catch (error) {
      isNavigating = false
      onNavigateCancelled?.()

      console.error("Page transition navigation failed:", error)
    }
  })
}
