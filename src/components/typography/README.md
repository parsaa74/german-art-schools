# Typography Components for React Three Fiber

This directory contains professional text rendering components for use in React Three Fiber scenes, providing both 2D and 3D text capabilities.

## Components

### Text2D

A wrapper around the `Text` component from `@react-three/drei` for rendering flat text that always faces the camera.

```tsx
import { Text2D } from '@/components/typography'

function MyScene() {
  return (
    <Canvas>
      <ambientLight />
      <Text2D
        position={[0, 1, 0]}
        color="white"
        fontSize={0.5}
        font="/fonts/inter-regular.ttf"
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
import { Text3D } from '@/components/typography'

function MyScene() {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Text3D
        font="/fonts/inter.json"
        position={[0, 0, 0]}
        fontSize={1}
        height={0.2}
        color="orange"
        bevelEnabled
      >
        3D Text
      </Text3D>
    </Canvas>
  )
}
```

## Font Usage

### For Text2D

The `Text2D` component accepts regular font files. Place your fonts in the `/public/fonts/` directory:

- `.ttf` files work best for compatibility
- No font conversion needed
- Example: `font="/fonts/inter-regular.ttf"`

### For Text3D

The `Text3D` component requires fonts in JSON format:

1. Download a font from Google Fonts
2. Convert it to JSON format using [Facetype.js](https://gero3.github.io/facetype.js/)
3. Save the JSON file to `/public/fonts/`
4. Reference it in your component: `font="/fonts/inter.json"`

## Utilities

The `src/utils/fonts.ts` file provides helpful utilities for font handling:

```ts
// Load a font for use with manual TextGeometry
import { loadFont } from '@/utils/fonts'

const font = await loadFont('/fonts/inter.json')

// Get the correct path to a font file
import { getFontPath } from '@/utils/fonts'

const fontPath = getFontPath('fonts/inter-regular.ttf')
```

## Best Practices

1. **Minimize Font Loading**: Load only the fonts you need
2. **Preload Fonts**: For critical text, consider preloading fonts
3. **Use Text2D for UI**: For interface elements, use Text2D as it's more performant
4. **Use Text3D Sparingly**: 3D text is more expensive to render, use only when needed
5. **Center Properly**: Use the `centered` prop for Text3D or the `anchorX/Y` props for Text2D
6. **Material Properties**: Pass additional material properties via the `materialProps` prop
7. **Load Notification**: Use the `onLoaded` callback to know when the font is ready

## Component API

### Text2D Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | string | (required) | The text content to display |
| position | [number, number, number] | [0, 0, 0] | Position in 3D space |
| rotation | [number, number, number] | [0, 0, 0] | Rotation in radians |
| color | string | 'white' | Text color |
| fontSize | number | 1 | Size of the text |
| font | string | '/fonts/inter-regular.ttf' | Path to the font file |
| maxWidth | number | 10 | Maximum width before wrapping |
| lineHeight | number | 1 | Line height for multiline text |
| letterSpacing | number | 0 | Spacing between letters |
| textAlign | 'left' \| 'right' \| 'center' \| 'justify' | 'left' | Text alignment |
| anchorX | 'left' \| 'center' \| 'right' | 'center' | Horizontal anchor point |
| anchorY | 'top' \| 'top-baseline' \| 'middle' \| 'bottom-baseline' \| 'bottom' | 'middle' | Vertical anchor point |
| onLoaded | () => void | undefined | Callback when font is loaded |
| materialProps | Record<string, any> | {} | Additional material properties |

### Text3D Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | string | (required) | The text content to display |
| font | string | '/fonts/inter.json' | Path to the JSON font file |
| fontSize | number | 1 | Size of the text |
| height | number | 0.2 | Depth/extrusion of the text |
| color | string | 'white' | Text color |
| position | [number, number, number] | [0, 0, 0] | Position in 3D space |
| rotation | [number, number, number] | [0, 0, 0] | Rotation in radians |
| centered | boolean | true | Whether to center the text |
| bevelEnabled | boolean | false | Enable beveled edges |
| bevelSize | number | 0.04 | Size of the bevel |
| bevelThickness | number | 0.1 | Thickness of the bevel |
| letterSpacing | number | 0 | Spacing between letters |
| lineHeight | number | 0.5 | Line height for multiline text |
| onLoaded | () => void | undefined | Callback when font is loaded |
| materialProps | Record<string, any> | {} | Additional material properties | 