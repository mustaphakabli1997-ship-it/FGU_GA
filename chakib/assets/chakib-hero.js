import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const root = document.querySelector("[data-ck-hero]");
const canvas = root?.querySelector("canvas");

function init() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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

  // Crown goes opposite the text: left on RTL pages, right on LTR pages.
  const side = getComputedStyle(root).direction === "rtl" ? -1 : 1;
  // Gold crown, built from primitives so no model file is needed.
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.9, roughness: 0.35, emissive: 0x3d2b06 });
  const emblem = new THREE.Group();
  const crown = new THREE.Group();
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.85, 0.5, 48, 1, true), gold);
  band.material.side = THREE.DoubleSide;
  crown.add(band);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 16, 64), gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.25;
  crown.add(rim);
  const points = 5;
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const tall = i % 2 === 0;
    const h = tall ? 1.1 : 0.8;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, h, 24), gold);
    cone.position.set(Math.cos(a) * 0.93, 0.25 + h / 2, Math.sin(a) * 0.93);
    crown.add(cone);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), gold);
    ball.position.set(cone.position.x, 0.25 + h + 0.08, cone.position.z);
    crown.add(ball);
  }
  crown.scale.setScalar(0.28);
  emblem.position.set(side * 1.9, 0.5, 0);
  scene.add(emblem);

  // "Chakib" in extruded gold letters, with the small crown over the "i" like the logo.
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
      crown.position.set(w * 0.3, max.y - min.y + 0.45, 0);
      emblem.add(crown);
    }
  );

  // Charcoal fabric that ripples behind the crown.
  const seg = 80;
  const fabricGeo = new THREE.PlaneGeometry(22, 12, seg, seg);
  const fabric = new THREE.Mesh(
    fabricGeo,
    new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.3, roughness: 0.6, envMapIntensity: 0.25, side: THREE.DoubleSide })
  );
  fabric.position.z = -4;
  scene.add(fabric);
  const base = fabricGeo.attributes.position.array.slice();

  // Gold dust.
  const n = 500;
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

  function resize() {
    const { clientWidth: w, clientHeight: h } = root;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Phones: centre the emblem, since the text sits at the bottom.
    emblem.position.x = w < 750 ? 0 : side * 1.9;
    emblem.scale.setScalar(w < 750 ? 0.36 : 0.62);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(root);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(root);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = reduced ? 0 : clock.getElapsedTime();

    const pos = fabricGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 0.45 + t * 0.6) * 0.5 + Math.cos(y * 0.6 + t * 0.4) * 0.35);
    }
    pos.needsUpdate = true;
    fabricGeo.computeVertexNormals();

    emblem.rotation.y = Math.sin(t * 0.6) * 0.45 + mouse.x * 0.3;
    emblem.rotation.x = mouse.y * 0.1;
    const baseY = innerWidth < 750 ? 1.4 : -0.3;
    emblem.position.y += (Math.sin(t) * 0.1 + baseY - emblem.position.y) * 0.05;
    crown.rotation.y = t * 0.8;
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
