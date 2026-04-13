# Frontend Guidelines

## Skill Usage

- Use `frontend-skill` for frontend design work.
- Use `caveman` when I am asking you to accomplish frontend tasks rather than explain something, but do not apply it during planning or Plan Mode.

## General

- Utilize shadcn components as the base for components whenever it makes sense to do so.
- Utilize zod for validation of forms, api requests, and api responses.
- Utilize the motion library for complex animations.

## Safari Animation Performance

- Treat Safari on macOS and iOS as a performance-sensitive target for Motion and CSS animations.
- Prefer transform-only animations (`x`, `y`, `rotate`, `scale`, `opacity`) for looping or frequent animations, especially when using Motion.
- Avoid animating expensive properties on large surfaces, including `blur`, `filter`, `backdrop-filter`, `borderRadius`, `box-shadow`, `gridTemplateRows`, and other layout-affecting properties.
- For large ambient backgrounds or blob effects, keep the visual blur/gradient static and animate only isolated wrapper transforms around them.
- Prefer CSS keyframes for simple infinite ambient loops when Motion is not needed for orchestration or interaction.
- Use Motion for small, isolated transform-based animations where its choreography is useful, but keep those animated elements on their own composited layers.
- Add compositor-friendly hints to continuously animated elements when appropriate, such as GPU transforms, `will-change: transform`, and hidden backface.
- Avoid combining large blurred elements with continuous Motion-driven transforms on the same node.
- When revealing or collapsing UI in Safari-sensitive areas, prefer transform/opacity or bounded size transitions over animated layout/grid measurements.
- If an animation is visually important, optimize it so the appearance stays the same before considering reducing or removing the motion.

## Button Styling

- For primary CTA buttons with chunky borders and offset shadows, prefer a separate fixed shadow layer behind the button instead of animating the button's box-shadow directly.
- On hover, the button should translate toward the shadow while the shadow itself stays visually stationary.
- Do not let the button fully cover the shadow on hover. Some of the shadow should remain visible.
- Keep button hover behavior consistent across similar CTAs on the same page or in the same component family.
- When adjusting button/shadow geometry, preserve the intended diagonal relationship between the button and its shadow. Do not accidentally turn it into a mostly vertical offset.
