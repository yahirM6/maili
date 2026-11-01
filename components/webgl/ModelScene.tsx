//ModelScene.tsx

'use client'

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { getImageProps } from 'next/image'
import { Vector2, type ShaderMaterial, type Texture } from 'three'

// Pasan por el optimizador de Next: el original pesa mucho más de lo que el Hero muestra.
// getImageProps sirve el doble de este ancho; la profundidad se difumina y aguanta menos resolución
const MODEL_TEXTURE = getImageProps({ src: '/images/hero-model.jpg', alt: '', width: 960, height: 1440 }).props.src
const DEPTH_TEXTURE = getImageProps({ src: '/images/hero-depth.png', alt: '', width: 384, height: 576 }).props.src

// Velocidad con la que uMouse alcanza al cursor: más alto, más nervioso
const MOUSE_DAMPING = 5

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform sampler2D uDepthMap;
  uniform vec2 uMouse;
  uniform float uImageAspect;
  uniform float uPlaneAspect;

  varying vec2 vUv;

  const float INTENSITY = 0.04;
  const float DEPTH_BLUR = 0.012;
  const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

  float luminance(vec2 uv) {
    return dot(texture2D(uDepthMap, uv).rgb, LUMA);
  }

  // Suaviza los saltos bruscos de profundidad, que de otro modo estiran la silueta en una línea
  float sampleDepth(vec2 uv) {
    float depth = luminance(uv);
    for (int i = 0; i < 8; i++) {
      float angle = float(i) * 0.7854;
      vec2 direction = vec2(cos(angle), sin(angle));
      depth += luminance(uv + direction * DEPTH_BLUR);
      depth += luminance(uv + direction * DEPTH_BLUR * 2.0);
    }
    return depth / 17.0;
  }

  void main() {
    // Equivale a object-contain + object-bottom: la imagen nunca se deforma
    vec2 scale = uPlaneAspect > uImageAspect
      ? vec2(uPlaneAspect / uImageAspect, 1.0)
      : vec2(1.0, uImageAspect / uPlaneAspect);
    vec2 uv = vUv * scale;
    uv.x -= (scale.x - 1.0) * 0.5;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y > 1.0) discard;

    // El gris medio es el plano de reposo: lo claro sigue al cursor, lo oscuro se aleja
    vec2 offset = uMouse * (sampleDepth(uv) - 0.5) * INTENSITY;

    gl_FragColor = texture2D(uTexture, clamp(uv - offset, 0.0, 1.0));
  }
`

function DepthPlane({ onReady }: { onReady?: () => void }) {
  const materialRef = useRef<ShaderMaterial>(null)
  const targetMouse = useRef(new Vector2())
  const invalidate = useThree((state) => state.invalidate)
  const viewport = useThree((state) => state.viewport)
  const [texture, depthMap] = useTexture([MODEL_TEXTURE, DEPTH_TEXTURE])

  const uniforms = useMemo(() => {
    const { width, height } = texture.image as Texture['image'] & { width: number; height: number }

    return {
      uTexture: { value: texture },
      uDepthMap: { value: depthMap },
      uMouse: { value: new Vector2() },
      uImageAspect: { value: width / height },
      uPlaneAspect: { value: 1 },
    }
  }, [texture, depthMap])

  useEffect(() => {
    onReady?.()
  }, [onReady])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasCursor = window.matchMedia('(pointer: fine)').matches
    if (reducedMotion || !hasCursor) return

    const handleMouseMove = (event: MouseEvent) => {
      // Y invertida: en WebGL el eje vertical crece hacia arriba
      targetMouse.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2,
      )
      invalidate()
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [invalidate])

  useFrame((state, delta) => {
    const material = materialRef.current
    if (!material) return

    material.uniforms.uPlaneAspect.value = state.viewport.aspect

    // Con frameloop="demand" el delta tras un reposo es enorme; se limita para evitar saltos
    const step = 1 - Math.exp(-MOUSE_DAMPING * Math.min(delta, 1 / 30))
    const mouse: Vector2 = material.uniforms.uMouse.value
    mouse.lerp(targetMouse.current, step)

    if (mouse.distanceToSquared(targetMouse.current) > 1e-6) state.invalidate()
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </mesh>
  )
}

// Sin WebGL o sin texturas la escena no se pinta y el Hero conserva su imagen estática
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function ModelScene({ onReady }: { onReady?: () => void }) {
  return (
    <SceneBoundary>
      {/* offsetSize: la escala de GSAP en el scroll no debe contar como un resize del canvas */}
      <Canvas
        aria-hidden
        dpr={[1, 2]}
        frameloop="demand"
        resize={{ offsetSize: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <DepthPlane onReady={onReady} />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  )
}
