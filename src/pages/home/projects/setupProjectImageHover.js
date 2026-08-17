import gsap from "gsap"

const PROJECT_IMAGES = {
  ghibli: [
    "/projects/memories-of-ghibli/previews/ghibli-01-square.png",
    "/projects/memories-of-ghibli/previews/ghibli-02-square.webp",
    "/projects/memories-of-ghibli/previews/ghibli-03-portrait.png",
    "/projects/memories-of-ghibli/previews/ghibli-04-carre.png",
    "/projects/memories-of-ghibli/previews/ghibli-05-portrait.png",
    "/projects/memories-of-ghibli/previews/ghibli-06-carre.png",
    "/projects/memories-of-ghibli/previews/ghibli-07-carre.png",
    "/projects/memories-of-ghibli/previews/ghibli-08-portrait.webp",
  ],
  pulse: [
    "/projects/pulse-festival/previews/pulse-01-portrait.webp",
    "/projects/pulse-festival/previews/pulse-02-square.webp",
    "/projects/pulse-festival/previews/pulse-03-portrait.webp",
    "/projects/pulse-festival/previews/pulse-04-square.webp",
    "/projects/pulse-festival/previews/pulse-05-square.webp",
    "/projects/pulse-festival/previews/pulse-06-portrait.webp",
    "/projects/pulse-festival/previews/pulse-07-portrait.webp",
    "/projects/pulse-festival/previews/pulse-08-square.webp",
  ],

  webflow: [
    "/projects/mae-webflow/previews/webflow-01-square.webp",
    "/projects/mae-webflow/previews/webflow-02-square.webp",
    "/projects/mae-webflow/previews/webflow-03-portrait.webp",
    "/projects/mae-webflow/previews/webflow-04-portrait.webp",
    "/projects/mae-webflow/previews/webflow-05-square.webp",
    "/projects/mae-webflow/previews/webflow-06-portrait.webp",
  ],

  ornate: [
    "/projects/ornate/previews/ornate-01-portrait.webp",
    "/projects/ornate/previews/ornate-02-square.webp",
    "/projects/ornate/previews/ornate-03-square.webp",
    "/projects/ornate/previews/ornate-04-square.webp",
    "/projects/ornate/previews/ornate-05-portrait.webp",
    "/projects/ornate/previews/ornate-06-square.webp",
  ],

  mirage: [
    "/projects/mirage/previews/mirage-01-square.webp",
    "/projects/mirage/previews/mirage-02-square.webp",
    "/projects/mirage/previews/mirage-03-portrait.webp",
    "/projects/mirage/previews/mirage-04-square.webp",
    "/projects/mirage/previews/mirage-05-square.webp",
    "/projects/mirage/previews/mirage-06-portrait.webp",
  ],
}

let projectImagesPreloadStarted = false

export function preloadProjectImages() {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches

  if (!canHover) return
  if (projectImagesPreloadStarted) return

  projectImagesPreloadStarted = true

  Object.values(PROJECT_IMAGES).forEach((images) => {
    images.forEach((imageSource) => {
      const image = new Image()
      image.src = imageSource
    })
  })
}

export function setupProjectImageHover(links) {
  // ----------------------
  // Setup project hovers
  // ----------------------
  links.forEach((link) => {
    // Project data
    const projectName = link.dataset.project
    const images = PROJECT_IMAGES[projectName]

    if (!images) return

    const letters = [...link.querySelectorAll(".project-letter__content")]

    // Project state
    const overflows = new Array(letters.length).fill(0)
    let imageIndex = 0

    // Calculate and animate letter offsets
    function applyLetterOffsets() {
      if (letters.length === 0) return

      let spaceOnTheLeft = 0
      const targets = []

      for (let index = 0; index < overflows.length; index++) {
        const overflow = overflows[index]

        const overflowsOnTheRight = overflows.slice(index + 1)

        const spaceOnTheRight = overflowsOnTheRight.reduce((total, value) => total + value, 0)

        const x = spaceOnTheLeft - spaceOnTheRight

        spaceOnTheLeft += overflow

        targets.push(x)
      }

      gsap.to(letters, {
        x: (index) => targets[index],
        duration: 0.3,
        ease: "back.out(3)",
        overwrite: "auto",
      })
    }

    // ----------------------
    // 3. Letter hover
    // ----------------------
    letters.forEach((letter, letterIndex) => {
      if (letter.textContent.trim() === "") return

      letter.addEventListener("mouseenter", () => {
        // Prevent multiple image on same letter
        const currentImage = letter.querySelector(".project-letter__image")

        if (currentImage) return

        // Select next image and loop back
        const imageSource = images[imageIndex % images.length]
        imageIndex++

        // Create image
        const image = document.createElement("img")

        image.src = imageSource
        image.alt = ""
        image.classList.add("project-letter__image")

        // Apply image format
        if (imageSource.includes("portrait")) {
          image.classList.add("is-portrait")
        } else {
          image.classList.add("is-square")
        }

        // Insert inside hovered letter
        letter.append(image)

        // Center image
        gsap.set(image, {
          xPercent: -50,
          yPercent: -50,
        })

        // Image entrance
        gsap.from(image, {
          rotation: (Math.random() - 0.5) * 20,
          scale: 1.05,
          duration: 0.3,
          ease: "back.out(2)",
        })

        // Reserve space around the image
        const letterWidth = letter.getBoundingClientRect().width
        const imageSpacingWidth = 0.085 * window.innerWidth
        const extraWidth = imageSpacingWidth - letterWidth
        const overflowX = Math.max(0, extraWidth / 2)
        overflows[letterIndex] = overflowX
        applyLetterOffsets()

        // Remove image and restore spacing
        gsap.delayedCall(1.2, () => {
          const parent = image.parentElement

          if (!parent) return

          overflows[letterIndex] = 0

          image.remove()

          applyLetterOffsets()

          // Letter reappearance
          gsap.from(parent, {
            rotation: (Math.random() - 0.5) * 20,
            scale: 1.05,
            duration: 0.3,
            ease: "back.out(2)",
          })
        })
      })
    })
  })
}
