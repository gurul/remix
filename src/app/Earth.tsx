"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { TextureLoader } from "three";

// Earth textures — day/night/cloud maps from solarsystemscope.com (CC BY 4.0),
// downscaled from the 8K set used on storeybox.
const TEXTURE_URLS = [
  "/earth/earth-day.jpg",
  "/earth/earth-night.jpg",
  "/earth/earth-clouds.jpg",
];

// Sun sits off to the upper right; lights the day side, leaves the rest to
// city lights along the left limb.
const SUN_DIR = new THREE.Vector3(5, 1.5, 3).normalize();

// Open facing Seattle. For this sphere geometry / equirect map, longitude L
// faces the +Z camera when yaw ≡ -π/2 - L.
const SEATTLE_LON = -122.3;
const START_YAW = -Math.PI / 2 - THREE.MathUtils.degToRad(SEATTLE_LON);
const TILT_X = 0.45;

function EarthScene({ spinRate }: { spinRate: number }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [day, night, clouds] = useLoader(TextureLoader, TEXTURE_URLS);

  useMemo(() => {
    for (const tex of [day, night, clouds]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    }
  }, [day, night, clouds]);

  // City lights only on the night side: mask the emissive map by how far the
  // surface faces away from the sun (view-space, so it tracks the rotation).
  const sunDirView = useMemo(() => ({ value: new THREE.Vector3() }), []);
  const onBeforeCompile = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uSunDirView = sunDirView;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform vec3 uSunDirView;"
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#ifdef USE_EMISSIVEMAP
             vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
             float nightSide = smoothstep( 0.12, -0.22, dot( normalize( vNormal ), uSunDirView ) );
             totalEmissiveRadiance *= emissiveColor.rgb * nightSide;
           #endif`
        );
    },
    [sunDirView]
  );

  // Thin fresnel-glow atmosphere shell, brightest along the sunlit rim.
  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uSunDirView: sunDirView },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize( normalMatrix * normal );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
        fragmentShader: `
          uniform vec3 uSunDirView;
          varying vec3 vNormal;
          void main() {
            float rim = pow( 1.0 - abs( vNormal.z ), 3.0 );
            float lit = 0.25 + 0.75 * smoothstep( -0.4, 0.6, dot( vNormal, uSunDirView ) );
            gl_FragColor = vec4( vec3( 0.35, 0.55, 1.0 ) * rim * lit, rim * lit );
          }
        `,
      }),
    [sunDirView]
  );

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    if (earthRef.current) earthRef.current.rotation.y = START_YAW + t * spinRate;
    if (cloudsRef.current) cloudsRef.current.rotation.y = START_YAW + t * spinRate * 1.3;
    sunDirView.value.copy(SUN_DIR).transformDirection(camera.matrixWorldInverse);
  });

  return (
    <>
      <ambientLight intensity={0.07} />
      <directionalLight position={SUN_DIR.clone().multiplyScalar(60)} intensity={3.4} />

      <group rotation={[TILT_X, 0, -0.2]}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[2, 128, 128]} />
          <meshStandardMaterial
            map={day}
            roughness={0.9}
            metalness={0}
            emissiveMap={night}
            emissive="#ffd9a0"
            emissiveIntensity={1.6}
            onBeforeCompile={onBeforeCompile}
          />
        </mesh>

        <mesh ref={cloudsRef} scale={1.008}>
          <sphereGeometry args={[2, 96, 96]} />
          <meshStandardMaterial
            color="#ffffff"
            alphaMap={clouds}
            transparent
            opacity={0.55}
            depthWrite={false}
            roughness={1}
          />
        </mesh>

        <mesh scale={1.045}>
          <sphereGeometry args={[2, 64, 64]} />
          <primitive object={atmosphereMaterial} attach="material" />
        </mesh>
      </group>
    </>
  );
}

export default function Earth({ spinRate }: { spinRate: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.6], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <EarthScene spinRate={spinRate} />
      </Suspense>
    </Canvas>
  );
}
