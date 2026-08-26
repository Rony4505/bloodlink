import * as THREE from "three";
import {
  BD_OUTLINE,
  getDistrictMapPoints,
  type DistrictPoint,
} from "@/lib/promo/district-positions";
import type { PromoSceneId } from "@/lib/promo/timeline";

const BLOOD = 0x9b1b2e;
const BLOOD_DEEP = 0x6e1220;
const BLOOM = 0xd64550;
const WHITE = 0xf5f5f5;

function outlineToShape(scale = 8, offsetY = 0) {
  const shape = new THREE.Shape();
  BD_OUTLINE.forEach(([nx, ny], i) => {
    const x = (nx - 0.52) * scale;
    const y = (0.5 - ny) * scale * 0.72 + offsetY;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function mapPointToWorld(p: DistrictPoint, scale = 8) {
  return new THREE.Vector3(
    (p.x - 0.52) * scale,
    (0.5 - p.y) * scale * 0.72,
    0.08,
  );
}

export class PromoSceneRenderer {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private disposed = false;

  private hospitalGroup = new THREE.Group();
  private mapGroup = new THREE.Group();
  private particleGroup = new THREE.Group();
  private bloodDrop?: THREE.Mesh;
  private networkLines: THREE.Line[] = [];
  private districtMeshes: THREE.Mesh[] = [];
  private ambulance?: THREE.Group;
  private silhouette?: THREE.Group;
  private heartMesh?: THREE.Mesh;
  private districtPoints: DistrictPoint[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.districtPoints = getDistrictMapPoints();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x050508, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050508, 0.045);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.camera.position.set(0, 1.2, 7);

    this.buildHospital();
    this.buildMap();
    this.buildBloodDrop();
    this.buildNetwork();
    this.buildAmbulance();
    this.buildSilhouette();
    this.buildHeart();
    this.buildParticles();

    this.scene.add(this.hospitalGroup);
    this.scene.add(this.mapGroup);
    this.scene.add(this.particleGroup);

    const amb = new THREE.AmbientLight(0x334455, 0.35);
    const key = new THREE.DirectionalLight(0xffeedd, 0.85);
    key.position.set(4, 8, 6);
    const rim = new THREE.PointLight(BLOOM, 1.2, 30);
    rim.position.set(-3, 2, 4);
    this.scene.add(amb, key, rim);
  }

  resize(width: number, height: number) {
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private buildHospital() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 40),
      new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.85, metalness: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    this.hospitalGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a32,
      roughness: 0.9,
      metalness: 0.05,
    });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 40), wallMat);
    leftWall.position.set(-6, 2, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = 6;
    this.hospitalGroup.add(leftWall, rightWall);

    for (let i = -8; i <= 8; i += 4) {
      const light = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16),
        new THREE.MeshBasicMaterial({ color: WHITE }),
      );
      light.rotation.x = Math.PI / 2;
      light.position.set(0, 3.6, i * 2);
      this.hospitalGroup.add(light);

      const pl = new THREE.PointLight(0xfff5ee, 0.55, 12);
      pl.position.copy(light.position);
      this.hospitalGroup.add(pl);
    }

    const accent = new THREE.PointLight(BLOOD, 0.35, 18);
    accent.position.set(0, 1.5, -6);
    this.hospitalGroup.add(accent);
  }

  private buildMap() {
    const shape = outlineToShape();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    const mat = new THREE.MeshStandardMaterial({
      color: 0x141820,
      emissive: BLOOD_DEEP,
      emissiveIntensity: 0.08,
      roughness: 0.65,
      metalness: 0.25,
    });
    const mapMesh = new THREE.Mesh(geo, mat);
    mapMesh.rotation.x = -0.15;
    this.mapGroup.add(mapMesh);

    const glow = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({
        color: BLOOM,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
      }),
    );
    glow.position.z = 0.14;
    glow.rotation.x = -0.15;
    this.mapGroup.add(glow);

    const sphereGeo = new THREE.SphereGeometry(0.055, 10, 10);
    this.districtPoints.forEach((dp, i) => {
      const isNeed = i % 3 === 0;
      const mat2 = new THREE.MeshStandardMaterial({
        color: isNeed ? BLOOD : WHITE,
        emissive: isNeed ? BLOOD : WHITE,
        emissiveIntensity: 0.35,
        roughness: 0.4,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(sphereGeo, mat2);
      const pos = mapPointToWorld(dp);
      mesh.position.copy(pos);
      mesh.userData = { isNeed };
      this.districtMeshes.push(mesh);
      this.mapGroup.add(mesh);
    });

    this.mapGroup.visible = false;
    this.mapGroup.position.set(0, -0.3, 0);
  }

  private buildBloodDrop() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.8, 0),
      new THREE.Vector3(0.05, 0.4, 0),
      new THREE.Vector3(0, 0.15, 0),
      new THREE.Vector3(0, -0.05, 0),
    ]);
    const geo = new THREE.LatheGeometry(
      curve.getPoints(20).map((p) => new THREE.Vector2(Math.abs(p.x) + 0.12, p.y)),
      24,
    );
    const mat = new THREE.MeshStandardMaterial({
      color: BLOOD,
      emissive: BLOOM,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.35,
      transparent: true,
      opacity: 0.95,
    });
    this.bloodDrop = new THREE.Mesh(geo, mat);
    this.bloodDrop.visible = false;
    this.bloodDrop.position.set(0, 4.5, 0.5);
    this.mapGroup.add(this.bloodDrop);
  }

  private buildNetwork() {
    const pts = this.districtPoints.map(mapPointToWorld);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (Math.random() > 0.92) continue;
        const dist = pts[i].distanceTo(pts[j]);
        if (dist > 3.2) continue;
        const geo = new THREE.BufferGeometry().setFromPoints([pts[i], pts[j]]);
        const mat = new THREE.LineBasicMaterial({
          color: BLOOM,
          transparent: true,
          opacity: 0,
        });
        const line = new THREE.Line(geo, mat);
        this.networkLines.push(line);
        this.mapGroup.add(line);
      }
    }
  }

  private buildAmbulance() {
    this.ambulance = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 2.4),
      new THREE.MeshStandardMaterial({ color: WHITE, roughness: 0.5, metalness: 0.15 }),
    );
    body.position.y = 0.45;
    this.ambulance.add(body);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.18, 2.42),
      new THREE.MeshStandardMaterial({
        color: BLOOD,
        emissive: BLOOD,
        emissiveIntensity: 0.25,
        roughness: 0.4,
      }),
    );
    stripe.position.y = 0.55;
    this.ambulance.add(stripe);

    const beacon = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.35),
      new THREE.MeshBasicMaterial({ color: BLOOM }),
    );
    beacon.position.set(0, 0.95, 0.6);
    this.ambulance.add(beacon);

    this.ambulance.visible = false;
    this.ambulance.position.set(-5, 0, 8);
    this.hospitalGroup.add(this.ambulance);
  }

  private buildSilhouette() {
    this.silhouette = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a10,
      roughness: 0.95,
      metalness: 0,
    });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 4, 8), bodyMat);
    torso.position.y = 1.05;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), bodyMat);
    head.position.y = 1.95;
    this.silhouette.add(torso, head);
    this.silhouette.position.set(0, 0, -4);
    this.hospitalGroup.add(this.silhouette);
  }

  private buildHeart() {
    const shape = new THREE.Shape();
    shape.moveTo(0.25, 0.25);
    shape.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
    shape.bezierCurveTo(-0.35, 0, -0.35, 0.35, -0.35, 0.35);
    shape.bezierCurveTo(-0.35, 0.55, -0.2, 0.77, 0.25, 0.95);
    shape.bezierCurveTo(0.7, 0.77, 0.85, 0.55, 0.85, 0.35);
    shape.bezierCurveTo(0.85, 0.35, 0.85, 0, 0.5, 0);
    shape.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
    });
    geo.scale(0.9, 0.9, 0.9);
    geo.center();
    const mat = new THREE.MeshStandardMaterial({
      color: BLOOD,
      emissive: BLOOM,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0,
    });
    this.heartMesh = new THREE.Mesh(geo, mat);
    this.heartMesh.visible = false;
    this.heartMesh.position.set(0, 1.5, -2);
    this.hospitalGroup.add(this.heartMesh);
  }

  private buildParticles() {
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: BLOOM,
      size: 0.04,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    this.particleGroup.add(pts);
  }

  update(time: number, sceneId: PromoSceneId, progress: number) {
    if (this.disposed) return;

    const t = time;
    const p = progress;

    this.hospitalGroup.visible = false;
    this.mapGroup.visible = false;
    this.ambulance!.visible = false;
    this.silhouette!.visible = false;
    this.bloodDrop!.visible = false;
    this.heartMesh!.visible = false;

    let camX = 0;
    let camY = 1.2;
    let camZ = 7;
    let lookY = 1.2;
    let lookZ = 0;

    switch (sceneId) {
      case "emergency": {
        this.hospitalGroup.visible = true;
        this.silhouette!.visible = true;
        camZ = 6.2 - p * 1.8;
        camY = 1.35 + Math.sin(t * 1.5) * 0.02;
        lookZ = -4;
        lookY = 1.7;
        break;
      }
      case "problem": {
        this.mapGroup.visible = true;
        this.animateDistricts(t, p, "split");
        this.setNetworkOpacity(0.05);
        camX = Math.sin(t * 0.35) * 1.2;
        camY = 2.2 + Math.sin(t * 0.2) * 0.15;
        camZ = 8.5;
        lookY = 0;
        this.mapGroup.rotation.y = t * 0.12;
        break;
      }
      case "brand": {
        this.mapGroup.visible = true;
        this.bloodDrop!.visible = true;
        this.bloodDrop!.position.y = 4.5 - p * 4.2;
        this.bloodDrop!.rotation.y = t * 0.8;
        if (p > 0.55) {
          const netP = (p - 0.55) / 0.45;
          this.setNetworkOpacity(netP * 0.75);
          this.animateDistricts(t, netP, "connected");
        } else {
          this.setNetworkOpacity(0.02);
        }
        camY = 2.5;
        camZ = 7.5 - p * 0.8;
        this.mapGroup.rotation.y = 0.35 + p * 0.2;
        break;
      }
      case "donor":
      case "find":
      case "request": {
        this.mapGroup.visible = true;
        this.setNetworkOpacity(0.45 + p * 0.35);
        this.animateDistricts(t, p, "connected");
        if (sceneId === "request" && p > 0.35) {
          const pulse = Math.sin((t - 25) * 6) * 0.5 + 0.5;
          this.setNetworkOpacity(0.55 + pulse * 0.4);
        }
        camX = Math.sin(t * 0.25) * 0.6;
        camY = 2.8;
        camZ = 7.2;
        this.mapGroup.rotation.y = 0.5;
        break;
      }
      case "ambulance": {
        this.mapGroup.visible = true;
        this.setNetworkOpacity(0.5);
        this.animateDistricts(t, 1, "connected");
        if (p > 0.45) {
          this.hospitalGroup.visible = true;
          this.ambulance!.visible = true;
          const move = p * 12;
          this.ambulance!.position.set(-5 + move, 0, 6 - move * 0.3);
          this.ambulance!.rotation.y = -0.4;
        }
        camY = 2.4;
        camZ = 8;
        this.mapGroup.rotation.y = 0.2;
        break;
      }
      case "finale": {
        if (p < 0.45) {
          this.hospitalGroup.visible = true;
          this.silhouette!.visible = true;
          camZ = 5.5;
          lookZ = -3;
          lookY = 1.8;
        } else {
          const fp = (p - 0.45) / 0.55;
          if (fp < 0.35) {
            this.heartMesh!.visible = true;
            const mat = this.heartMesh!.material as THREE.MeshStandardMaterial;
            mat.opacity = Math.min(1, fp * 2.5);
            this.heartMesh!.scale.setScalar(0.6 + fp * 0.8);
            this.hospitalGroup.visible = true;
          } else {
            this.mapGroup.visible = true;
            this.setNetworkOpacity(0.65);
            this.animateDistricts(t, 1, "connected");
            camY = 2.6;
            camZ = 7;
            this.mapGroup.rotation.y = t * 0.08;
          }
        }
        break;
      }
    }

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(camX * 0.3, lookY, lookZ);

    this.particleGroup.rotation.y = t * 0.03;
    this.particleGroup.visible =
      sceneId === "problem" || sceneId === "brand" || sceneId === "finale";

    this.renderer.render(this.scene, this.camera);
  }

  private animateDistricts(t: number, progress: number, mode: "split" | "connected") {
    this.districtMeshes.forEach((mesh, i) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isNeed = mesh.userData.isNeed as boolean;
      let intensity = 0.35;
      if (mode === "split") {
        const phase = Math.max(0, progress - i * 0.008);
        intensity = isNeed ? 0.25 + phase * 0.9 : 0.15 + phase * 0.7;
      } else {
        intensity = 0.45 + Math.sin(t * 2 + i * 0.3) * 0.15;
      }
      mat.emissiveIntensity = intensity;
      mesh.scale.setScalar(0.85 + Math.sin(t * 1.5 + i) * 0.08);
    });
  }

  private setNetworkOpacity(opacity: number) {
    this.networkLines.forEach((line, i) => {
      const mat = line.material as THREE.LineBasicMaterial;
      mat.opacity = opacity * (0.6 + (i % 5) * 0.08);
    });
  }

  dispose() {
    this.disposed = true;
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
