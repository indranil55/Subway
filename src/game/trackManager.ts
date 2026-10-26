import * as THREE from 'three';
import {
  createSubwayTrain,
  createCargoTrain,
  createLowHurdle,
  createHighBarrier,
  createBufferStop,
  createCoinMesh,
  createPowerUpMesh,
  createLetterMesh,
  createStripeTexture,
  createMasagramStationSignboard,
  createStationPlatform,
  createMasagramStationArch,
  createFluffyCloudMesh,
  createSunnyPalmTree,
  createLushOakTree,
  PowerUpType,
} from './proceduralModels';

export const LANE_WIDTH = 3.2;
// In Three.js with camera looking towards +Z:
// Screen-left is +X (+3.2), Center is 0, Screen-right is -X (-3.2)
export const LANES = [LANE_WIDTH, 0, -LANE_WIDTH]; // Lane 0: Screen Left, 1: Center, 2: Screen Right
export const CHUNK_LENGTH = 64; // Length of each track section

export interface ObstacleInstance {
  mesh: THREE.Group;
  lane: number;
  z: number;
  type: 'TRAIN' | 'LOW_HURDLE' | 'HIGH_BARRIER' | 'BUFFER_STOP';
  hasRamp?: boolean;
  isMoving?: boolean;
  speed?: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

export interface CoinInstance {
  mesh: THREE.Mesh;
  lane: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  isSkyCoin?: boolean;
}

export interface PowerUpInstance {
  mesh: THREE.Group;
  type: PowerUpType;
  lane: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface LetterInstance {
  mesh: THREE.Group;
  char: string;
  lane: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export class TrackChunk {
  public group: THREE.Group;
  public startZ: number;
  public endZ: number;
  public obstacles: ObstacleInstance[] = [];
  public coins: CoinInstance[] = [];
  public powerUps: PowerUpInstance[] = [];
  public letters: LetterInstance[] = [];

  constructor(startZ: number) {
    this.startZ = startZ;
    this.endZ = startZ + CHUNK_LENGTH;
    this.group = new THREE.Group();
    this.buildBaseTrack();
  }

  private buildBaseTrack() {
    // 1. Gravel / Ballast Bed (Dark crushed stone underneath rails)
    const ballastMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.95,
      metalness: 0.1,
    });
    const ballast = new THREE.Mesh(
      new THREE.BoxGeometry(16.5, 0.4, CHUNK_LENGTH),
      ballastMat
    );
    ballast.position.set(0, -0.2, this.startZ + CHUNK_LENGTH / 2);
    ballast.receiveShadow = true;
    this.group.add(ballast);

    // 2. Concrete Track Divider / Curb Edges
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
    const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, CHUNK_LENGTH), curbMat);
    curbL.position.set(-8.4, 0.05, this.startZ + CHUNK_LENGTH / 2);
    curbL.receiveShadow = true;
    const curbR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, CHUNK_LENGTH), curbMat);
    curbR.position.set(8.4, 0.05, this.startZ + CHUNK_LENGTH / 2);
    curbR.receiveShadow = true;
    this.group.add(curbL, curbR);

    // 3. Wide Natural Green Countryside Meadows & Agricultural Fields (মাঠ জমি)
    const meadowGrassMat = new THREE.MeshStandardMaterial({
      color: (this.startZ / CHUNK_LENGTH) % 2 === 0 ? 0x558b2f : 0x4d7c0f,
      roughness: 0.92,
      metalness: 0.05,
    });

    // Left broad green meadow field
    const fieldL = new THREE.Mesh(new THREE.BoxGeometry(60, 0.35, CHUNK_LENGTH), meadowGrassMat);
    fieldL.position.set(-38.5, -0.18, this.startZ + CHUNK_LENGTH / 2);
    fieldL.receiveShadow = true;
    this.group.add(fieldL);

    // Right broad green meadow field
    const fieldR = new THREE.Mesh(new THREE.BoxGeometry(60, 0.35, CHUNK_LENGTH), meadowGrassMat);
    fieldR.position.set(38.5, -0.18, this.startZ + CHUNK_LENGTH / 2);
    fieldR.receiveShadow = true;
    this.group.add(fieldR);

    // Farmland crop patch (Golden wheat / Mustard field / Fertile soil patch)
    const cropMat = new THREE.MeshStandardMaterial({
      color: (this.startZ / CHUNK_LENGTH) % 3 === 0 ? 0xca8a04 : (this.startZ / CHUNK_LENGTH) % 3 === 1 ? 0x15803d : 0x78350f,
      roughness: 0.95,
    });
    const cropPatchL = new THREE.Mesh(new THREE.BoxGeometry(22, 0.38, 28), cropMat);
    cropPatchL.position.set(-28, -0.16, this.startZ + 20);
    cropPatchL.receiveShadow = true;
    this.group.add(cropPatchL);

    const cropPatchR = new THREE.Mesh(new THREE.BoxGeometry(22, 0.38, 28), cropMat);
    cropPatchR.position.set(28, -0.16, this.startZ + 44);
    cropPatchR.receiveShadow = true;
    this.group.add(cropPatchR);

    // 4. Low Rustic Countryside Railway Fence along track boundaries (allowing open view of nature)
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85 }); // Warm rustic wood
    const fenceRailGeom = new THREE.BoxGeometry(0.12, 0.1, CHUNK_LENGTH);

    // Left and Right top and middle fence rails
    for (const side of [-8.8, 8.8]) {
      const railTop = new THREE.Mesh(fenceRailGeom, fenceMat);
      railTop.position.set(side, 0.95, this.startZ + CHUNK_LENGTH / 2);
      const railMid = new THREE.Mesh(fenceRailGeom, fenceMat);
      railMid.position.set(side, 0.5, this.startZ + CHUNK_LENGTH / 2);
      this.group.add(railTop, railMid);

      // Fence vertical posts every 5 meters
      const postGeom = new THREE.BoxGeometry(0.16, 1.25, 0.16);
      for (let pz = this.startZ + 2; pz < this.endZ; pz += 5.5) {
        const post = new THREE.Mesh(postGeom, fenceMat);
        post.position.set(side, 0.6, pz);
        post.castShadow = true;
        this.group.add(post);
      }
    }

    // 5. Lush Green Trees & Shady Foliage in the Meadows (গাছ পালা)
    // Left side trees
    const oakL = createLushOakTree();
    oakL.position.set(-13.5, 0, this.startZ + 18);
    this.group.add(oakL);

    const palmL = createSunnyPalmTree();
    palmL.position.set(-14.8, 0, this.startZ + 46);
    this.group.add(palmL);

    // Right side trees
    const palmR = createSunnyPalmTree();
    palmR.position.set(13.8, 0, this.startZ + 14);
    this.group.add(palmR);

    const oakR = createLushOakTree();
    oakR.position.set(14.5, 0, this.startZ + 42);
    this.group.add(oakR);

    // Background trees deeper in the open fields
    const bgTreeL = createLushOakTree();
    bgTreeL.scale.set(1.2, 1.2, 1.2);
    bgTreeL.position.set(-26.0, 0, this.startZ + 36);
    this.group.add(bgTreeL);

    const bgTreeR = createLushOakTree();
    bgTreeR.scale.set(1.2, 1.2, 1.2);
    bgTreeR.position.set(28.0, 0, this.startZ + 24);
    this.group.add(bgTreeR);

    // 6. Drifting Fluffy Cartoon Clouds in the Sunny Blue Sky
    const cloud1 = createFluffyCloudMesh();
    cloud1.position.set(-18 + (this.startZ % 7), 26 + (this.startZ % 5), this.startZ + 18);
    this.group.add(cloud1);

    const cloud2 = createFluffyCloudMesh();
    cloud2.position.set(18 - (this.startZ % 9), 29 + (this.startZ % 4), this.startZ + 46);
    this.group.add(cloud2);

    // 7. Rails & Wooden Sleepers (Ties)
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 }); // Dark wood
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });

    // Wooden ties across tracks
    const tieGeom = new THREE.BoxGeometry(12.5, 0.12, 0.4);
    for (let z = this.startZ + 1; z < this.endZ; z += 1.8) {
      const tie = new THREE.Mesh(tieGeom, tieMat);
      tie.position.set(0, 0.04, z);
      tie.receiveShadow = true;
      this.group.add(tie);
    }

    // Steel rails for each of the 3 lanes
    const railGeom = new THREE.BoxGeometry(0.08, 0.16, CHUNK_LENGTH);
    LANES.forEach((lx) => {
      // Pair of rails per lane
      const rail1 = new THREE.Mesh(railGeom, railMat);
      rail1.position.set(lx - 0.75, 0.12, this.startZ + CHUNK_LENGTH / 2);
      const rail2 = new THREE.Mesh(railGeom, railMat);
      rail2.position.set(lx + 0.75, 0.12, this.startZ + CHUNK_LENGTH / 2);
      this.group.add(rail1, rail2);
    });

    // 8. Continuous High-Voltage Overhead Catenary Wires (Over each of the 3 tracks)
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const wireGeom = new THREE.CylinderGeometry(0.015, 0.015, CHUNK_LENGTH, 4);
    LANES.forEach((lx) => {
      const contactWire = new THREE.Mesh(wireGeom, wireMat);
      contactWire.rotation.x = Math.PI / 2;
      contactWire.position.set(lx, 7.3, this.startZ + CHUNK_LENGTH / 2);
      this.group.add(contactWire);

      const catenaryCarrierWire = new THREE.Mesh(wireGeom, wireMat);
      catenaryCarrierWire.rotation.x = Math.PI / 2;
      catenaryCarrierWire.position.set(lx, 7.8, this.startZ + CHUNK_LENGTH / 2);
      this.group.add(catenaryCarrierWire);
    });

    // 9. Trackside Indian Railway Milestone Marker Stone
    const kmNum = Math.floor(Math.abs(this.startZ) / 10) + 12;
    const milestoneGroup = new THREE.Group();
    milestoneGroup.position.set(-8.9, 0, this.startZ + 24);
    const msBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.9, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    msBase.position.y = 0.45;
    const msTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.8 })
    );
    msTop.rotation.z = Math.PI / 2;
    msTop.position.set(0, 0.9, 0);
    milestoneGroup.add(msBase, msTop);
    this.group.add(milestoneGroup);

    // 10. Trackside Electrical Junction & Relay Control Box
    const relayBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.4, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
    );
    relayBox.position.set(9.2, 0.7, this.startZ + 38);
    relayBox.castShadow = true;
    this.group.add(relayBox);

    // 11. Overhead Catenary Gantries (Overhead wire bridges)
    const gantry = this.buildGantry(this.startZ + CHUNK_LENGTH / 2);
    this.group.add(gantry);
  }

  private buildGantry(z: number): THREE.Group {
    const gantry = new THREE.Group();
    gantry.position.set(0, 0, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

    // Pillars
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 8, 8), metalMat);
    p1.position.set(-8.2, 4, 0);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 8, 8), metalMat);
    p2.position.set(8.2, 4, 0);
    gantry.add(p1, p2);

    // Cross truss
    const beam = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.35, 0.35), metalMat);
    beam.position.set(0, 7.5, 0);
    gantry.add(beam);

    // Railway signal lights (Green/Red)
    LANES.forEach((lx) => {
      const signalBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.3), metalMat);
      signalBox.position.set(lx, 6.8, 0);

      const lampMat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.4 ? 0x22c55e : 0xef4444,
        emissive: Math.random() > 0.4 ? 0x22c55e : 0xef4444,
        emissiveIntensity: 1.5,
      });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), lampMat);
      lamp.position.set(0, 0, -0.16);
      signalBox.add(lamp);

      gantry.add(signalBox);
    });

    return gantry;
  }
}

export class TrackManager {
  private scene: THREE.Scene;
  public chunks: TrackChunk[] = [];
  private nextStartZ: number = 0;
  private chunkCount: number = 0;
  private lettersAvailable: string[] = ['S', 'U', 'R', 'F'];
  private currentLetterIndex: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initTracks();
  }

  private initTracks() {
    this.nextStartZ = -16; // Begins inside Masagram Junction Station
    this.chunkCount = 0;
    this.currentLetterIndex = 0;

    // Chunk 0: Masagram Junction Railway Station Platform & Signboard
    this.spawnStationChunk();
    // Chunk 1: Safe runway emerging out of station
    this.spawnChunk(true);
    // Subsequent chunks: Full dynamic gameplay & oncoming traffic
    this.spawnChunk(false);
    this.spawnChunk(false);
    this.spawnChunk(false);
  }

  public update(playerZ: number, delta: number): void {
    // 1. Advance moving trains
    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (obs.isMoving && obs.speed) {
          // Train moves toward player (in negative Z direction)
          obs.z -= obs.speed * delta;
          obs.mesh.position.z = obs.z;
          obs.bounds.minZ = obs.z - 11;
          obs.bounds.maxZ = obs.z + 11;
        }
      }
    }

    // 2. Recycle chunks that have passed behind player
    const recycleThreshold = playerZ - 40;
    while (this.chunks.length > 0 && this.chunks[0].endZ < recycleThreshold) {
      const oldChunk = this.chunks.shift()!;
      this.scene.remove(oldChunk.group);
      this.spawnChunk(false);
    }
  }

  public getObstaclesNear(playerZ: number): ObstacleInstance[] {
    const list: ObstacleInstance[] = [];
    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (Math.abs(obs.z - playerZ) < 55) {
          list.push(obs);
        }
      }
    }
    return list;
  }

  public getCoinsNear(playerZ: number): CoinInstance[] {
    const list: CoinInstance[] = [];
    for (const chunk of this.chunks) {
      for (const coin of chunk.coins) {
        if (!coin.collected && Math.abs(coin.z - playerZ) < 45) {
          list.push(coin);
        }
      }
    }
    return list;
  }

  public getPowerUpsNear(playerZ: number): PowerUpInstance[] {
    const list: PowerUpInstance[] = [];
    for (const chunk of this.chunks) {
      for (const p of chunk.powerUps) {
        if (!p.collected && Math.abs(p.z - playerZ) < 45) {
          list.push(p);
        }
      }
    }
    return list;
  }

  public getLettersNear(playerZ: number): LetterInstance[] {
    const list: LetterInstance[] = [];
    for (const chunk of this.chunks) {
      for (const l of chunk.letters) {
        if (!l.collected && Math.abs(l.z - playerZ) < 45) {
          list.push(l);
        }
      }
    }
    return list;
  }

  private spawnStationChunk() {
    const chunk = new TrackChunk(this.nextStartZ);
    this.nextStartZ += CHUNK_LENGTH;
    this.chunkCount++;

    // 1. Left & Right elevated station platforms with canopies & warm lanterns
    const platL = createStationPlatform('LEFT', CHUNK_LENGTH);
    platL.position.set(0, 0, chunk.startZ + CHUNK_LENGTH / 2);
    chunk.group.add(platL);

    const platR = createStationPlatform('RIGHT', CHUNK_LENGTH);
    platR.position.set(0, 0, chunk.startZ + CHUNK_LENGTH / 2);
    chunk.group.add(platR);

    // 2. Iconic Yellow Masagram Junction Station Board (MASAGRAM JN. / মশাগ্রাম জংশন)
    const stationBoard = createMasagramStationSignboard();
    stationBoard.position.set(LANES[2] - 2.8, 0, chunk.startZ + 18);
    chunk.group.add(stationBoard);

    // 3. Overhead Station Bridge Arch with glowing MASAGRAM JUNCTION banner
    const stationArch = createMasagramStationArch();
    stationArch.position.set(0, 0, chunk.startZ + 36);
    chunk.group.add(stationArch);

    // 4. Parked Subway Train on the Left Track with "MASAGRAM" graffiti tag
    this.addTrain(chunk, 0, chunk.startZ + 24, {
      hasRamp: true,
      color: 0x1d4ed8,
      tagText: 'MASAGRAM',
    });

    // 5. Line of Welcome Gold Coins down the center track
    this.addCoinLine(chunk, 1, 0.8, chunk.startZ + 10, chunk.startZ + 50);

    this.scene.add(chunk.group);
    this.chunks.push(chunk);
  }

  private spawnChunk(isEmptySafeZone: boolean) {
    const chunk = new TrackChunk(this.nextStartZ);
    this.nextStartZ += CHUNK_LENGTH;
    this.chunkCount++;

    if (!isEmptySafeZone) {
      this.populateChunk(chunk);
    }

    this.scene.add(chunk.group);
    this.chunks.push(chunk);
  }

  private populateChunk(chunk: TrackChunk) {
    const startZ = chunk.startZ;

    // Pattern Selection:
    // Every chunk can feature 2 zones: Z1 (startZ + 12 to 26) and Z2 (startZ + 36 to 52)
    const patterns = [
      'RAMP_TRAIN_AND_HURDLES',
      'MOVING_TRAIN_AND_SLIDE',
      'CARGO_TRAIN_AND_HURDLES',
      'DOUBLE_HURDLE_AND_COIN_ARC',
      'STATIONARY_TRAIN_AND_BUFFER',
      'HIGH_GATE_SEQUENCE',
    ];
    const pattern = patterns[this.chunkCount % patterns.length];

    if (pattern === 'RAMP_TRAIN_AND_HURDLES') {
      // Ramp train in Left lane (climbable!)
      this.addTrain(chunk, 0, startZ + 25, { hasRamp: true, color: 0x2563eb, tagText: 'SURF' });
      // Low hurdle in Center lane with coin arc
      this.addLowHurdle(chunk, 1, startZ + 18);
      this.addCoinArc(chunk, 1, startZ + 18);
      // High barrier in Right lane
      this.addHighBarrier(chunk, 2, startZ + 20);
      // Power-up on top of the ramp train
      this.addPowerUp(chunk, 0, 4.4, startZ + 25);
    } else if (pattern === 'CARGO_TRAIN_AND_HURDLES') {
      // Indian Railway Freight Container Train in Right lane with climbable ramp!
      this.addTrain(chunk, 2, startZ + 28, { hasRamp: true, isCargo: true, tagText: 'CONCOR' });
      // Low hurdle in Center lane
      this.addLowHurdle(chunk, 1, startZ + 20);
      this.addCoinArc(chunk, 1, startZ + 20);
      // High barrier in Left lane
      this.addHighBarrier(chunk, 0, startZ + 22);
      // Super Sneakers power-up on top of the cargo train
      this.addPowerUp(chunk, 2, 4.4, startZ + 28);
    } else if (pattern === 'MOVING_TRAIN_AND_SLIDE') {
      // Oncoming moving train in center lane!
      this.addTrain(chunk, 1, startZ + 45, { isMoving: true, color: 0xdc2626, tagText: 'FAST' });
      // High barriers in left & right lane
      this.addHighBarrier(chunk, 0, startZ + 20);
      this.addCoinLine(chunk, 0, 0.5, startZ + 12, startZ + 28);
      this.addLowHurdle(chunk, 2, startZ + 22);
      this.addCoinArc(chunk, 2, startZ + 22);
    } else if (pattern === 'DOUBLE_HURDLE_AND_COIN_ARC') {
      // Hurdles on lane 0 and 2
      this.addLowHurdle(chunk, 0, startZ + 16);
      this.addCoinArc(chunk, 0, startZ + 16);
      this.addLowHurdle(chunk, 2, startZ + 16);
      this.addCoinArc(chunk, 2, startZ + 16);

      // Buffer stop in lane 1 further down
      this.addBufferStop(chunk, 1, startZ + 38);
      this.addCoinLine(chunk, 0, 0.8, startZ + 32, startZ + 48);

      // Letter pickup
      if (Math.random() > 0.4) {
        const char = this.lettersAvailable[this.currentLetterIndex % this.lettersAvailable.length];
        this.addLetter(chunk, 2, 1.2, startZ + 36, char);
        this.currentLetterIndex++;
      }
    } else if (pattern === 'STATIONARY_TRAIN_AND_BUFFER') {
      // Stationary train on Right lane
      this.addTrain(chunk, 2, startZ + 30, { hasRamp: false, color: 0x059669, tagText: 'RUSH' });
      // Low hurdle on Left lane
      this.addLowHurdle(chunk, 0, startZ + 24);
      this.addCoinArc(chunk, 0, startZ + 24);
      // Buffer stop on Center lane
      this.addBufferStop(chunk, 1, startZ + 24);
      // Power-up in Center lane past buffer stop
      this.addPowerUp(chunk, 0, 1.2, startZ + 42);
    } else {
      // HIGH_GATE_SEQUENCE
      this.addHighBarrier(chunk, 0, startZ + 16);
      this.addHighBarrier(chunk, 1, startZ + 26);
      this.addLowHurdle(chunk, 2, startZ + 20);
      this.addCoinLine(chunk, 1, 0.5, startZ + 16, startZ + 34);
      this.addCoinArc(chunk, 2, startZ + 20);
    }

    // Always spawn Sky Coins for Jetpack runners (high up at Y=12)
    this.addSkyCoins(chunk);
  }

  private addTrain(
    chunk: TrackChunk,
    laneIdx: number,
    z: number,
    options: { hasRamp?: boolean; isMoving?: boolean; color?: number; tagText?: string; isCargo?: boolean }
  ) {
    const laneX = LANES[laneIdx];
    const isCargo = options.isCargo !== undefined ? options.isCargo : Math.random() < 0.32;
    const trainMesh = isCargo
      ? createCargoTrain({
          hasRamp: options.hasRamp,
          tagText: options.tagText || 'CONCOR',
        })
      : createSubwayTrain({
          color: options.color,
          hasRamp: options.hasRamp,
          tagText: options.tagText,
        });
    trainMesh.position.set(laneX, 0, z);
    chunk.group.add(trainMesh);

    chunk.obstacles.push({
      mesh: trainMesh,
      lane: laneIdx,
      z,
      type: 'TRAIN',
      hasRamp: options.hasRamp,
      isMoving: options.isMoving,
      speed: options.isMoving ? 14 : 0, // 14 m/s oncoming
      bounds: {
        minX: laneX - 1.35,
        maxX: laneX + 1.35,
        minY: 0,
        maxY: 4.2,
        minZ: z - 11,
        maxZ: z + 11,
      },
    });

    // If train has a ramp, place a trail of coins along its ramp and roof!
    if (options.hasRamp) {
      // Ground coins in front of the train
      this.addSingleCoin(chunk, laneIdx, laneX, 0.8, z - 15);
      this.addSingleCoin(chunk, laneIdx, laneX, 0.8, z - 13);
      // Ascending coins up the ramp
      this.addSingleCoin(chunk, laneIdx, laneX, 1.8, z - 11);
      this.addSingleCoin(chunk, laneIdx, laneX, 2.8, z - 8.5);
      this.addSingleCoin(chunk, laneIdx, laneX, 3.8, z - 6);
      // Full line of rooftop coins along the train
      for (let rz = z - 4; rz <= z + 9; rz += 2.2) {
        this.addSingleCoin(chunk, laneIdx, laneX, 4.3, rz);
      }
    } else if (!options.isMoving) {
      // Stationary train: ground coins in front of train
      this.addSingleCoin(chunk, laneIdx, laneX, 0.8, z - 16);
      this.addSingleCoin(chunk, laneIdx, laneX, 0.8, z - 14);
      // Jump ascent arc
      this.addSingleCoin(chunk, laneIdx, laneX, 2.2, z - 12);
      this.addSingleCoin(chunk, laneIdx, laneX, 3.6, z - 10);
      // Rooftop coin trail
      for (let rz = z - 8; rz <= z + 8; rz += 2.2) {
        this.addSingleCoin(chunk, laneIdx, laneX, 4.3, rz);
      }
    }
  }

  private addLowHurdle(chunk: TrackChunk, laneIdx: number, z: number) {
    const laneX = LANES[laneIdx];
    const mesh = createLowHurdle();
    mesh.position.set(laneX, 0, z);
    chunk.group.add(mesh);

    chunk.obstacles.push({
      mesh,
      lane: laneIdx,
      z,
      type: 'LOW_HURDLE',
      bounds: {
        minX: laneX - 1.2,
        maxX: laneX + 1.2,
        minY: 0,
        maxY: 0.95,
        minZ: z - 0.4,
        maxZ: z + 0.4,
      },
    });
  }

  private addHighBarrier(chunk: TrackChunk, laneIdx: number, z: number) {
    const laneX = LANES[laneIdx];
    const mesh = createHighBarrier();
    mesh.position.set(laneX, 0, z);
    chunk.group.add(mesh);

    chunk.obstacles.push({
      mesh,
      lane: laneIdx,
      z,
      type: 'HIGH_BARRIER',
      bounds: {
        minX: laneX - 1.2,
        maxX: laneX + 1.2,
        minY: 1.35, // Clear under 1.35m
        maxY: 2.9,
        minZ: z - 0.4,
        maxZ: z + 0.4,
      },
    });
  }

  private addBufferStop(chunk: TrackChunk, laneIdx: number, z: number) {
    const laneX = LANES[laneIdx];
    const mesh = createBufferStop();
    mesh.position.set(laneX, 0, z);
    chunk.group.add(mesh);

    chunk.obstacles.push({
      mesh,
      lane: laneIdx,
      z,
      type: 'BUFFER_STOP',
      bounds: {
        minX: laneX - 1.2,
        maxX: laneX + 1.2,
        minY: 0,
        maxY: 2.0,
        minZ: z - 0.8,
        maxZ: z + 0.8,
      },
    });
  }

  private addSingleCoin(chunk: TrackChunk, lane: number, x: number, y: number, z: number) {
    const coin = createCoinMesh();
    coin.position.set(x, y, z);
    chunk.group.add(coin);
    chunk.coins.push({
      mesh: coin,
      lane,
      x,
      y,
      z,
      collected: false,
    });
  }

  private addCoinLine(chunk: TrackChunk, laneIdx: number, y: number, startZ: number, endZ: number) {
    const lx = LANES[laneIdx];
    for (let z = startZ; z <= endZ; z += 2.0) {
      this.addSingleCoin(chunk, laneIdx, lx, y, z);
    }
  }

  // Parabolic coin arc over jump hurdles
  private addCoinArc(chunk: TrackChunk, laneIdx: number, centerZ: number) {
    const lx = LANES[laneIdx];
    const offsets = [-3.0, -1.5, 0, 1.5, 3.0];
    const heights = [0.8, 1.7, 2.3, 1.7, 0.8];

    offsets.forEach((oz, i) => {
      this.addSingleCoin(chunk, laneIdx, lx, heights[i], centerZ + oz);
    });
  }

  private addSkyCoins(chunk: TrackChunk) {
    // Dense double trail of golden coins in the sky for Jetpack mode (Y=12)
    const midX = LANES[1];
    for (let z = chunk.startZ + 4; z < chunk.endZ - 4; z += 2.2) {
      const x = midX + Math.sin(z * 0.15) * 2.2;
      const coin = createCoinMesh();
      coin.position.set(x, 12, z);
      chunk.group.add(coin);
      chunk.coins.push({
        mesh: coin,
        lane: 1,
        x,
        y: 12,
        z,
        collected: false,
        isSkyCoin: true,
      });
    }
  }

  private addPowerUp(chunk: TrackChunk, laneIdx: number, y: number, z: number) {
    const types: PowerUpType[] = ['MAGNET', 'SUPER_SNEAKERS', 'MULTIPLIER', 'JETPACK', 'HOVERBOARD'];
    const type = types[Math.floor(Math.random() * types.length)];
    const lx = LANES[laneIdx];
    const mesh = createPowerUpMesh(type);
    mesh.position.set(lx, y, z);
    chunk.group.add(mesh);

    chunk.powerUps.push({
      mesh,
      type,
      lane: laneIdx,
      x: lx,
      y,
      z,
      collected: false,
    });
  }

  private addLetter(chunk: TrackChunk, laneIdx: number, y: number, z: number, char: string) {
    const lx = LANES[laneIdx];
    const mesh = createLetterMesh(char);
    mesh.position.set(lx, y, z);
    chunk.group.add(mesh);

    chunk.letters.push({
      mesh,
      char,
      lane: laneIdx,
      x: lx,
      y,
      z,
      collected: false,
    });
  }

  public reset() {
    for (const chunk of this.chunks) {
      this.scene.remove(chunk.group);
    }
    this.chunks = [];
    this.initTracks();
  }
}
