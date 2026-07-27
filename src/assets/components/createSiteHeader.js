export function createSiteHeader() {
  const header = document.querySelector(".site-header")

  header.innerHTML = `
    <a
      class="site-header__logo"
      href="/"
      aria-label="Retour à l’accueil"
    >
      <span
        class="site-header__logo-mark"
        aria-hidden="true"
      ></span>
    </a>

    <nav
      class="site-header__nav"
      aria-label="Navigation principale"
    >

      <a
        class="site-header__link site-header__link--playground"
        href="/playground/">
        playground
      </a>

      <a
        class="site-header__link site-header__link--secondary"
        href="/#parcours"
      >
        parcours
      </a>

      <a
        class="site-header__link site-header__link--secondary"
        href="/#toolkit"
      >
        toolkit
      </a>

      <a class="site-header__link" href="/#projects">
        projets
      </a>

      <a class="site-header__link" href="/#contact">
        contact
      </a>

      
    </nav>
  `
}
