import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Matter from "matter-js"

export function createProjectLetterPhysics(links) {
  // ----------------------------------
  // 1. MATTER.JS SETUP
  // ----------------------------------

  const { Engine, Composite, Bodies, Body, Constraint } = Matter

  const engine = Engine.create()
  engine.world.gravity.y = 0.5

  const collisionGroup = Body.nextGroup(true)

  // Store the connection between DOM letters and their Matter.js bodies
  const letterBodies = []

  let isSettling = false

  let resizeTimeout

  // ----------------------------------
  // 2. CREATE AND REBUILD PHYSICS
  // ----------------------------------

  function createProjectPhysics() {
    // ----------------------------------
    // Reset previous DOM transformations
    // ----------------------------------

    links.forEach((link) => {
      const letters = link.querySelectorAll(".project-letter")

      letters.forEach((letter) => {
        letter.style.transform = ""
      })
    })

    // ----------------------------------
    // Clear the previous simulation
    // ----------------------------------

    Composite.clear(engine.world, false)
    Engine.clear(engine)

    letterBodies.length = 0

    const currentScrollY = window.scrollY

    // ----------------------------------
    // Build each project line separately
    // ----------------------------------
    // Prevents last letter of one project being connected to the next project

    links.forEach((link) => {
      const projectLetters = link.querySelectorAll(".project-letter")

      const projectLetterBodies = []

      const middleIndex = (projectLetters.length - 1) / 2

      // --------------------------------
      // Create one body for each letter
      // --------------------------------

      projectLetters.forEach((letter, index) => {
        const rect = letter.getBoundingClientRect()

        if (rect.width === 0 || rect.height === 0) {
          return
        }

        // Initial center position of the letter
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + currentScrollY + rect.height / 2

        // Invisible physical body
        const body = Bodies.rectangle(centerX, centerY, rect.width, rect.height, {
          frictionAir: 0.05,
          density: 0.001,

          collisionFilter: {
            group: collisionGroup,
          },
        })

        // Anchor pulls the letter back to its initial position
        const anchor = Constraint.create({
          pointA: {
            x: centerX,
            y: centerY,
          },

          bodyB: body,

          stiffness: 0.005,
          damping: 0.004,
          length: 0,
        })

        // Center letters move less Edge letters react more strongly
        const normalizedDistance =
          middleIndex === 0 ? 0 : Math.abs(index - middleIndex) / middleIndex

        const letterData = {
          element: letter,
          body,
          anchor,

          initialX: centerX,
          initialY: centerY,

          width: rect.width,
          weight: normalizedDistance,
        }

        projectLetterBodies.push(letterData)
        letterBodies.push(letterData)

        Composite.add(engine.world, [body, anchor])
      })

      // --------------------------------
      // Connect neighboring letters
      // --------------------------------
      // These constraints make the project name behave like one flexible line

      for (let index = 0; index < projectLetterBodies.length - 1; index++) {
        const currentLetter = projectLetterBodies[index]

        const nextLetter = projectLetterBodies[index + 1]

        const connection = Constraint.create({
          bodyA: currentLetter.body,
          bodyB: nextLetter.body,

          // Right side of the current letter
          pointA: {
            x: currentLetter.width / 2,
            y: 0,
          },

          // Left side of the next letter
          pointB: {
            x: -nextLetter.width / 2,
            y: 0,
          },

          stiffness: 0.6,
          length: 0,
        })

        Composite.add(engine.world, connection)
      }
    })
  }

  // ----------------------------------
  // 3. RESET LETTERS
  // ----------------------------------

  function resetLettersToInitialPosition() {
    letterBodies.forEach((letter) => {
      Body.setPosition(letter.body, {
        x: letter.initialX,
        y: letter.initialY,
      })

      Body.setVelocity(letter.body, {
        x: 0,
        y: 0,
      })

      Body.setAngle(letter.body, 0)
      Body.setAngularVelocity(letter.body, 0)

      letter.anchor.pointA.y = letter.initialY

      // Remove Matter.js DOM transformation
      letter.element.style.transform = ""
    })
  }

  // ----------------------------------
  // 4. UPDATE PHYSICS ON EACH FRAME
  // ----------------------------------

  function updateProjectPhysics() {
    // Advance the Matter.js simulation
    Engine.update(engine, 1000 / 60)

    letterBodies.forEach((letter) => {
      // Reduce excessive rotation
      Body.setAngle(letter.body, letter.body.angle * 0.97)

      Body.setAngularVelocity(letter.body, letter.body.angularVelocity * 0.95)

      // Calculate movement from the initial position
      const offsetX = letter.body.position.x - letter.initialX

      const offsetY = letter.body.position.y - letter.initialY

      // Apply Matter.js movement to the DOM letter
      letter.element.style.transform = `
        translate3d(${offsetX}px, ${offsetY}px, 0)
        rotate(${letter.body.angle}rad)
      `
    })

    if (!isSettling) return

    // ----------------------------------
    // Check if all letters are at rest
    // ----------------------------------

    const areLettersSettled = letterBodies.every((letter) => {
      const distanceX = Math.abs(letter.body.position.x - letter.initialX)

      const distanceY = Math.abs(letter.body.position.y - letter.initialY)

      const velocity = Math.hypot(letter.body.velocity.x, letter.body.velocity.y)

      const angularVelocity = Math.abs(letter.body.angularVelocity)

      const anchorDistance = Math.abs(letter.anchor.pointA.y - letter.initialY)

      return (
        distanceX < 0.25 &&
        distanceY < 0.25 &&
        velocity < 0.02 &&
        angularVelocity < 0.002 &&
        anchorDistance < 0.1
      )
    })

    if (!areLettersSettled) return

    // Reset remaining invisible fraction
    resetLettersToInitialPosition()

    isSettling = false

    // Stop updating Matter.js
    gsap.ticker.remove(updateProjectPhysics)
  }

  // ----------------------------------
  // 5. PHYSICS CONTROLS
  // ----------------------------------

  // Restart if come back
  function startProjectPhysics() {
    isSettling = false

    // Restore gravity
    engine.world.gravity.y = 0.5

    // Stop an unfinished return animation
    letterBodies.forEach((letter) => {
      gsap.killTweensOf(letter.anchor.pointA)
    })

    // Prevent duplicate ticker registrations
    gsap.ticker.remove(updateProjectPhysics)

    gsap.ticker.add(updateProjectPhysics)
  }

  // Progressive stop
  function settleAndStopProjectPhysics() {
    isSettling = true

    // Remove gravity while letters return
    engine.world.gravity.y = 0

    // Bring every anchor back to its origin
    letterBodies.forEach((letter) => {
      gsap.to(letter.anchor.pointA, {
        y: letter.initialY,
        duration: 0.35,
        ease: "power3.out",
        overwrite: true,
      })
    })
  }

  // Scroll velocity transfert
  function setScrollVelocity(velocity) {
    if (isSettling) return

    letterBodies.forEach((letter) => {
      // Move the anchor according to scroll velocity
      letter.anchor.pointA.y = letter.initialY + velocity * 0.08 * letter.weight
    })
  }

  // ----------------------------------
  // 6. RESIZE
  // ----------------------------------

  function handleResize() {
    clearTimeout(resizeTimeout)

    resizeTimeout = setTimeout(() => {
      // Refresh the layout before rebuilding physics after 200ms
      ScrollTrigger.refresh()
      createProjectPhysics()
    }, 200)
  }

  window.addEventListener("resize", handleResize)

  // ----------------------------------
  // 7. INITIALISATION
  // ----------------------------------

  createProjectPhysics()

  // ----------------------------------
  // 8. RETURN
  // ----------------------------------
  // Controls used by setupProjects()

  return {
    start: startProjectPhysics,
    settleAndStop: settleAndStopProjectPhysics,
    setScrollVelocity,
  }
}
