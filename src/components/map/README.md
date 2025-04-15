# Text Components for React Three Fiber

This directory contains simplified text components for use in React Three Fiber scenes.

## Components

### Text2D

A wrapper around the `Text` component from `@react-three/drei` for rendering flat text that always faces the camera.

```tsx
import Text2D from './Text2D'

function MyScene() {
  return (
    <Canvas>
      <ambientLight />
      <Text2D
        position={[0, 1, 0]}
        color="white"
        fontSize={0.5}
      >
        Hello World
      </Text2D>
    </Canvas>
  )
}
```

### Text3D

A wrapper around the `Text3D` component from `@react-three/drei` for rendering extruded 3D text.

```tsx
import Text3D from './Text3D'

function MyScene() {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Text3D
        font="/fonts/inter.json"
        position={[0, 0, 0]}
        size={1}
        height={0.2}
        color="orange"
      >
        3D Text
      </Text3D>
    </Canvas>
  )
}
```

## Font Usage

### For Text2D

The `Text` component from drei accepts regular font files. Put your fonts in the `/public/fonts/` directory:

- .woff or .ttf files work directly
- No font conversion needed
- Example: `font="/fonts/inter-light.woff"`

### For Text3D

The `Text3D` component requires fonts in JSON format:

1. Download a font from Google Fonts
2. Convert it to JSON format using a tool like [Facetype.js](https://gero3.github.io/facetype.js/)
3. Save the JSON file to `/public/fonts/`
4. Reference it in your component: `font="/fonts/inter.json"`

## Best Practices

1. **Minimize Font Loading**: Load only the fonts you need
2. **Preload Fonts**: For critical text, consider preloading fonts
3. **Use Text2D for UI**: For interface elements, use Text2D as it's more performant
4. **Use Text3D Sparingly**: 3D text is more expensive to render, use only when needed
5. **Center Properly**: Use the `textAlign` and `anchorX/Y` props to position text correctly 