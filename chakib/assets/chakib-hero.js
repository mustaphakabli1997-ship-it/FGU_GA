import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const root = document.querySelector("[data-ck-hero]");
const canvas = root?.querySelector("canvas");

// Dress-form mannequin wearing a glossy black quilted puffer jacket (no logos), built from primitives.
function buildMannequin(gold) {
  const g = new THREE.Group();
  const puff = new THREE.MeshStandardMaterial({ color: 0x17181d, metalness: 0.3, roughness: 0.34 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xcfc6b8, metalness: 0, roughness: 0.55 });
  const lerp = (keys, t) => {
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1];
        const [t1, v1] = keys[i];
        return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
      }
    }
    return keys[keys.length - 1][1];
  };
  // Horizontal baffles: round bulge between seams.
  const baffle = (t, bands, amp) => amp * Math.pow(Math.abs(Math.sin(t * bands * Math.PI)), 0.55);

  // Torso: profile radius by height, built bottom to top so the normals face outward.
  const H = 2.3;
  const torsoKeys = [[0, 0.6], [0.3, 0.56], [0.6, 0.7], [0.86, 0.75], [0.95, 0.5], [1, 0.38]];
  const pts = [];
  for (let i = 0; i <= 160; i++) {
    const t = i / 160;
    pts.push(new THREE.Vector2(lerp(torsoKeys, t) + baffle(t, 8, 0.05), t * H));
  }
  const torso = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), puff);
  torso.scale.z = 0.62;
  g.add(torso);
  const hem = new THREE.Mesh(new THREE.CircleGeometry(0.6, 48), puff);
  hem.rotation.x = Math.PI / 2;
  hem.scale.y = 0.62;
  g.add(hem);

  // Sleeves: padded tubes hanging from the shoulders.
  const L = 2;
  const sleeveKeys = [[0, 0.2], [0.5, 0.25], [1, 0.3]];
  const sPts = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    sPts.push(new THREE.Vector2(lerp(sleeveKeys, t) + baffle(t, 6, 0.04), -L + t * L));
  }
  for (const dir of [-1, 1]) {
    const sleeve = new THREE.Mesh(new THREE.LatheGeometry(sPts, 40), puff);
    sleeve.position.set(dir * 0.8, H * 0.9, 0);
    sleeve.rotation.z = dir * 0.16;
    g.add(sleeve);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.31, 32, 20), puff);
    shoulder.position.copy(sleeve.position);
    g.add(shoulder);
  }

  // Neck and an abstract egg-shaped head.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.6, 24), skin);
  neck.position.y = H + 0.1;
  g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 40, 28), skin);
  head.scale.set(0.85, 1.15, 0.9);
  head.position.y = H + 0.75;
  g.add(head);

  // Gold zip down the front.
  const zipPts = [];
  for (let i = 0; i <= 20; i++) {
    const t = 0.02 + (i / 20) * 0.95;
    zipPts.push(new THREE.Vector3(0, t * H, (lerp(torsoKeys, t) + 0.045) * 0.62));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(zipPts), 40, 0.014, 8), gold));

  // Stand.
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.7, 16), gold);
  pole.position.y = -0.85;
  g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.07, 48), gold);
  foot.position.y = -1.7;
  g.add(foot);
  return g;
}

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

  // Mannequin: shown unless a photo is set or the section turns it off.
  const mannequin = buildMannequin(gold);
  mannequin.visible = root.dataset.mannequin !== "false" && !root.querySelector(".ck-hero__model");
  scene.add(mannequin);
  const rim = new THREE.DirectionalLight(0xffd98a, 2.5);
  rim.position.set(-4, 3, -3);
  scene.add(rim);

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
  const rise = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    dust[i * 3] = (Math.random() - 0.5) * 18;
    dust[i * 3 + 1] = (Math.random() - 0.5) * 10;
    dust[i * 3 + 2] = (Math.random() - 0.5) * 8;
    rise[i] = 0.15 + Math.random() * 0.45;
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
    const small = w < 750;
    const withMannequin = mannequin.visible;
    emblem.position.x = small ? 0 : side * (withMannequin ? 0.9 : hasModel() ? 0.9 : 1.9);
    emblem.scale.setScalar(small ? 0.36 : 0.62);
    mannequin.position.x = small ? 0 : side * 3.5;
    mannequin.scale.setScalar(small ? 0.33 : 0.7);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(root);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(root);

  const clock = new THREE.Clock();
  let tick = 0;
  let lastT = 0;
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
    const small = innerWidth < 750;
    const baseY = small ? (hasModel() || mannequin.visible ? 2.55 : 1.4) : mannequin.visible ? 0.9 : -0.3;
    emblem.position.y += (Math.sin(t) * 0.1 + baseY - emblem.position.y) * 0.05;
    emblem.position.z = mannequin.visible ? -1.5 : 0;
    mannequin.rotation.y = Math.sin(t * 0.5) * 0.6 + mouse.x * 0.3;
    mannequin.position.y = small ? 0.5 : -0.5;

    // Gold dust drifts upward and wraps around.
    if (!reduced) {
      const dt = Math.min(t - lastT, 0.1);
      for (let i = 0; i < n; i++) {
        let y = dust[i * 3 + 1] + rise[i] * dt;
        if (y > 5) y = -5;
        dust[i * 3 + 1] = y;
        dust[i * 3] += Math.sin(t * 0.7 + i) * 0.0015;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }
    lastT = t;
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
