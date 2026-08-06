import gsap from "gsap"

const PROJECT_IMAGES = {
  ghibli: [
    "/images/projects/hover/ghibli/ghibli-01-square.png",
    "/images/projects/hover/ghibli/ghibli-02-square.webp",
    "/images/projects/hover/ghibli/ghibli-03-portrait.png",
    "/images/projects/hover/ghibli/ghibli-04-carre.png",
    "/images/projects/hover/ghibli/ghibli-05-portrait.png",
    "/images/projects/hover/ghibli/ghibli-06-carre.png",
    "/images/projects/hover/ghibli/ghibli-07-carre.png",
    "/images/projects/hover/ghibli/ghibli-08-portrait.webp",
  ],
  pulse: [
    "/images/projects/hover/pulse/pulse-01-portrait.webp",
    "/images/projects/hover/pulse/pulse-02-square.webp",
    "/images/projects/hover/pulse/pulse-03-portrait.webp",
    "/images/projects/hover/pulse/pulse-04-square.webp",
    "/images/projects/hover/pulse/pulse-05-square.webp",
    "/images/projects/hover/pulse/pulse-06-portrait.webp",
    "/images/projects/hover/pulse/pulse-07-portrait.webp",
    "/images/projects/hover/pulse/pulse-08-square.webp",
  ],

  webflow: [
    "/images/projects/hover/webflow/webflow-01-square.webp",
    "/images/projects/hover/webflow/webflow-02-square.webp",
    "/images/projects/hover/webflow/webflow-03-portrait.webp",
    "/images/projects/hover/webflow/webflow-04-portrait.webp",
    "/images/projects/hover/webflow/webflow-05-square.webp",
    "/images/projects/hover/webflow/webflow-06-portrait.webp",
  ],

  ornate: [
    "/images/projects/hover/ornate/ornate-01-portrait.webp",
    "/images/projects/hover/ornate/ornate-02-square.webp",
    "/images/projects/hover/ornate/ornate-03-square.webp",
    "/images/projects/hover/ornate/ornate-04-square.webp",
    "/images/projects/hover/ornate/ornate-05-portrait.webp",
    "/images/projects/hover/ornate/ornate-06-square.webp",
  ],

  mirage: [
    "/images/projects/hover/mirage/mirage-01-square.webp",
    "/images/projects/hover/mirage/mirage-02-square.webp",
    "/images/projects/hover/mirage/mirage-03-portrait.webp",
    "/images/projects/hover/mirage/mirage-04-square.webp",
    "/images/projects/hover/mirage/mirage-05-square.webp",
    "/images/projects/hover/mirage/mirage-06-portrait.webp",
  ],
}

export function setupProjectImageHover(links) {
  // ----------------------
  // 1. Preload images
  // ----------------------
  Object.values(PROJECT_IMAGES).forEach((images) => {
    images.forEach((imageSource) => {
      const image = new Image()
      image.src = imageSource
    })
  })

  // ----------------------
  // 2. Setup project hovers
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
