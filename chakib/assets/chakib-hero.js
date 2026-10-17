import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const root = document.querySelector("[data-ck-hero]");
const canvas = root?.querySelector("canvas");

function init() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = matchMedia("(max-width: 749px)").matches;
  const lowEnd = (navigator.hardwareConcurrency || 4) <= 4 || navigator.connection?.saveData;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.4, 9);

  const key = new THREE.DirectionalLight(0xffe2a0, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const front = new THREE.PointLight(0xffe2a0, 60, 30);
  front.position.set(0, 1, 7);
  scene.add(front);

  // The lettering goes opposite the text: left on RTL pages, right on LTR pages.
  const side = getComputedStyle(root).direction === "rtl" ? -1 : 1;
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.9, roughness: 0.35, emissive: 0x3d2b06 });
  const emblem = new THREE.Group();
  emblem.position.set(side * 1.9, 0.5, 0);
  scene.add(emblem);

  // "Chakib" in extruded gold letters.
  new FontLoader().load(
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/droid/droid_serif_bold.typeface.json",
    (font) => {
      const geo = new TextGeometry("Chakib", {
        font, size: 1.1, height: 0.28, curveSegments: 10,
        bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 4,
      });
      geo.computeBoundingBox();
      const { min, max } = geo.boundingBox;
      const w = max.x - min.x;
      geo.translate(-min.x - w / 2, -min.y, -0.14);
      emblem.add(new THREE.Mesh(geo, gold));
    }
  );

  // Charcoal fabric that ripples behind the lettering.
  const seg = phone ? 36 : 80;
  const fabricGeo = new THREE.PlaneGeometry(22, 12, seg, seg);
  const fabric = new THREE.Mesh(
    fabricGeo,
    new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.3, roughness: 0.6, envMapIntensity: 0.25, side: THREE.DoubleSide })
  );
  fabric.position.z = -4;
  scene.add(fabric);
  const base = fabricGeo.attributes.position.array.slice();

  // Gold dust.
  const n = phone ? 180 : 500;
  const dust = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    dust[i * 3] = (Math.random() - 0.5) * 18;
    dust[i * 3 + 1] = (Math.random() - 0.5) * 10;
    dust[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  const particles = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xf0d68a, size: 0.04, transparent: true, opacity: 0.7, depthWrite: false })
  );
  scene.add(particles);

  const mouse = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / innerHeight - 0.5) * 2;
  });

  const hasModel = () => !!root.querySelector(".ck-hero__model");

  function resize() {
    const { clientWidth: w, clientHeight: h } = root;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Phones: centre the emblem, since the text sits at the bottom.
    emblem.position.x = w < 750 ? 0 : side * (hasModel() ? 0.9 : 1.9);
    emblem.scale.setScalar(w < 750 ? 0.36 : 0.62);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(root);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(root);

  const clock = new THREE.Clock();
  let tick = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    tick++;
    const t = reduced ? 0 : clock.getElapsedTime();

    // Ripple the fabric every frame on desktop, every 3rd on phones, never on low-end devices.
    const rippleNow = !lowEnd && (!phone || tick % 3 === 0);
    const pos = fabricGeo.attributes.position;
    if (rippleNow) for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 0.45 + t * 0.6) * 0.5 + Math.cos(y * 0.6 + t * 0.4) * 0.35);
    }
    if (rippleNow) {
      pos.needsUpdate = true;
      fabricGeo.computeVertexNormals();
    }

    emblem.rotation.y = Math.sin(t * 0.6) * 0.45 + mouse.x * 0.3;
    emblem.rotation.x = mouse.y * 0.1;
    const baseY = innerWidth < 750 ? (hasModel() ? 2.1 : 1.4) : -0.3;
    emblem.position.y += (Math.sin(t) * 0.1 + baseY - emblem.position.y) * 0.05;
    particles.rotation.y = t * 0.03;
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  frame();
}

if (root && canvas) {
  try {
    init();
  } catch (err) {
    console.warn("Chakib 3D hero unavailable, showing fallback", err);
    root.classList.add("is-fallback");
  }
}
