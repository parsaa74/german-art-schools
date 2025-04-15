declare module 'troika-three-text' {
  export interface FontOptions {
    sdfGlyphSize?: number;
    [key: string]: any;
  }
  
  /**
   * FontCache is not actually exported by troika-three-text.
   * This interface is included for reference but should not be directly imported.
   * Instead, access it through the Text class.
   */
  interface FontCache {
    addFont(
      fontFamily: string, 
      fontUrl?: string, 
      callback?: () => void
    ): void;
    
    defaultMaterial?: {
      toneMapped: boolean;
      [key: string]: any;
    };
    
    defaultFontOptions?: FontOptions;
  }
  
  export interface TextProps {
    text?: string;
    anchorX?: string | number;
    anchorY?: string | number;
    font?: string;
    fontSize?: number;
    color?: string;
    outlineWidth?: number;
    outlineColor?: string;
    position?: [number, number, number];
    [key: string]: any;
  }
  
  // Three.js Text class
  export class Text {
    constructor();
    text: string;
    font: string;
    fontSize: number;
    color: string;
    anchorX: string | number;
    anchorY: string | number;
    sdfGlyphSize: number;
    sync(callback?: () => void): void;
    dispose(): void;
    
    /**
     * Default options for all Text instances
     * @internal This is not part of the public API
     */
    static defaultOptions?: {
      sdfGlyphSize?: number;
      [key: string]: any;
    };
    
    /**
     * Internal font registry accessed via (Text as any).fontRegistry
     * @internal This is not part of the public API
     */
    static fontRegistry?: FontCache;
  }
  
  // For JSX support
  export namespace Text {
    export function Text(props: TextProps): JSX.Element;
  }
} 