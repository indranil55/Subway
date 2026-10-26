import * as THREE from 'three';

/**
 * Procedural 3D Models for Subway Surfers
 * Enforces composite 3–12 part THREE.Group hierarchy,
 * physical PBR materials with varied roughness/metalness,
 * and zero external asset dependencies.
 */

// Procedural Canvas Textures
export function createStripeTexture(color1: string, color2: string, angle: number = 45): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = color2;
  ctx.save();
  ctx.translate(128, 128);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-128, -128);

  const stripeWidth = 24;
  for (let x = -256; x < 512; x += stripeWidth * 2) {
    ctx.fillRect(x, -256, stripeWidth, 768);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGraffitiTexture(text: string, bgColor: string, textColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 256);

  // Spray paint noise
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Graffiti text
  ctx.font = 'bold 72px "Titan One", "Impact", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow / outline
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 14;
  ctx.strokeText(text, 256, 128);

  ctx.fillStyle = textColor;
  ctx.fillText(text, 256, 128);

  // Paint drip
  ctx.fillStyle = textColor;
  for (let d = 0; d < 5; d++) {
    const dx = 120 + d * 70 + Math.random() * 20;
    const dy = 160;
    const len = 30 + Math.random() * 45;
    ctx.beginPath();
    ctx.arc(dx, dy + len, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(dx - 3, dy, 6, len);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// --- Player Character (Jake the Surfer) ---
export interface PlayerMeshGroup extends THREE.Group {
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Group;
  hoverboard: THREE.Group;
  hoverboardDeck?: THREE.Mesh;
  hoverboardRim?: THREE.Mesh;
  hoverboardThrusters?: THREE.Mesh[];
  jetpack: THREE.Group;
  sneakersL: THREE.Mesh;
  sneakersR: THREE.Mesh;
  wingL: THREE.Mesh;
  wingR: THREE.Mesh;
}

export function createPlayerMesh(): PlayerMeshGroup {
  const group = new THREE.Group() as PlayerMeshGroup;

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffd1ba, roughness: 0.5 }); // Warm healthy human skin
  const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 }); // Vibrant cobalt blue hoodie
  const vestMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }); // Cherry red street vest
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 }); // Dark indigo denim
  const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 }); // Golden amber snapback cap
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x5c2e0b, roughness: 0.8 }); // Chestnut brown hair
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 }); // White skate leather
  const shoeTrimMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }); // Red sneaker accents
  const headphoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.15 });

  // 1. Human Contoured Torso & Street Clothing
  // Athletic upper chest tapering to waist
  const torsoGeom = new THREE.CylinderGeometry(0.36, 0.28, 0.78, 16);
  torsoGeom.scale(1.15, 1.0, 0.75); // Flatter oval ribcage
  const torso = new THREE.Mesh(torsoGeom, hoodieMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  group.add(torso);

  // Layered Red Street Vest over hoodie
  const vestGeom = new THREE.CylinderGeometry(0.38, 0.3, 0.7, 16);
  vestGeom.scale(1.18, 1.0, 0.78);
  const vest = new THREE.Mesh(vestGeom, vestMat);
  vest.position.y = 0.02;
  vest.castShadow = true;
  torso.add(vest);

  // Rolled hoodie hood resting around neck
  const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 10, 18, Math.PI * 1.5), hoodieMat);
  hoodCollar.rotation.x = Math.PI / 2;
  hoodCollar.position.set(0, 0.36, -0.06);
  torso.add(hoodCollar);

  // Hoodie drawstrings hanging down with golden aglets
  for (const sx of [-0.09, 0.09]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cord.position.set(sx, 0.16, 0.26);
    const aglet = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 6), goldMat);
    aglet.position.y = -0.14;
    cord.add(aglet);
    torso.add(cord);
  }

  // Denim waistband & gold belt buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
  belt.scale.set(1.16, 1.0, 0.76);
  belt.position.y = -0.36;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), goldMat);
  buckle.position.set(0, -0.36, 0.23);
  torso.add(belt, buckle);

  // 2. Realistic Human Head & Expressive Face
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.58, 0);

  // Contoured human skull
  const headGeom = new THREE.SphereGeometry(0.25, 18, 16);
  headGeom.scale(0.92, 1.06, 0.96);
  const head = new THREE.Mesh(headGeom, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Defined human nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 8), skinMat);
  nose.position.set(0, 0.01, 0.26);
  nose.rotation.x = 0.2;
  headGroup.add(nose);

  // Expressive Human Eyes (Left & Right)
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.2 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.085, 0.06, 0.22);

    // Sclera (White of eye)
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), eyeWhiteMat);
    sclera.scale.set(1.0, 0.9, 0.6);
    eyeGroup.add(sclera);

    // Iris (Warm brown)
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), irisMat);
    iris.position.set(0, 0, 0.042);
    eyeGroup.add(iris);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.014, 10), pupilMat);
    pupil.position.set(0, 0, 0.043);
    eyeGroup.add(pupil);

    // Specular glint dot (spark in the eye!)
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.006, 6), glintMat);
    glint.position.set(side * 0.008, 0.008, 0.044);
    eyeGroup.add(glint);

    // Eyebrow
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.016, 0.02), hairMat);
    brow.position.set(side * 0.085, 0.13, 0.23);
    brow.rotation.z = -side * 0.15;
    headGroup.add(brow);

    headGroup.add(eyeGroup);

    // Ears on sides
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    ear.scale.set(0.4, 0.9, 0.6);
    ear.position.set(side * 0.23, 0.02, 0.02);
    headGroup.add(ear);
  }

  // Friendly boyish smile
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.01, 6, 12, Math.PI * 0.8),
    new THREE.MeshBasicMaterial({ color: 0x991b1b })
  );
  smile.rotation.x = Math.PI / 2;
  smile.position.set(0, -0.09, 0.23);
  headGroup.add(smile);

  // Styled brown hair tufts coming from beneath cap
  const hairBangs = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 4), hairMat);
  hairBangs.rotation.set(-0.6, 0, -0.4);
  hairBangs.position.set(-0.08, 0.18, 0.21);
  headGroup.add(hairBangs);

  // Backwards Snapback Cap (Contoured rounded dome & curved visor)
  const capDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    capMat
  );
  capDome.position.set(0, 0.06, 0);
  headGroup.add(capDome);

  // Cap button on top
  const capBtn = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), goldMat);
  capBtn.position.set(0, 0.32, 0);
  headGroup.add(capBtn);

  // Curved visor pointing backwards
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.28), capMat);
  visor.position.set(0, 0.12, -0.28);
  visor.rotation.x = -0.2;
  headGroup.add(visor);

  // High-Fidelity DJ Headphones Resting Around Neck
  const hpBand = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 10, 20, Math.PI * 1.6), headphoneMat);
  hpBand.rotation.x = Math.PI / 2;
  hpBand.position.set(0, -0.16, -0.02);
  headGroup.add(hpBand);

  // Chrome Earcups with soft leather cushions
  for (const side of [-1, 1]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), headphoneMat);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(side * 0.25, -0.16, 0.04);

    const pad = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 8, 16), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
    pad.rotation.y = Math.PI / 2;
    cup.add(pad);
    headGroup.add(cup);
  }

  torso.add(headGroup);

  // 3. Anatomical Human Arms & Running Fists (Left & Right)
  // Left Arm
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.44, 0.34, 0);

  // Deltoid shoulder muscle
  const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), hoodieMat);
  lShoulder.position.set(0, -0.04, 0);
  leftArm.add(lShoulder);

  // Bicep / Upper Arm
  const lBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.38, 12), hoodieMat);
  lBicep.position.set(0, -0.22, 0);
  lBicep.castShadow = true;
  leftArm.add(lBicep);

  // Forearm & Elbow Joint
  const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.34, 12), hoodieMat);
  lForearm.position.set(0, -0.52, 0.06);
  lForearm.rotation.x = 0.35; // Natural sprint flex
  lForearm.castShadow = true;
  leftArm.add(lForearm);

  // Sculpted human hand (clenched running fist)
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), skinMat);
  lHand.scale.set(0.85, 1.1, 0.9);
  lHand.position.set(0, -0.72, 0.14);
  leftArm.add(lHand);
  torso.add(leftArm);

  // Right Arm
  const rightArm = new THREE.Group();
  rightArm.position.set(0.44, 0.34, 0);

  const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), hoodieMat);
  rShoulder.position.set(0, -0.04, 0);
  rightArm.add(rShoulder);

  const rBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.38, 12), hoodieMat);
  rBicep.position.set(0, -0.22, 0);
  rBicep.castShadow = true;
  rightArm.add(rBicep);

  const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.34, 12), hoodieMat);
  rForearm.position.set(0, -0.52, 0.06);
  rForearm.rotation.x = 0.35;
  rForearm.castShadow = true;
  rightArm.add(rForearm);

  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), skinMat);
  rHand.scale.set(0.85, 1.1, 0.9);
  rHand.position.set(0, -0.72, 0.14);
  rightArm.add(rHand);
  torso.add(rightArm);

  // 4. Anatomical Legs & Sculpted High-Top Skate Sneakers
  // Helper to build a high-top sneaker
  const buildSneaker = () => {
    const shoeGroup = new THREE.Group();

    // Sculpted white rubber cupsole with black accent foxing stripe
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.54), shoeMat);
    sole.position.set(0, 0, 0.06);
    sole.castShadow = true;
    shoeGroup.add(sole);

    const foxing = new THREE.Mesh(new THREE.BoxGeometry(0.285, 0.02, 0.545), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    foxing.position.set(0, 0.01, 0.06);
    shoeGroup.add(foxing);

    // Leather sneaker body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.44), shoeMat);
    body.position.set(0, 0.12, 0.02);
    body.castShadow = true;
    shoeGroup.add(body);

    // Red canvas heel counter & side swoosh
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.265, 0.12, 0.26), shoeTrimMat);
    trim.position.set(0, 0.14, -0.08);
    shoeGroup.add(trim);

    // Rounded white toe cap
    const toeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12), shoeMat);
    toeCap.rotation.z = Math.PI / 2;
    toeCap.position.set(0, 0.08, 0.24);
    shoeGroup.add(toeCap);

    // Sneaker tongue & laces
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.14), shoeTrimMat);
    tongue.position.set(0, 0.2, 0.08);
    tongue.rotation.x = -0.3;
    shoeGroup.add(tongue);

    return shoeGroup;
  };

  // Left Leg
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.95, 0);

  // Muscular Thigh
  const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.46, 14), pantsMat);
  lThigh.position.y = -0.23;
  lThigh.castShadow = true;
  leftLeg.add(lThigh);

  // Knee joint with jeans creases
  const lKnee = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), pantsMat);
  lKnee.position.set(0, -0.46, 0.02);
  leftLeg.add(lKnee);

  // Calf / Lower Leg
  const lCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.44, 12), pantsMat);
  lCalf.position.y = -0.68;
  lCalf.castShadow = true;
  leftLeg.add(lCalf);

  // Sneakers Left
  const sneakersLGroup = buildSneaker();
  sneakersLGroup.position.set(0, -0.92, 0.04);
  leftLeg.add(sneakersLGroup);

  // Wing on sneaker for Super Sneakers powerup
  const wingL = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.35, 4),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2, emissive: 0xca8a04, emissiveIntensity: 0.6 })
  );
  wingL.rotation.z = Math.PI / 2;
  wingL.position.set(-0.22, 0.12, 0);
  wingL.visible = false;
  sneakersLGroup.add(wingL);
  group.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0.95, 0);

  const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.46, 14), pantsMat);
  rThigh.position.y = -0.23;
  rThigh.castShadow = true;
  rightLeg.add(rThigh);

  const rKnee = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), pantsMat);
  rKnee.position.set(0, -0.46, 0.02);
  rightLeg.add(rKnee);

  const rCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.44, 12), pantsMat);
  rCalf.position.y = -0.68;
  rCalf.castShadow = true;
  rightLeg.add(rCalf);

  const sneakersRGroup = buildSneaker();
  sneakersRGroup.position.set(0, -0.92, 0.04);
  rightLeg.add(sneakersRGroup);

  const wingR = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.35, 4),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2, emissive: 0xca8a04, emissiveIntensity: 0.6 })
  );
  wingR.rotation.z = -Math.PI / 2;
  wingR.position.set(0.22, 0.12, 0);
  wingR.visible = false;
  sneakersRGroup.add(wingR);
  group.add(rightLeg);

  // 5. Sleek Aerodynamic Hoverboard
  const hoverboard = new THREE.Group();
  hoverboard.position.set(0, 0.08, 0);
  hoverboard.visible = false;

  const deckMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.25, metalness: 0.6 });
  const deckGeom = new THREE.BoxGeometry(0.76, 0.07, 1.8);
  const deck = new THREE.Mesh(deckGeom, deckMat);
  hoverboard.add(deck);

  // Glowing neon cyan perimeter rail
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.2 });
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 1.86), rimMat);
  hoverboard.add(rim);

  // Twin plasma thruster rings
  const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.5 });
  const thrusterMeshes: THREE.Mesh[] = [];
  for (const tz of [-0.55, 0.55]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), thrusterMat);
    ring.position.set(0, -0.04, tz);
    hoverboard.add(ring);
    thrusterMeshes.push(ring);
  }
  group.add(hoverboard);

  // 6. Chrome Twin Rocket Jetpack
  const jetpack = new THREE.Group();
  jetpack.position.set(0, 0.05, -0.32);
  jetpack.visible = false;

  const jpBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.95, roughness: 0.15 });
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xf97316, emissiveIntensity: 1.2 });

  for (const jx of [-0.2, 0.2]) {
    const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.62, 16), jpBodyMat);
    canister.position.x = jx;
    jetpack.add(canister);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), jpBodyMat);
    cap.position.set(jx, 0.31, 0);
    jetpack.add(cap);

    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 16), nozzleMat);
    nozzle.rotation.x = Math.PI;
    nozzle.position.set(jx, -0.38, 0);
    jetpack.add(nozzle);
  }
  torso.add(jetpack);

  // Assign interface references
  group.leftLeg = leftLeg;
  group.rightLeg = rightLeg;
  group.leftArm = leftArm;
  group.rightArm = rightArm;
  group.torso = torso;
  group.head = headGroup;
  group.hoverboard = hoverboard;
  group.hoverboardDeck = deck;
  group.hoverboardRim = rim;
  group.hoverboardThrusters = thrusterMeshes;
  group.jetpack = jetpack;
  group.sneakersL = sneakersLGroup as unknown as THREE.Mesh;
  group.sneakersR = sneakersRGroup as unknown as THREE.Mesh;
  group.wingL = wingL;
  group.wingR = wingR;

  return group;
}

// --- High-Fidelity Police Inspector & Bulldog ---
export interface ChaserGroup extends THREE.Group {
  inspector: THREE.Group;
  dog: THREE.Group;
  inspectorArms: THREE.Group;
  dogLegs: THREE.Group[];
}

export function createChaserMesh(): ChaserGroup {
  const group = new THREE.Group() as ChaserGroup;

  // Materials
  const uniformNavy = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.45 }); // Police navy
  const goldTrim = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.15 });
  const silverTrim = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
  const faceMat = new THREE.MeshStandardMaterial({ color: 0xffd6be, roughness: 0.55 });
  const greyHairMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
  const patentLeather = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.15 });

  // 1. Police Inspector Human Body
  const inspector = new THREE.Group();

  // Portly officer torso with tailored uniform coat
  const bodyGeom = new THREE.CylinderGeometry(0.44, 0.52, 0.98, 18);
  bodyGeom.scale(1.15, 1.0, 0.85);
  const body = new THREE.Mesh(bodyGeom, uniformNavy);
  body.position.y = 1.35;
  body.castShadow = true;
  inspector.add(body);

  // White shirt collar and red tie
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  collar.position.set(0, 0.46, 0.43);
  body.add(collar);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.03), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
  tie.position.set(0, 0.3, 0.45);
  body.add(tie);

  // Double-breasted brass police buttons
  for (const bx of [-0.1, 0.1]) {
    for (const by of [0.15, 0.0, -0.15]) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), goldTrim);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(bx, by, 0.46);
      body.add(btn);
    }
  }

  // Gold Star Police Badge on chest pocket
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 6), goldTrim);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(-0.22, 0.26, 0.46);
  body.add(badge);

  // Black duty belt with gold buckle & radio holster
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.1, 18), patentLeather);
  belt.scale.set(1.15, 1.0, 0.85);
  belt.position.y = -0.42;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), goldTrim);
  buckle.position.set(0, -0.42, 0.45);
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.08), patentLeather);
  radio.position.set(0.38, -0.42, 0.2);
  body.add(belt, buckle, radio);

  // 2. Realistic Expressive Human Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.68, 0);

  const headGeom = new THREE.SphereGeometry(0.26, 18, 16);
  headGeom.scale(0.96, 1.08, 0.98);
  const head = new THREE.Mesh(headGeom, faceMat);
  head.castShadow = true;
  headGroup.add(head);

  // Bulbous nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), faceMat);
  nose.position.set(0, 0.02, 0.28);
  headGroup.add(nose);

  // Prominent bushy grey handlebar moustache
  const stacheL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.015, 0.18, 8), greyHairMat);
  stacheL.rotation.z = Math.PI / 2.8;
  stacheL.position.set(-0.1, -0.06, 0.27);

  const stacheR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.015, 0.18, 8), greyHairMat);
  stacheR.rotation.z = -Math.PI / 2.8;
  stacheR.position.set(0.1, -0.06, 0.27);
  headGroup.add(stacheL, stacheR);

  // Eyes & furrowed angry chase eyebrows
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    eye.position.set(side * 0.09, 0.08, 0.23);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    pupil.position.set(side * 0.09, 0.08, 0.265);
    headGroup.add(eye, pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.03), greyHairMat);
    brow.position.set(side * 0.09, 0.14, 0.25);
    brow.rotation.z = side * 0.25; // Angry furrowed brow
    headGroup.add(brow);
  }

  // Authentic Police Peaked Visor Cap
  const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.22, 18), uniformNavy);
  capCrown.position.y = 0.24;
  headGroup.add(capCrown);

  // Gold braided officer chin strap
  const goldBraid = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.02, 6, 18, Math.PI), goldTrim);
  goldBraid.rotation.x = Math.PI / 2;
  goldBraid.position.set(0, 0.16, 0.04);
  headGroup.add(goldBraid);

  // Shiny patent leather black visor
  const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.26), patentLeather);
  capVisor.position.set(0, 0.16, 0.26);
  capVisor.rotation.x = 0.15;
  headGroup.add(capVisor);

  // Silver Police Badge on cap front
  const capBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6), silverTrim);
  capBadge.rotation.x = Math.PI / 2;
  capBadge.position.set(0, 0.26, 0.35);
  headGroup.add(capBadge);

  body.add(headGroup);

  // 3. Human Arms & Turned-Wood Police Nightstick
  const arms = new THREE.Group();

  // Left arm
  const lArmGroup = new THREE.Group();
  lArmGroup.position.set(-0.56, 0.3, 0);
  const lShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), uniformNavy);
  const lSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.58, 12), uniformNavy);
  lSleeve.position.y = -0.26;
  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), faceMat);
  lHand.position.y = -0.58;
  lArmGroup.add(lShoulder, lSleeve, lHand);
  arms.add(lArmGroup);

  // Right arm (holding police baton)
  const rArmGroup = new THREE.Group();
  rArmGroup.position.set(0.56, 0.3, 0);
  const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), uniformNavy);
  const rSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.58, 12), uniformNavy);
  rSleeve.position.y = -0.26;
  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), faceMat);
  rHand.position.y = -0.58;

  // Realistic turned police nightstick with grooved handle
  const nightstick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.8, 12),
    new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3, metalness: 0.3 })
  );
  nightstick.position.set(0, -0.6, 0.28);
  nightstick.rotation.x = 0.8;
  rArmGroup.add(rShoulder, rSleeve, rHand, nightstick);
  arms.add(rArmGroup);

  body.add(arms);

  // 4. Police Legs & Patrol Boots
  for (const lx of [-0.24, 0.24]) {
    const legG = new THREE.Group();
    legG.position.set(lx, 0.85, 0);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.78, 12), uniformNavy);
    leg.position.y = -0.38;
    leg.castShadow = true;
    legG.add(leg);

    // Shiny black police boot
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.46), patentLeather);
    boot.position.set(0, -0.78, 0.08);
    boot.castShadow = true;
    legG.add(boot);

    inspector.add(legG);
  }

  group.add(inspector);

  // 5. Stylized Bulldog (Cute, muscular, spirited companion)
  const dog = new THREE.Group();
  dog.position.set(0.85, 0, 0.35);

  const dogFurMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.8 }); // Golden brown bulldog
  const dogWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.7 }); // White chest patch

  // Barrel-chested muscular body
  const dogBellyGeom = new THREE.SphereGeometry(0.36, 14, 14);
  dogBellyGeom.scale(1.0, 0.9, 1.4);
  const dogBelly = new THREE.Mesh(dogBellyGeom, dogFurMat);
  dogBelly.position.y = 0.42;
  dog.add(dogBelly);

  // White chest patch
  const patch = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), dogWhiteMat);
  patch.scale.set(0.8, 0.9, 1.2);
  patch.position.set(0, 0.36, 0.15);
  dog.add(patch);

  // Bulldog Head with cute jowls
  const dogHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), dogFurMat);
  dogHead.position.set(0, 0.24, 0.38);
  dogBelly.add(dogHead);

  // Wrinkled snout & black wet nose
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.18), dogWhiteMat);
  snout.position.set(0, -0.06, 0.22);
  dogHead.add(snout);

  const dogNose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
  dogNose.position.set(0, 0.02, 0.1);
  snout.add(dogNose);

  // Cute floppy brown ears
  for (const es of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.1), dogFurMat);
    ear.position.set(es * 0.24, 0.14, 0);
    ear.rotation.z = -es * 0.4;
    dogHead.add(ear);
  }

  // Red studded leather collar with gold bone dog tag
  const dogCollar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
  dogCollar.rotation.x = Math.PI / 2;
  dogCollar.position.set(0, 0.1, 0.22);
  dogBelly.add(dogCollar);

  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, 8), goldTrim);
  tag.rotation.x = Math.PI / 2;
  tag.position.set(0, -0.02, 0.44);
  dogBelly.add(tag);

  // Cute wagging tail
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.2, 8), dogFurMat);
  tail.position.set(0, 0.2, -0.46);
  tail.rotation.x = -0.7;
  dogBelly.add(tail);

  // 4 Trot Paws
  const dogLegs: THREE.Group[] = [];
  [
    [-0.18, 0.24],
    [0.18, 0.24],
    [-0.18, -0.24],
    [0.18, -0.24],
  ].forEach(([x, z]) => {
    const legG = new THREE.Group();
    legG.position.set(x, 0.24, z);

    const lMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.28, 8), dogFurMat);
    lMesh.position.y = -0.06;
    legG.add(lMesh);

    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), dogWhiteMat);
    paw.scale.set(0.9, 0.6, 1.2);
    paw.position.set(0, -0.18, 0.04);
    legG.add(paw);

    dog.add(legG);
    dogLegs.push(legG);
  });

  group.add(dog);

  group.inspector = inspector;
  group.dog = dog;
  group.inspectorArms = arms;
  group.dogLegs = dogLegs;

  return group;
}

// --- Subway Train (10-12 Part Composite Model) ---
export interface SubwayTrainOptions {
  color?: number;
  hasRamp?: boolean;
  isMoving?: boolean;
  tagText?: string;
}

export function createSubwayTrain(options: SubwayTrainOptions = {}): THREE.Group {
  const {
    color = 0x1d4ed8, // Iconic vibrant Blue train or Red
    hasRamp = false,
    tagText = 'SUBWAY',
  } = options;

  const trainGroup = new THREE.Group();

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.35,
    metalness: 0.6,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Galvanized metal roof
    roughness: 0.6,
    metalness: 0.5,
  });

  const windowMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    transmission: 0.8,
    transparent: true,
    opacity: 0.85,
    ior: 1.5,
  });

  const grillMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
    metalness: 0.9,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 1.5,
    roughness: 0.1,
  });

  const trainLength = 22;
  const trainWidth = 2.7;
  const trainHeight = 3.6;

  // 1. Train Main Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(trainWidth, trainHeight - 0.5, trainLength),
    bodyMat
  );
  body.position.y = trainHeight / 2 + 0.3;
  body.castShadow = true;
  body.receiveShadow = true;
  trainGroup.add(body);

  // 2. Corrugated Metal Roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(trainWidth - 0.1, 0.4, trainLength),
    roofMat
  );
  roof.position.y = trainHeight + 0.15;
  roof.receiveShadow = true;
  trainGroup.add(roof);

  // AC Units on roof
  for (let z = -6; z <= 6; z += 5) {
    const acUnit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 2.2), roofMat);
    acUnit.position.set(0, trainHeight + 0.45, z);
    trainGroup.add(acUnit);
  }

  // 3. Front Cab & Windshield (Front facing -Z towards oncoming player)
  const cabAngle = new THREE.Mesh(
    new THREE.BoxGeometry(trainWidth - 0.1, 1.4, 0.6),
    bodyMat
  );
  cabAngle.position.set(0, trainHeight - 0.9, -trainLength / 2 - 0.2);
  trainGroup.add(cabAngle);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(trainWidth - 0.4, 1.1, 0.1),
    windowMat
  );
  windshield.position.set(0, trainHeight - 0.8, -trainLength / 2 - 0.51);
  trainGroup.add(windshield);

  // 4. Front Cowcatcher & Grill
  const cowcatcher = new THREE.Mesh(
    new THREE.BoxGeometry(trainWidth + 0.2, 0.6, 0.8),
    grillMat
  );
  cowcatcher.position.set(0, 0.45, -trainLength / 2 - 0.3);
  trainGroup.add(cowcatcher);

  // 5. Glowing Headlights
  const hlL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16), headlightMat);
  hlL.rotation.x = Math.PI / 2;
  hlL.position.set(-0.9, 1.2, -trainLength / 2 - 0.52);
  trainGroup.add(hlL);

  const hlR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16), headlightMat);
  hlR.rotation.x = Math.PI / 2;
  hlR.position.set(0.9, 1.2, -trainLength / 2 - 0.52);
  trainGroup.add(hlR);

  // 6. Side Windows
  const windowGeom = new THREE.BoxGeometry(0.08, 0.9, 1.4);
  for (let side = -1; side <= 1; side += 2) {
    for (let wz = -8; wz <= 8; wz += 2.8) {
      const win = new THREE.Mesh(windowGeom, windowMat);
      win.position.set(side * (trainWidth / 2 + 0.02), trainHeight - 1.2, wz);
      trainGroup.add(win);
    }
  }

  // 7. Graffiti Mural Plaque on Side
  const grafTexture = createGraffitiTexture(tagText, '#e2e8f0', '#ef4444');
  const grafMat = new THREE.MeshBasicMaterial({ map: grafTexture });
  const grafMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.8), grafMat);
  grafMesh.position.set(trainWidth / 2 + 0.06, trainHeight - 1.4, 0);
  grafMesh.rotation.y = Math.PI / 2;
  trainGroup.add(grafMesh);

  // 8. Climbable Front Ramp (for ramp-trains, allows player to skate onto roof!)
  if (hasRamp) {
    const rampGroup = new THREE.Group();
    rampGroup.position.set(0, 0, -trainLength / 2 - 2.8);

    const rampLength = 5.8;
    const rampGeom = new THREE.BoxGeometry(trainWidth - 0.2, 0.25, rampLength);
    const rampMat = new THREE.MeshStandardMaterial({
      map: createStripeTexture('#f59e0b', '#0f172a', 90),
      roughness: 0.5,
    });
    const rampMesh = new THREE.Mesh(rampGeom, rampMat);
    // Slope up from ground to train roof
    rampMesh.rotation.x = Math.atan2(trainHeight, rampLength);
    rampMesh.position.set(0, trainHeight / 2, rampLength / 2);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    rampGroup.add(rampMesh);

    trainGroup.add(rampGroup);
  }

  // Store metadata
  trainGroup.userData = {
    isTrain: true,
    hasRamp,
    bounds: {
      width: trainWidth,
      height: trainHeight + 0.4,
      length: trainLength + (hasRamp ? 6 : 1),
    },
  };

  return trainGroup;
}

// --- Indian Railway Freight Cargo Train with Shipping Containers ---
export function createCargoTrain(options: SubwayTrainOptions = {}): THREE.Group {
  const { hasRamp = false } = options;
  const group = new THREE.Group();

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8,
    metalness: 0.8,
  });

  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.95,
    roughness: 0.2,
  });

  const ladderMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.35,
    metalness: 0.5,
  });

  const trainLength = 22;
  const trainWidth = 2.7;
  const trainHeight = 3.6;

  // 1. Heavy Steel Flatbed Chassis
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(trainWidth, 0.45, trainLength),
    chassisMat
  );
  chassis.position.y = 0.55;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // 2. Heavy Steel Bogies & Flanged Wheels
  for (const bz of [-7.5, -4.5, 4.5, 7.5]) {
    for (const sx of [-trainWidth / 2 + 0.15, trainWidth / 2 - 0.15]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.16, 16), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx, 0.35, bz);
      group.add(wheel);
    }
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, trainWidth - 0.2, 8), wheelMat);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, 0.35, bz);
    group.add(axle);
  }

  // 3. Shipping Container 1 (Front: Emerald Green CONCOR Container)
  const c1Mat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.65,
    metalness: 0.35,
  });
  const c1 = new THREE.Mesh(
    new THREE.BoxGeometry(trainWidth - 0.1, 3.1, 9.6),
    c1Mat
  );
  c1.position.set(0, 0.75 + 1.55, -5.2);
  c1.castShadow = true;
  c1.receiveShadow = true;
  group.add(c1);

  // Container 1 Corrugation ribs
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.7 });
  for (let rz = -9.4; rz <= -1.0; rz += 0.8) {
    const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.0, 0.25), ribMat);
    ribL.position.set(-trainWidth / 2 + 0.02, 2.3, rz);
    const ribR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.0, 0.25), ribMat);
    ribR.position.set(trainWidth / 2 - 0.02, 2.3, rz);
    group.add(ribL, ribR);
  }

  // 4. Shipping Container 2 (Rear: Vibrant Crimson Red Cargo Container)
  const c2Mat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.65,
    metalness: 0.35,
  });
  const c2 = new THREE.Mesh(
    new THREE.BoxGeometry(trainWidth - 0.1, 3.1, 9.6),
    c2Mat
  );
  c2.position.set(0, 0.75 + 1.55, 5.2);
  c2.castShadow = true;
  c2.receiveShadow = true;
  group.add(c2);

  // Container 2 Corrugation ribs
  const rib2Mat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.7 });
  for (let rz = 1.0; rz <= 9.4; rz += 0.8) {
    const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.0, 0.25), rib2Mat);
    ribL.position.set(-trainWidth / 2 + 0.02, 2.3, rz);
    const ribR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.0, 0.25), rib2Mat);
    ribR.position.set(trainWidth / 2 - 0.02, 2.3, rz);
    group.add(ribL, ribR);
  }

  // 5. Metal Catwalk on roof (Anti-slip walk path for rooftop runner)
  const catwalkMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.7 });
  const catwalk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, trainLength - 1.2), catwalkMat);
  catwalk.position.set(0, trainHeight + 0.25, 0);
  catwalk.receiveShadow = true;
  group.add(catwalk);

  // 6. Yellow Access Ladder on Front Container Face
  const ladderGroup = new THREE.Group();
  ladderGroup.position.set(0, 0, -trainLength / 2 - 0.05);
  for (const lx of [-0.35, 0.35]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.0, 8), ladderMat);
    pole.position.set(lx, 2.2, 0);
    ladderGroup.add(pole);
  }
  for (let ly = 1.0; ly <= 3.4; ly += 0.4) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), ladderMat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, ly, 0);
    ladderGroup.add(rung);
  }
  group.add(ladderGroup);

  // 7. Climbing Ramp (if specified)
  if (hasRamp) {
    const rampGroup = new THREE.Group();
    rampGroup.position.set(0, 0, -trainLength / 2 - 2.8);
    const rampLength = 5.8;
    const rampGeom = new THREE.BoxGeometry(trainWidth - 0.2, 0.25, rampLength);
    const rampMat = new THREE.MeshStandardMaterial({
      map: createStripeTexture('#f59e0b', '#0f172a', 90),
      roughness: 0.5,
    });
    const rampMesh = new THREE.Mesh(rampGeom, rampMat);
    rampMesh.rotation.x = Math.atan2(trainHeight, rampLength);
    rampMesh.position.set(0, trainHeight / 2, rampLength / 2);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    rampGroup.add(rampMesh);
    group.add(rampGroup);
  }

  // 8. Headlights and Cowcatcher at front
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 1.5,
  });
  const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), headlightMat);
  hl.rotation.x = Math.PI / 2;
  hl.position.set(0, 1.2, -trainLength / 2 - 0.2);
  group.add(hl);

  group.userData = {
    isTrain: true,
    hasRamp,
    bounds: {
      width: trainWidth,
      height: trainHeight + 0.4,
      length: trainLength + (hasRamp ? 6 : 1),
    },
  };

  return group;
}

// --- Obstacle 1: Low Hazard Hurdle (Jump Over) ---
export function createLowHurdle(): THREE.Group {
  const hurdle = new THREE.Group();

  const barrierMat = new THREE.MeshStandardMaterial({
    map: createStripeTexture('#eab308', '#0f172a', 45),
    roughness: 0.4,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.8,
    roughness: 0.3,
  });

  // Crossbar (Height: 0.85m - player jump clears it easily)
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.12), barrierMat);
  bar.position.y = 0.7;
  bar.castShadow = true;
  hurdle.add(bar);

  // Left & right support feet
  for (const x of [-1.05, 1.05]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.85, 8), metalMat);
    post.position.set(x, 0.425, 0);
    post.castShadow = true;
    hurdle.add(post);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.8), metalMat);
    foot.position.set(x, 0.04, 0);
    hurdle.add(foot);
  }

  hurdle.userData = {
    type: 'LOW_HURDLE',
    height: 0.9,
    width: 2.4,
    canJumpOver: true,
    canSlideUnder: false,
  };

  return hurdle;
}

// --- Obstacle 2: High Overhead Gate (Slide / Roll Under) ---
export function createHighBarrier(): THREE.Group {
  const gate = new THREE.Group();

  const stripeMat = new THREE.MeshStandardMaterial({
    map: createStripeTexture('#ef4444', '#f8fafc', 45),
    roughness: 0.4,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.7,
    roughness: 0.3,
  });
  const warningLightMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.2,
  });

  // Posts on sides (tall, 3.2m)
  for (const x of [-1.2, 1.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), frameMat);
    post.position.set(x, 1.6, 0);
    post.castShadow = true;
    gate.add(post);
  }

  // Top header truss
  const topTruss = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 0.2), frameMat);
  topTruss.position.set(0, 3.1, 0);
  gate.add(topTruss);

  // The Warning Board hangs at Y = 2.0 down to Y = 1.3
  // Ground clearance below is 1.3m -> Running player (1.8m) hits it, crouching/rolling player (0.8m) glides right under!
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 0.15), stripeMat);
  board.position.set(0, 2.0, 0);
  board.castShadow = true;
  gate.add(board);

  // Warning flashing lights on board
  for (const lx of [-0.9, 0.9]) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), warningLightMat);
    light.position.set(lx, 2.3, 0.12);
    gate.add(light);
  }

  gate.userData = {
    type: 'HIGH_BARRIER',
    height: 2.8,
    clearance: 1.35, // Clear height underneath
    width: 2.4,
    canJumpOver: false, // Too high to jump normally unless super sneakers
    canSlideUnder: true,
  };

  return gate;
}

// --- Obstacle 3: Track Buffer Stop / Concrete Blockade (Switch Lane) ---
export function createBufferStop(): THREE.Group {
  const stop = new THREE.Group();

  const rustMetal = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.5 });
  const redBumper = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });

  // Solid concrete base
  const concreteBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.6, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
  );
  concreteBase.position.y = 0.3;
  concreteBase.castShadow = true;
  concreteBase.receiveShadow = true;
  stop.add(concreteBase);

  // Angled steel frame
  const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), rustMetal);
  frameL.position.set(-0.8, 1.0, 0);
  frameL.rotation.x = -0.2;
  const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), rustMetal);
  frameR.position.set(0.8, 1.0, 0);
  frameR.rotation.x = -0.2;
  stop.add(frameL, frameR);

  // Twin red circular impact bumpers
  for (const bx of [-0.65, 0.65]) {
    const bumper = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), redBumper);
    bumper.rotation.x = Math.PI / 2;
    bumper.position.set(bx, 1.1, -0.2);
    bumper.castShadow = true;
    stop.add(bumper);
  }

  stop.userData = {
    type: 'BUFFER_STOP',
    height: 1.8,
    width: 2.5,
    canJumpOver: false,
    canSlideUnder: false,
  };

  return stop;
}

// --- Collectible: Golden Coin ---
export function createCoinMesh(): THREE.Mesh {
  const coinGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 16);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0xeab308,
    emissiveIntensity: 0.35,
  });
  const coin = new THREE.Mesh(coinGeom, coinMat);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  return coin;
}

// --- Collectible: Power-Up Item Box / Icon ---
export type PowerUpType = 'MAGNET' | 'SUPER_SNEAKERS' | 'MULTIPLIER' | 'JETPACK' | 'HOVERBOARD';

export function createPowerUpMesh(type: PowerUpType): THREE.Group {
  const group = new THREE.Group();

  // Floating bubble/shield around powerup
  const bubble = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 16, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
      ior: 1.4,
    })
  );
  group.add(bubble);

  if (type === 'MAGNET') {
    // Horseshoe Magnet
    const uMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7, roughness: 0.3 });
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });

    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI), uMat);
    arch.rotation.z = Math.PI;
    group.add(arch);

    const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.16), tipMat);
    tipL.position.set(-0.3, -0.15, 0);
    const tipR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.16), tipMat);
    tipR.position.set(0.3, -0.15, 0);
    group.add(tipL, tipR);
  } else if (type === 'SUPER_SNEAKERS') {
    // Golden sneaker with wing
    const sMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 }); // Emerald
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.5), sMat);
    group.add(shoe);

    const wing = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.4, 4),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.6 })
    );
    wing.rotation.z = Math.PI / 2;
    wing.position.set(-0.25, 0.1, 0);
    group.add(wing);
  } else if (type === 'MULTIPLIER') {
    // 2X Token
    const star = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.6 })
    );
    star.rotation.x = Math.PI / 2;
    group.add(star);
  } else if (type === 'JETPACK') {
    // Twin rocket
    const jMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.8, roughness: 0.2 });
    const flameMat = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xfde047, emissiveIntensity: 1.2 });
    const rL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12), jMat);
    rL.position.x = -0.18;
    const rR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12), jMat);
    rR.position.x = 0.18;
    const fL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 8), flameMat);
    fL.rotation.x = Math.PI;
    fL.position.set(-0.18, -0.35, 0);
    group.add(rL, rR, fL);
  } else if (type === 'HOVERBOARD') {
    // Mini hoverboard pickup
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.08, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.6 })
    );
    group.add(board);
  }

  group.userData = { powerUpType: type };
  return group;
}

// --- Letter Pickups (S-U-R-F) for Daily Word Hunt ---
export function createLetterMesh(char: string): THREE.Group {
  const group = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 80px "Titan One", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 64, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), mat);
  group.add(mesh);

  group.userData = { letter: char };
  return group;
}

// --- Masagram Junction Station Models ---

export function createMasagramStationSignboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  // Classic Indian Railways Yellow Board
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 1024, 360);

  // Black border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, 1006, 342);

  // Inner decorative border
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 984, 320);

  // English main name: MASAGRAM JN.
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 84px "Titan One", "Impact", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MASAGRAM JN.', 512, 130);

  // English secondary subtext: MASAGRAM JUNCTION RAILWAY STATION
  ctx.font = '700 48px "Fredoka", "Impact", sans-serif';
  ctx.fillText('MASAGRAM JUNCTION RAILWAY STATION', 512, 235);

  // Station code & elevation badge
  ctx.font = '700 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('STN CODE: BWN-MSAE', 40, 310);

  ctx.textAlign = 'right';
  ctx.fillText('ELEVATION: 24M', 984, 310);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMasagramStationSignboard(): THREE.Group {
  const group = new THREE.Group();

  const boardMat = new THREE.MeshStandardMaterial({
    map: createMasagramStationSignboardTexture(),
    roughness: 0.3,
    metalness: 0.1,
  });

  const postMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.8,
    roughness: 0.3,
  });

  // The Signboard
  const board = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.3, 0.2), boardMat);
  board.position.y = 3.4;
  board.castShadow = true;
  group.add(board);

  // Twin support steel I-beams
  for (const px of [-2.4, 2.4]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 0.2), postMat);
    post.position.set(px, 2.25, 0);
    post.castShadow = true;
    group.add(post);

    // Concrete base footer
    const footer = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }));
    footer.position.set(px, 0.3, 0);
    group.add(footer);
  }

  // Hooded spotlight lamps on top of board
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 1.5,
  });
  for (const lx of [-1.8, 0, 1.8]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), postMat);
    arm.rotation.x = Math.PI / 4;
    arm.position.set(lx, 4.7, 0.25);
    group.add(arm);

    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.2, 8), lampMat);
    shade.rotation.x = Math.PI;
    shade.position.set(lx, 4.4, 0.5);
    group.add(shade);
  }

  return group;
}

export function createStationPlatform(side: 'LEFT' | 'RIGHT', length: number = 70): THREE.Group {
  const group = new THREE.Group();

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
  const yellowEdgeMat = new THREE.MeshStandardMaterial({
    map: createStripeTexture('#facc15', '#0f172a', 90),
    roughness: 0.5,
  });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.5 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });

  const posX = side === 'LEFT' ? 7.2 : -7.2;

  // Platform raised deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, length), concreteMat);
  deck.position.set(posX, 0.5, 0);
  deck.receiveShadow = true;
  group.add(deck);

  // Safety tactile yellow edge strip (facing track)
  const edgeX = side === 'LEFT' ? posX - 1.6 : posX + 1.6;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, length), yellowEdgeMat);
  edge.position.set(edgeX, 1.02, 0);
  group.add(edge);

  // Platform Canopy Roof with steel posts
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.15, length), canopyMat);
  roof.position.set(posX, 5.2, 0);
  roof.castShadow = true;
  group.add(roof);

  // Steel canopy columns every 12m
  for (let z = -length / 2 + 5; z <= length / 2 - 5; z += 12) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.2, 8), steelMat);
    col.position.set(posX, 3.1, z);
    col.castShadow = true;
    group.add(col);

    // Warm station lantern
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffedd5, emissive: 0xfef08a, emissiveIntensity: 1.5 })
    );
    lantern.position.set(posX, 4.8, z);
    group.add(lantern);
  }

  return group;
}

export function createMasagramStationArch(): THREE.Group {
  const arch = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.8, roughness: 0.3 });

  // Columns across tracks
  const colL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.5, 0.6), steelMat);
  colL.position.set(7.5, 4.75, 0);
  arch.add(colL);

  const colR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.5, 0.6), steelMat);
  colR.position.set(-7.5, 4.75, 0);
  arch.add(colR);

  // Cross bridge gantry
  const beam = new THREE.Mesh(new THREE.BoxGeometry(16.0, 1.4, 1.2), steelMat);
  beam.position.set(0, 8.8, 0);
  arch.add(beam);

  // Masagram Junction Glowing Station Banner
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 200;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 200);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, 1012, 188);

  ctx.fillStyle = '#facc15';
  ctx.font = '900 68px "Titan One", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ MASAGRAM JUNCTION ★', 512, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 42px "Fredoka", sans-serif';
  ctx.fillText('EASTERN DIVISION • MAIN PLATFORM 1', 512, 140);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(13.5, 2.6),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.2,
      emissive: 0x1e293b,
      emissiveIntensity: 0.4,
    })
  );
  signMesh.position.set(0, 8.8, -0.65);
  arch.add(signMesh);

  return arch;
}

// --- Fluffy Cartoon Cloud for Sunny Blue Sky ---
export function createFluffyCloudMesh(): THREE.Group {
  const cloud = new THREE.Group();

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.05,
    emissive: 0xffffff,
    emissiveIntensity: 0.15,
  });

  // Assemble 5 soft overlapping cloud spheres
  const spheres = [
    { r: 2.2, x: 0, y: 0, z: 0 },
    { r: 1.8, x: -1.8, y: -0.3, z: 0.2 },
    { r: 1.7, x: 1.7, y: -0.3, z: -0.2 },
    { r: 1.4, x: -0.8, y: 0.9, z: 0.1 },
    { r: 1.5, x: 0.9, y: 0.8, z: 0 },
  ];

  spheres.forEach(({ r, x, y, z }) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), cloudMat);
    s.position.set(x, y, z);
    cloud.add(s);
  });

  return cloud;
}

// --- Sunny Palm Tree for Vibrant Street Atmosphere ---
export function createSunnyPalmTree(): THREE.Group {
  const tree = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 }); // Fresh tropical green

  // Slender curved trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 7.5, 8), trunkMat);
  trunk.position.y = 3.75;
  trunk.rotation.z = -0.08;
  trunk.castShadow = true;
  tree.add(trunk);

  // 6 arching palm fronds
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const leafGroup = new THREE.Group();
    leafGroup.position.set(0, 7.4, 0);
    leafGroup.rotation.y = angle;

    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.8, 4), leafMat);
    frond.rotation.x = Math.PI / 3;
    frond.position.set(0, -0.4, 1.2);
    leafGroup.add(frond);
    tree.add(leafGroup);
  }

  return tree;
}

// --- Flying Birds in Sunny Sky (ছোট পাখি আকাশে উড়বে) ---
export interface FlyingBirdGroup extends THREE.Group {
  wingL: THREE.Mesh;
  wingR: THREE.Mesh;
  speed: number;
  baseY: number;
}

export function createFlyingBirdMesh(): FlyingBirdGroup {
  const bird = new THREE.Group() as FlyingBirdGroup;

  const featherMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Blue-grey plumage
    roughness: 0.6,
  });
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });

  // Streamlined bird body
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), featherMat);
  body.rotation.x = -Math.PI / 2;
  bird.add(body);

  // Tiny beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0, 0.28);
  bird.add(beak);

  // Left wing
  const wingGeom = new THREE.BoxGeometry(0.48, 0.02, 0.18);
  const wingL = new THREE.Mesh(wingGeom, featherMat);
  wingL.position.set(-0.26, 0.02, 0.05);
  bird.add(wingL);

  // Right wing
  const wingR = new THREE.Mesh(wingGeom, featherMat);
  wingR.position.set(0.26, 0.02, 0.05);
  bird.add(wingR);

  bird.wingL = wingL;
  bird.wingR = wingR;
  bird.speed = 8 + Math.random() * 5;
  bird.baseY = 16 + Math.random() * 8;

  return bird;
}

// --- Lush Green Field Trees (মাঠ ও গাছপালা) ---
export function createLushOakTree(): THREE.Group {
  const tree = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2e0b, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.7 }); // Deep meadow green
  const lightLeafMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 });

  // Sturdy trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.38, 4.2, 8), woodMat);
  trunk.position.y = 2.1;
  trunk.castShadow = true;
  tree.add(trunk);

  // Rounded layered foliage clusters
  const clusters = [
    { r: 1.6, x: 0, y: 4.8, z: 0, mat: leafMat },
    { r: 1.3, x: -0.7, y: 4.3, z: 0.4, mat: lightLeafMat },
    { r: 1.3, x: 0.7, y: 4.3, z: -0.4, mat: leafMat },
    { r: 1.1, x: 0, y: 5.8, z: 0, mat: lightLeafMat },
  ];

  clusters.forEach(({ r, x, y, z, mat }) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 8), mat);
    f.position.set(x, y, z);
    f.castShadow = true;
    tree.add(f);
  });

  return tree;
}
