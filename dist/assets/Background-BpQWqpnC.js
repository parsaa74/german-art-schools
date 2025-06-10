import{r as t,u,V as v,a as f,j as s}from"./index-BI_8Yxo9.js";const m=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Position the quad to fill the screen, respecting camera perspective
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); 
  }
`,d=`
  uniform float time;
  uniform vec2 resolution;
  uniform float isDarkMode;
  uniform float transition;
  varying vec2 vUv;

  // Noise function (e.g., Simplex or Perlin - using a simple one here for brevity)
  // Source: https://thebookofshaders.com/11/
  float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D Noise based on Morgan McGuire @morgan3d
  // https://www.shadertoy.com/view/4dS3Wd
  float noise (vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      // Smooth Interpolation
      vec2 u = f*f*(3.0-2.0*f);
      // u = smoothstep(0.,1.,f); // Alternative interpolation

      // Mix 4 corners percentages
      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
  }

  // FBM (Fractal Brownian Motion) for more complex patterns
  float fbm (vec2 st) {
      float value = 0.0;
      float amplitude = .5;
      float frequency = 0.;
      // Loop of octaves
      for (int i = 0; i < 5; i++) { // Fewer octaves for performance
          value += amplitude * noise(st);
          st *= 2.;
          amplitude *= .5;
      }
      return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspectCorrectedUv = uv * vec2(resolution.x / resolution.y, 1.0);

    float noisePattern = fbm(aspectCorrectedUv * 2.5 + time * 0.05);
    float slowNoise = fbm(aspectCorrectedUv * 0.8 + time * 0.02);

    // Twilight palette
    vec3 tw1 = vec3(0.02, 0.04, 0.08);
    vec3 tw2 = vec3(0.04, 0.08, 0.16);
    vec3 tw3 = vec3(0.08, 0.12, 0.24);

    // Sunset palette (warmer tones)
    vec3 su1 = vec3(0.05, 0.1, 0.2);
    vec3 su2 = vec3(0.1, 0.2, 0.3);
    vec3 su3 = vec3(0.15, 0.3, 0.4);

    // Combine noise patterns
    float combinedNoise = noisePattern * 0.7 + slowNoise * 0.3;

    // Generate each palette variation
    vec3 twilight = mix(tw1, tw2, smoothstep(0.3, 0.6, combinedNoise));
    twilight = mix(twilight, tw3, smoothstep(0.5, 0.8, slowNoise * 0.5 + noisePattern * 0.5));

    vec3 sunset = mix(su1, su2, smoothstep(0.3, 0.6, combinedNoise));
    sunset = mix(sunset, su3, smoothstep(0.5, 0.8, slowNoise * 0.5 + noisePattern * 0.5));

    // Blend between twilight and sunset based on transition
    vec3 finalColor = mix(twilight, sunset, transition);

    // Add subtle vignette
    float vignette = smoothstep(0.8, 0.3, length(uv - 0.5));
    finalColor *= vignette * 1.2;

    // Dark mode overlay
    vec3 darkBg = vec3(0.005);
    finalColor = mix(finalColor, darkBg, isDarkMode);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;function h({animateTransition:a=!1}){const o=t.useRef(null),{size:e}=u(),r=t.useMemo(()=>({time:{value:0},resolution:{value:new v(e.width*window.devicePixelRatio,e.height*window.devicePixelRatio)},isDarkMode:{value:0},transition:{value:0}}),[e]);t.useEffect(()=>{r.resolution.value.set(e.width*window.devicePixelRatio,e.height*window.devicePixelRatio)},[e,r]);const i=t.useRef(null);return t.useEffect(()=>{a&&(i.current=performance.now()/1e3)},[a]),f(({clock:n})=>{if(o.current&&(o.current.uniforms.time.value=n.getElapsedTime(),i.current!==null)){const c=n.getElapsedTime()-i.current,l=Math.min(c/2,1);o.current.uniforms.transition.value=l,l>=1&&(i.current=null)}}),s.jsxs("mesh",{renderOrder:-1e3,children:[" ",s.jsx("planeGeometry",{args:[2,2]})," ",s.jsx("shaderMaterial",{ref:o,vertexShader:m,fragmentShader:d,uniforms:r,depthWrite:!1,depthTest:!1,transparent:!1,toneMapped:!1})]})}export{h as default};
