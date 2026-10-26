import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  createPlayerMesh,
  createChaserMesh,
  createFlyingBirdMesh,
  PlayerMeshGroup,
  ChaserGroup,
  FlyingBirdGroup,
  PowerUpType,
} from './proceduralModels';
import { TrackManager, LANES, LANE_WIDTH } from './trackManager';
import { sound } from './audio';

export type GameState = 'MENU' | 'INTRO' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';
export type BoardSkin = 'STAR' | 'CYBER' | 'FLAME' | 'GOLD';

export interface GameMetrics {
  state: GameState;
  score: number;
  highScore: number;
  coins: number;
  speed: number;
  multiplier: number;
  letters: { [key: string]: boolean };
  activePowerUps: {
    magnet: number; // remaining seconds
    superSneakers: number;
    multiplier: number;
    jetpack: number;
    hoverboard: number;
  };
  hoverboardInventory: number;
  activeBoard: BoardSkin;
  upgrades: {
    magnet: number;
    jetpack: number;
    sneakers: number;
    multiplier: number;
  };
  comboPopup: { text: string; color: string; id: number } | null;
}

export interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class SubwayEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public trackManager: TrackManager;

  // Actors & Creatures
  public player: PlayerMeshGroup;
  public chaser: ChaserGroup;
  public birds: FlyingBirdGroup[] = [];

  // State
  public state: GameState = 'MENU';
  public introTimer: number = 0;
  public score: number = 0;
  public highScore: number = 0;
  public coins: number = 0;
  public distance: number = 0;
  public baseSpeed: number = 22; // Fast & snappy
  public currentSpeed: number = 22;
  public maxSpeed: number = 38;

  // Movement & Lanes
  public currentLane: number = 1; // 0: Left, 1: Center, 2: Right
  public targetX: number = 0;
  public playerX: number = 0;
  public playerY: number = 0;
  public playerZ: number = 0;
  public velocityY: number = 0;
  public isGrounded: boolean = true;
  public groundY: number = 0;

  // Actions
  public isSliding: boolean = false;
  public slideTimer: number = 0;
  public isStumbled: boolean = false;
  public stumbleTimer: number = 0;
  public hitstopTimer: number = 0;
  public chaserDistance: number = 14; // Default far behind

  // Power-Ups & Upgrades
  public magnetTimer: number = 0;
  public superSneakersTimer: number = 0;
  public multiplierTimer: number = 0;
  public jetpackTimer: number = 0;
  public hoverboardTimer: number = 0;
  public hoverboardsCount: number = 3;
  public letters: { [key: string]: boolean } = { S: false, U: false, R: false, F: false };
  public runCoins: number = 0;
  public activeBoard: BoardSkin = 'STAR';
  public upgrades = {
    magnet: 1,
    jetpack: 1,
    sneakers: 1,
    multiplier: 1,
  };
  public comboPopup: { text: string; color: string; id: number } | null = null;
  private comboPopupTimer: number = 0;
  private comboIdCounter: number = 0;
  private coinStreak: number = 0;
  private lastCoinTime: number = 0;
  private clearedObstacles = new Set<unknown>();
  private wasOnRoof: boolean = false;

  // Particles
  private particles: Particle[] = [];
  private particleGroup: THREE.Group;

  // Camera Shake
  private cameraShake: number = 0;
  private cameraBaseOffset: THREE.Vector3 = new THREE.Vector3(0, 3.8, -6.5);

  // Animation ticks
  private runCycle: number = 0;
  private animClock: THREE.Clock = new THREE.Clock();

  // Callbacks
  public onMetricsUpdate?: (metrics: GameMetrics) => void;
  public onGameOver?: (finalScore: number, coins: number, isNewHigh: boolean) => void;

  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  constructor(mountElement: HTMLDivElement) {
    // 1. Software WebGL Probe
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer & Color Pipeline
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(mountElement.clientWidth, mountElement.clientHeight);
    mountElement.appendChild(this.renderer.domElement);

    // 3. Sunny Blue Sky & Horizon Mist
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // Beautiful radiant sunny sky blue!
    this.scene.fog = new THREE.Fog(0x7dd3fc, 55, 175); // Light cyan atmospheric haze

    // 4. Glowing Radiant 3D Sun in the Sky
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(5.0, 16, 16), sunMat);
    sunMesh.position.set(22, 48, 85);
    this.scene.add(sunMesh);

    // Warm sun corona glow
    const sunGlow = new THREE.Mesh(
      new THREE.SphereGeometry(9.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.35 })
    );
    sunGlow.position.set(22, 48, 85);
    this.scene.add(sunGlow);

    // 5. Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      mountElement.clientWidth / mountElement.clientHeight,
      0.1,
      200
    );

    // 6. Radiant Daytime Lighting Rig (Warm Sunlight Key + Sky Cyan Fill)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0xfde047, 1.4);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.3);
    keyLight.position.set(18, 28, 12);
    keyLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 70;
      keyLight.shadow.camera.left = -15;
      keyLight.shadow.camera.right = 15;
      keyLight.shadow.camera.top = 20;
      keyLight.shadow.camera.bottom = -10;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // 6. Actors & Track
    this.trackManager = new TrackManager(this.scene);
    this.player = createPlayerMesh();
    this.scene.add(this.player);

    this.chaser = createChaserMesh();
    this.scene.add(this.chaser);

    // 7. Flying Birds Flock in the Sunny Sky (ছোট পাখি আকাশে উড়বে)
    for (let i = 0; i < 8; i++) {
      const bird = createFlyingBirdMesh();
      bird.position.set(
        (Math.random() - 0.5) * 36,
        18 + Math.random() * 8,
        15 + i * 14
      );
      this.scene.add(bird);
      this.birds.push(bird);
    }

    // 7. Particles
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
    this.initParticlePool();

    // 8. Saved game data from LocalStorage
    const saved = localStorage.getItem('subway_surfers_high_score');
    if (saved) {
      this.highScore = parseInt(saved, 10) || 0;
    }
    const savedCoins = localStorage.getItem('subway_surfers_total_coins');
    if (savedCoins) {
      this.coins = parseInt(savedCoins, 10) || 0;
    }
    const savedBoard = localStorage.getItem('subway_surfers_board') as BoardSkin;
    if (savedBoard) {
      this.activeBoard = savedBoard;
    }
    const savedUpgrades = localStorage.getItem('subway_surfers_upgrades');
    if (savedUpgrades) {
      try {
        this.upgrades = { ...this.upgrades, ...JSON.parse(savedUpgrades) };
      } catch {
        // ignore
      }
    }
    const savedBoardsCount = localStorage.getItem('subway_surfers_hoverboards');
    if (savedBoardsCount) {
      this.hoverboardsCount = parseInt(savedBoardsCount, 10) || 3;
    }
    this.applyBoardSkinMesh(this.activeBoard);

    // 9. Resize handler
    window.addEventListener('resize', this.onWindowResize);

    // Start render loop
    this.tick = this.tick.bind(this);
    this.frameId = requestAnimationFrame(this.tick);
  }

  private onWindowResize = () => {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private initParticlePool() {
    const pGeom = new THREE.SphereGeometry(0.12, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let i = 0; i < 90; i++) {
      const mesh = new THREE.Mesh(pGeom, pMat.clone());
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
      });
    }
  }

  public spawnParticles(x: number, y: number, z: number, count: number, color: number) {
    let spawned = 0;
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.life = 0;
        p.maxLife = 0.35 + Math.random() * 0.35;
        p.mesh.position.set(x, y, z);
        (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
        p.mesh.visible = true;
        p.vel.set(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 2,
          (Math.random() - 0.5) * 8
        );
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  // --- Controls & Action Dispatchers ---

  public moveLeft() {
    if (this.state !== 'PLAYING') return;
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = LANES[this.currentLane];
      sound.playLaneSwitch();
    }
  }

  public moveRight() {
    if (this.state !== 'PLAYING') return;
    if (this.currentLane < 2) {
      this.currentLane++;
      this.targetX = LANES[this.currentLane];
      sound.playLaneSwitch();
    }
  }

  public jump() {
    if (this.state !== 'PLAYING') return;
    if (this.jetpackTimer > 0) return; // Flying with jetpack

    if (this.isGrounded) {
      const hasSuper = this.superSneakersTimer > 0;
      const jumpSpeed = hasSuper ? (23.5 + (this.upgrades.sneakers - 1) * 1.5) : 16.2;
      this.velocityY = jumpSpeed;
      this.isGrounded = false;
      this.isSliding = false; // Jump cancels slide
      sound.playJump(hasSuper);
      this.spawnParticles(this.playerX, this.playerY + 0.2, this.playerZ, 6, 0xffffff);
    }
  }

  public slide() {
    if (this.state !== 'PLAYING') return;
    if (this.jetpackTimer > 0) return;

    if (!this.isGrounded) {
      // Mid-air FAST FALL / Dive-down!
      this.velocityY = -28.0;
    }

    this.isSliding = true;
    this.slideTimer = 0.8; // Slide duration
    sound.playSlide();
    this.spawnParticles(this.playerX, this.playerY + 0.1, this.playerZ, 8, 0x94a3b8);
  }

  public activateHoverboard() {
    if (this.state !== 'PLAYING') return;
    if (this.hoverboardTimer <= 0 && this.hoverboardsCount > 0) {
      this.hoverboardsCount--;
      localStorage.setItem('subway_surfers_hoverboards', String(this.hoverboardsCount));
      this.hoverboardTimer = 30.0;
      sound.playHoverboardStart();
      this.showCombo('HOVERBOARD SHIELD! 🛹', '#ec4899');
      this.spawnParticles(this.playerX, this.playerY + 0.3, this.playerZ, 20, 0x06b6d4);
      this.emitMetrics();
    }
  }

  public setBoardSkin(skin: BoardSkin) {
    this.activeBoard = skin;
    localStorage.setItem('subway_surfers_board', skin);
    this.applyBoardSkinMesh(skin);
    this.showCombo(`${skin} BOARD EQUIPPED! 🛹`, '#38bdf8');
    this.emitMetrics();
  }

  public applyBoardSkinMesh(skin: BoardSkin) {
    if (!this.player.hoverboardDeck || !this.player.hoverboardRim) return;

    const deckMat = this.player.hoverboardDeck.material as THREE.MeshStandardMaterial;
    const rimMat = this.player.hoverboardRim.material as THREE.MeshStandardMaterial;

    if (skin === 'STAR') {
      deckMat.color.setHex(0xec4899); // Magenta Star
      deckMat.roughness = 0.25;
      deckMat.metalness = 0.6;
      rimMat.color.setHex(0x06b6d4); // Cyan Neon
      rimMat.emissive.setHex(0x06b6d4);
      this.player.hoverboardThrusters?.forEach((t) => {
        (t.material as THREE.MeshStandardMaterial).emissive.setHex(0x38bdf8);
      });
    } else if (skin === 'CYBER') {
      deckMat.color.setHex(0x0f172a); // Stealth Black
      deckMat.roughness = 0.2;
      deckMat.metalness = 0.8;
      rimMat.color.setHex(0x22c55e); // Matrix Neon Green
      rimMat.emissive.setHex(0x22c55e);
      this.player.hoverboardThrusters?.forEach((t) => {
        (t.material as THREE.MeshStandardMaterial).emissive.setHex(0x22c55e);
      });
    } else if (skin === 'FLAME') {
      deckMat.color.setHex(0xdc2626); // Flame Crimson
      deckMat.roughness = 0.3;
      deckMat.metalness = 0.5;
      rimMat.color.setHex(0xf97316); // Fiery Orange Neon
      rimMat.emissive.setHex(0xf97316);
      this.player.hoverboardThrusters?.forEach((t) => {
        (t.material as THREE.MeshStandardMaterial).emissive.setHex(0xfbbf24);
      });
    } else if (skin === 'GOLD') {
      deckMat.color.setHex(0xf59e0b); // 24K Gold
      deckMat.roughness = 0.15;
      deckMat.metalness = 0.95;
      rimMat.color.setHex(0xfef08a); // Pure Golden Shimmer
      rimMat.emissive.setHex(0xfacc15);
      this.player.hoverboardThrusters?.forEach((t) => {
        (t.material as THREE.MeshStandardMaterial).emissive.setHex(0xfde047);
      });
    }
  }

  public getUpgradeCost(type: 'magnet' | 'jetpack' | 'sneakers' | 'multiplier'): number {
    const lvl = this.upgrades[type];
    return lvl * 300;
  }

  public upgradePowerUp(type: 'magnet' | 'jetpack' | 'sneakers' | 'multiplier'): boolean {
    if (this.upgrades[type] >= 5) return false;
    const cost = this.getUpgradeCost(type);
    if (this.coins < cost) return false;

    this.coins -= cost;
    this.upgrades[type]++;
    localStorage.setItem('subway_surfers_total_coins', String(this.coins));
    localStorage.setItem('subway_surfers_upgrades', JSON.stringify(this.upgrades));
    sound.playPowerUp();
    this.showCombo(`${type.toUpperCase()} LVL ${this.upgrades[type]}!`, '#22c55e');
    this.emitMetrics();
    return true;
  }

  public buyHoverboard(count: number = 3): boolean {
    const cost = 250;
    if (this.coins < cost) return false;

    this.coins -= cost;
    this.hoverboardsCount += count;
    localStorage.setItem('subway_surfers_total_coins', String(this.coins));
    localStorage.setItem('subway_surfers_hoverboards', String(this.hoverboardsCount));
    sound.playPowerUp();
    this.showCombo(`+${count} HOVERBOARDS!`, '#ec4899');
    this.emitMetrics();
    return true;
  }

  public showCombo(text: string, color: string = '#facc15') {
    this.comboIdCounter++;
    this.comboPopup = { text, color, id: this.comboIdCounter };
    this.comboPopupTimer = 1.6;
  }

  // --- Game Lifecycle Transitions ---

  public startGame() {
    this.state = 'INTRO';
    this.introTimer = 2.0; // 2 seconds Subway Surfers opening chase scene at Masagram Junction
    this.distance = 0;
    this.score = 0;
    this.runCoins = 0;
    this.currentSpeed = this.baseSpeed;
    this.currentLane = 1;
    this.targetX = LANES[1];
    this.playerX = LANES[1];
    this.playerY = 0;
    this.playerZ = 2.0; // In front of Masagram Junction station signboard
    this.velocityY = 0;
    this.isGrounded = true;
    this.groundY = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isStumbled = false;
    this.stumbleTimer = 0;
    this.chaserDistance = 3.6; // Police officer & bulldog right behind!
    this.coinStreak = 0;
    this.clearedObstacles.clear();
    this.wasOnRoof = false;

    this.magnetTimer = 0;
    this.superSneakersTimer = 0;
    this.multiplierTimer = 0;
    this.jetpackTimer = 0;
    this.hoverboardTimer = 0;
    this.letters = { S: false, U: false, R: false, F: false };

    // Reset birds in the sky
    this.birds.forEach((b, i) => {
      b.position.set(
        (Math.random() - 0.5) * 36,
        18 + Math.random() * 8,
        this.playerZ + 15 + i * 14
      );
    });

    this.trackManager.reset();
    sound.playStumble(); // Police officer blows whistle tweet-tweet!
  }

  public triggerGameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    sound.stopMusic();
    sound.stopJetpackLoop();
    sound.playCrash();

    localStorage.setItem('subway_surfers_total_coins', String(this.coins));

    const isNewHigh = this.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.score;
      localStorage.setItem('subway_surfers_high_score', String(this.highScore));
      sound.playHighScore();
    }

    this.onGameOver?.(this.score, this.coins, isNewHigh);
  }

  // --- Collision & Interaction System ---

  private checkCollisions(delta: number) {
    if (this.state !== 'PLAYING') return;

    // Player bounding parameters
    const pX = this.playerX;
    const pY = this.playerY;
    const pZ = this.playerZ;
    const pHeight = this.isSliding ? 0.75 : 1.8;
    const pRadius = 0.55;

    // 1. Obstacles Collision
    const obstacles = this.trackManager.getObstaclesNear(pZ);
    let currentGroundY = 0; // Default ground is track floor

    for (const obs of obstacles) {
      // Check X & Z overlap
      const inX = Math.abs(pX - LANES[obs.lane]) < (obs.type === 'TRAIN' ? 1.4 : 1.15);
      const inZ = pZ >= obs.bounds.minZ && pZ <= obs.bounds.maxZ;

      if (inX && inZ) {
        // --- Train Collision Logic ---
        if (obs.type === 'TRAIN') {
          const roofHeight = 3.9;

          // Check if train has a ramp and player is entering from the front slope
          if (obs.hasRamp) {
            const rampStartZ = obs.bounds.minZ;
            const rampEndZ = obs.bounds.minZ + 6.0;
            if (pZ >= rampStartZ && pZ <= rampEndZ) {
              // Smoothly climb the ramp slope!
              const slopeT = Math.max(0, Math.min(1, (pZ - rampStartZ) / 6.0));
              const rampHeightAtZ = slopeT * roofHeight;
              currentGroundY = Math.max(currentGroundY, rampHeightAtZ);
              if (this.playerY < rampHeightAtZ) {
                this.playerY = rampHeightAtZ;
              }
              continue;
            }
          }

          // Train Front-Edge Vault Assist:
          // If player jumped and reaches the upper lip of the train front
          const isAtFrontLip = (pZ >= obs.bounds.minZ - 1.2 && pZ <= obs.bounds.minZ + 1.8);
          if (isAtFrontLip && (pY >= 1.6 || this.velocityY > 1.0)) {
            currentGroundY = Math.max(currentGroundY, roofHeight);
            if (this.playerY < roofHeight) {
              this.playerY = roofHeight;
              this.velocityY = Math.max(0, this.velocityY);
              this.isGrounded = true;
            }
            continue;
          }

          // Running on top of train roof (roof height ~ 3.9m)
          if (pY >= roofHeight - 0.45) {
            currentGroundY = Math.max(currentGroundY, roofHeight);
            if (!this.wasOnRoof) {
              this.wasOnRoof = true;
              this.showCombo('ROOFTOP SURF! 🚂', '#38bdf8');
              this.score += 200;
            }
            continue;
          }

          // Direct crash into train front/side!
          this.handleCrash(obs);
          return;
        }

        // --- Low Hurdle Collision Logic ---
        if (obs.type === 'LOW_HURDLE') {
          // Low hurdle can be jumped over (height 0.9m)
          if (pY > 0.85) {
            if (!this.clearedObstacles.has(obs)) {
              this.clearedObstacles.add(obs);
              if (Math.random() < 0.25) {
                this.showCombo('CLEAN JUMP! ⚡', '#22c55e');
              }
            }
            continue;
          }
          // Hit the hurdle
          this.handleCrash(obs);
          return;
        }

        // --- High Barrier Collision Logic ---
        if (obs.type === 'HIGH_BARRIER') {
          // High barrier: hanging board down to 1.35m
          // Can slide under if pHeight <= 1.25m and pY < 0.6m
          if (this.isSliding && pY < 0.5) {
            if (!this.clearedObstacles.has(obs)) {
              this.clearedObstacles.add(obs);
              this.showCombo('SWEET SLIDE! 🛹', '#ec4899');
            }
            continue;
          }
          // Can also jump over if super sneakers are active and height clears top (3.0m)
          if (pY > 2.8) {
            if (!this.clearedObstacles.has(obs)) {
              this.clearedObstacles.add(obs);
            }
            continue;
          }
          // Direct hit!
          this.handleCrash(obs);
          return;
        }

        // --- Buffer Stop Collision Logic ---
        if (obs.type === 'BUFFER_STOP') {
          // Solid bumper (cannot jump or slide)
          if (pY > 2.0) {
            currentGroundY = Math.max(currentGroundY, 1.8);
            continue;
          }
          this.handleCrash(obs);
          return;
        }
      }
    }

    if (currentGroundY === 0) {
      this.wasOnRoof = false;
    }
    this.groundY = currentGroundY;

    // 2. Coins Collection & Magnet Effect
    const coins = this.trackManager.getCoinsNear(pZ);
    const hasMagnet = this.magnetTimer > 0;
    const magnetReach = 18 + (this.upgrades.magnet - 1) * 4;

    for (const c of coins) {
      if (c.collected) continue;

      // Magnet pulls coins toward player
      if (hasMagnet && !c.isSkyCoin) {
        const dx = pX - c.mesh.position.x;
        const dy = (pY + 1.0) - c.mesh.position.y;
        const dz = pZ - c.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < magnetReach) {
          c.mesh.position.x += (dx / dist) * 32 * delta;
          c.mesh.position.y += (dy / dist) * 32 * delta;
          c.mesh.position.z += (dz / dist) * 32 * delta;
        }
      }

      // Check pickup radius
      const distToPlayer = Math.sqrt(
        Math.pow(pX - c.mesh.position.x, 2) +
        Math.pow(pY + 0.8 - c.mesh.position.y, 2) +
        Math.pow(pZ - c.mesh.position.z, 2)
      );

      if (distToPlayer < 1.45) {
        c.collected = true;
        c.mesh.visible = false;
        const now = Date.now();
        if (now - this.lastCoinTime < 1300) {
          this.coinStreak++;
        } else {
          this.coinStreak = 1;
        }
        this.lastCoinTime = now;

        if (this.coinStreak === 10) {
          this.showCombo('COIN STREAK x10! 💰', '#facc15');
        } else if (this.coinStreak === 25) {
          this.showCombo('SUPER STREAK x25! 🔥', '#f97316');
        } else if (this.coinStreak === 50) {
          this.showCombo('MEGA STREAK x50! ⭐', '#ec4899');
        }

        const coinVal = this.multiplierTimer > 0 ? 2 : 1;
        this.runCoins += coinVal;
        this.coins += coinVal;
        this.score += 25 * coinVal;
        sound.playCoin();
        this.spawnParticles(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 8, 0xfacc15);
      }
    }

    // 3. Power-Ups Collection
    const powerUps = this.trackManager.getPowerUpsNear(pZ);
    for (const pu of powerUps) {
      if (pu.collected) continue;
      const d = Math.sqrt(
        Math.pow(pX - pu.x, 2) +
        Math.pow(pY + 0.8 - pu.y, 2) +
        Math.pow(pZ - pu.z, 2)
      );
      if (d < 1.6) {
        pu.collected = true;
        pu.mesh.visible = false;
        this.applyPowerUp(pu.type);
        sound.playPowerUp();
        this.spawnParticles(pu.x, pu.y, pu.z, 16, 0x38bdf8);
      }
    }

    // 4. Letters (S-U-R-F) Collection
    const letters = this.trackManager.getLettersNear(pZ);
    for (const l of letters) {
      if (l.collected) continue;
      const d = Math.sqrt(
        Math.pow(pX - l.x, 2) +
        Math.pow(pY + 0.8 - l.y, 2) +
        Math.pow(pZ - l.z, 2)
      );
      if (d < 1.6) {
        l.collected = true;
        l.mesh.visible = false;
        this.letters[l.char] = true;
        this.score += 500;
        sound.playPowerUp();
        this.spawnParticles(l.x, l.y, l.z, 20, 0xf59e0b);

        // Check if all letters collected!
        if (this.letters.S && this.letters.U && this.letters.R && this.letters.F) {
          this.coins += 100;
          this.hoverboardsCount += 1;
          this.letters = { S: false, U: false, R: false, F: false };
        }
      }
    }
  }

  private handleCrash(obs: unknown) {
    // If Hoverboard is active, it acts as a shield!
    if (this.hoverboardTimer > 0) {
      this.hoverboardTimer = 0;
      sound.playHoverboardBreak();
      this.cameraShake = 0.5;
      this.hitstopTimer = 0.05; // 50ms hitstop
      this.spawnParticles(this.playerX, this.playerY + 1.0, this.playerZ, 30, 0xef4444);
      // Stumble forward with invulnerability
      this.isStumbled = true;
      this.stumbleTimer = 1.5;
      return;
    }

    // Direct game over crash!
    this.cameraShake = 0.8;
    this.triggerGameOver();
  }

  private applyPowerUp(type: PowerUpType) {
    if (type === 'MAGNET') {
      this.magnetTimer = 15.0 + (this.upgrades.magnet - 1) * 3.5;
      this.showCombo('COIN MAGNET! 🧲', '#ec4899');
    } else if (type === 'SUPER_SNEAKERS') {
      this.superSneakersTimer = 15.0 + (this.upgrades.sneakers - 1) * 3.5;
      this.showCombo('SUPER SNEAKERS! 👟', '#22c55e');
    } else if (type === 'MULTIPLIER') {
      this.multiplierTimer = 15.0 + (this.upgrades.multiplier - 1) * 3.5;
      this.showCombo('2X MULTIPLIER! ⚡', '#06b6d4');
    } else if (type === 'JETPACK') {
      this.jetpackTimer = 8.0 + (this.upgrades.jetpack - 1) * 2.0;
      this.showCombo('JETPACK BLAST! 🚀', '#f97316');
      sound.startJetpackLoop();
    } else if (type === 'HOVERBOARD') {
      this.hoverboardsCount++;
      localStorage.setItem('subway_surfers_hoverboards', String(this.hoverboardsCount));
      this.showCombo('+1 HOVERBOARD! 🛹', '#38bdf8');
    }
  }

  // --- Main 60fps Simulation Tick ---

  private tick() {
    if (this.isDestroyed) return;

    const rawDt = this.animClock.getDelta();
    const dt = Math.min(rawDt, 0.05); // Clamp dt

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(this.tick);
      return;
    }

    if (this.state === 'PLAYING') {
      this.updateSimulation(dt);
    } else if (this.state === 'INTRO') {
      this.updateIntroSequence(dt);
    } else if (this.state === 'MENU') {
      // Atmospheric view of Masagram Junction Station platform with hero and police officer
      const t = this.animClock.getElapsedTime() * 0.4;
      this.camera.position.set(2.8 + Math.cos(t) * 1.5, 2.6, -1.0 + Math.sin(t) * 1.5);
      this.camera.lookAt(0, 1.4, 5.0);

      // Hero standing on track at station
      this.player.position.set(0, 0, 3.5);
      this.player.hoverboard.visible = false;
      this.player.torso.rotation.set(0.1, -0.2, 0);

      // Police officer and bulldog standing right behind on the station tracks
      this.chaser.position.set(0.4, 0, -0.5);
      this.chaser.inspector.rotation.y = 0;
      this.chaser.dog.rotation.y = 0;
    }

    // Update Particles
    this.updateParticles(dt);

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    this.frameId = requestAnimationFrame(this.tick);
  }

  private updateIntroSequence(dt: number) {
    this.introTimer -= dt;
    const progress = 1 - Math.max(0, this.introTimer / 2.0); // 0 to 1

    // Runner accelerates down the Masagram station tracks
    const runSpeed = 12 + progress * 10;
    this.playerZ += runSpeed * dt;
    this.playerX = 0;
    this.playerY = 0;

    // Police officer and dog run in hot pursuit right behind!
    this.chaserDistance = 3.6 - Math.sin(progress * Math.PI) * 0.4;

    this.animatePlayer(dt);
    this.animateChaser(dt);
    this.updateBirds(dt);
    this.trackManager.update(this.playerZ, dt);

    // Camera swoops smoothly from station overview into runner chase cam
    const camStartX = 2.4;
    const camStartY = 3.8;
    const camStartZ = this.playerZ - 8.5;

    const targetCamX = 0;
    const targetCamY = 3.8;
    const targetCamZ = this.playerZ - 6.8;

    const easeT = progress * progress * (3 - 2 * progress); // smoothstep
    this.camera.position.x = THREE.MathUtils.lerp(camStartX, targetCamX, easeT);
    this.camera.position.y = THREE.MathUtils.lerp(camStartY, targetCamY, easeT);
    this.camera.position.z = THREE.MathUtils.lerp(camStartZ, targetCamZ, easeT);
    this.camera.lookAt(0, 1.4, this.playerZ + 8.0);

    this.emitMetrics();

    if (this.introTimer <= 0) {
      this.state = 'PLAYING';
      sound.startMusic();
    }
  }

  private updateSimulation(dt: number) {
    // 1. Advance Speed & Distance
    // Ramp up speed over time
    if (this.currentSpeed < this.maxSpeed) {
      this.currentSpeed += dt * 0.35;
    }

    const effectiveSpeed = this.jetpackTimer > 0 ? this.currentSpeed * 1.3 : this.currentSpeed;
    this.playerZ += effectiveSpeed * dt;
    this.distance = Math.floor(this.playerZ);

    const upgradeMult = 1 + (this.upgrades.multiplier - 1) * 0.25;
    const scoreMult = (this.multiplierTimer > 0 ? 2 : 1) * (this.jetpackTimer > 0 ? 2 : 1) * upgradeMult;
    this.score += Math.floor(effectiveSpeed * dt * 3 * scoreMult);

    // 2. Horizontal Lane Interpolation
    this.playerX += (this.targetX - this.playerX) * Math.min(1.0, 22 * dt);

    // 3. Vertical Physics (Jump / Fall / Jetpack)
    if (this.jetpackTimer > 0) {
      // Ascend smoothly to sky level (Y = 12.0)
      this.playerY += (12.0 - this.playerY) * Math.min(1.0, 5 * dt);
      this.velocityY = 0;
      this.isGrounded = false;
      // Spawn jet flame particles
      this.spawnParticles(this.playerX - 0.2, this.playerY + 0.8, this.playerZ - 0.4, 1, 0xf97316);
      this.spawnParticles(this.playerX + 0.2, this.playerY + 0.8, this.playerZ - 0.4, 1, 0xfde047);
    } else {
      // Normal gravity simulation
      const gravity = -36.0;
      this.velocityY += gravity * dt;
      this.playerY += this.velocityY * dt;

      if (this.playerY <= this.groundY) {
        this.playerY = this.groundY;
        this.velocityY = 0;
        if (!this.isGrounded) {
          this.isGrounded = true;
          // Landing dust
          this.spawnParticles(this.playerX, this.playerY + 0.1, this.playerZ, 6, 0x94a3b8);
        }
      } else {
        this.isGrounded = false;
      }
    }

    // 4. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 5. Power-up Timers & Combo Popup
    if (this.magnetTimer > 0) this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    if (this.superSneakersTimer > 0) this.superSneakersTimer = Math.max(0, this.superSneakersTimer - dt);
    if (this.multiplierTimer > 0) this.multiplierTimer = Math.max(0, this.multiplierTimer - dt);
    if (this.hoverboardTimer > 0) this.hoverboardTimer = Math.max(0, this.hoverboardTimer - dt);

    if (this.comboPopupTimer > 0) {
      this.comboPopupTimer -= dt;
      if (this.comboPopupTimer <= 0) {
        this.comboPopup = null;
      }
    }

    if (this.jetpackTimer > 0) {
      this.jetpackTimer -= dt;
      if (this.jetpackTimer <= 0) {
        sound.stopJetpackLoop();
      }
    }

    // 6. Chaser / Police Inspector & Bulldog Dynamics
    if (this.isStumbled) {
      this.stumbleTimer -= dt;
      this.chaserDistance = Math.max(2.6, this.chaserDistance - 16 * dt);
      if (this.stumbleTimer <= 0) {
        this.isStumbled = false;
      }
    } else {
      // Keeps police officer and dog visibly chasing between player and camera (4.8 - 5.2m behind player)
      this.chaserDistance = Math.min(5.2, this.chaserDistance + 1.2 * dt);
    }

    // 7. Update Track (chunk streaming, oncoming trains)
    this.trackManager.update(this.playerZ, dt);

    // 8. Collisions & Pickups
    this.checkCollisions(dt);

    // 9. Animate Flying Birds in Sunny Sky
    this.updateBirds(dt);

    // 10. Animate Player Model
    this.animatePlayer(dt);

    // 11. Animate Chaser Model
    this.animateChaser(dt);

    // 12. Camera Follow & Screen Shake
    this.updateCamera(dt);

    // 13. Emit Metrics for React HUD
    this.emitMetrics();
  }

  private updateBirds(dt: number) {
    const time = this.animClock.getElapsedTime();
    for (const bird of this.birds) {
      // Fly forward along Z with cruise speed
      bird.position.z += (bird.speed + this.currentSpeed * 0.35) * dt;
      // Wing flapping animation
      const flap = Math.sin(time * 16 + bird.position.x) * 0.45;
      bird.wingL.rotation.z = flap;
      bird.wingR.rotation.z = -flap;
      // Gentle altitude soaring wave
      bird.position.y = bird.baseY + Math.sin(time * 2.2 + bird.position.z * 0.08) * 0.7;

      // Wrap around player view
      if (bird.position.z > this.playerZ + 115) {
        bird.position.z = this.playerZ - 25;
        bird.position.x = (Math.random() - 0.5) * 36;
      } else if (bird.position.z < this.playerZ - 35) {
        bird.position.z = this.playerZ + 55 + Math.random() * 45;
        bird.position.x = (Math.random() - 0.5) * 36;
      }
    }
  }

  private animatePlayer(dt: number) {
    this.player.position.set(this.playerX, this.playerY, this.playerZ);

    // Banking tilt on lane switches
    const lean = (this.targetX - this.playerX) * 0.18;
    this.player.rotation.z = -lean;
    this.player.rotation.y = lean * 0.8;

    // Toggle accessories
    this.player.hoverboard.visible = this.hoverboardTimer > 0;
    this.player.jetpack.visible = this.jetpackTimer > 0;
    this.player.wingL.visible = this.superSneakersTimer > 0;
    this.player.wingR.visible = this.superSneakersTimer > 0;

    if (this.jetpackTimer > 0) {
      // Flying pose
      this.player.torso.rotation.x = 0.5;
      this.player.leftLeg.rotation.x = 0.3;
      this.player.rightLeg.rotation.x = 0.3;
      this.player.leftArm.rotation.x = -0.5;
      this.player.rightArm.rotation.x = -0.5;
      return;
    }

    if (this.hoverboardTimer > 0) {
      // Surfing pose on hoverboard
      this.player.torso.rotation.x = 0.1;
      this.player.torso.rotation.y = 0.4; // Sideways skateboard stance
      this.player.leftLeg.rotation.x = 0.2;
      this.player.rightLeg.rotation.x = -0.2;
      this.player.leftArm.rotation.z = 0.6;
      this.player.rightArm.rotation.z = -0.6;
      return;
    }

    if (this.isSliding) {
      // Crouch / low slide pose
      this.player.torso.rotation.x = 0.85;
      this.player.leftLeg.rotation.x = 1.2;
      this.player.rightLeg.rotation.x = 1.2;
      this.player.leftArm.rotation.x = -0.8;
      this.player.rightArm.rotation.x = -0.8;
      return;
    }

    if (!this.isGrounded) {
      // Jump pose
      this.player.torso.rotation.x = -0.15;
      this.player.leftLeg.rotation.x = 0.7;
      this.player.rightLeg.rotation.x = -0.4;
      this.player.leftArm.rotation.x = -1.2;
      this.player.rightArm.rotation.x = 1.0;
      return;
    }

    // Running animation cycle with natural human gait
    const runFreq = this.currentSpeed * 0.72;
    this.runCycle += dt * runFreq;

    const legAngle = Math.sin(this.runCycle) * 0.85;
    this.player.leftLeg.rotation.x = legAngle;
    this.player.rightLeg.rotation.x = -legAngle;

    // Natural running arm swing
    this.player.leftArm.rotation.x = -legAngle * 1.05;
    this.player.rightArm.rotation.x = legAngle * 1.05;

    // Athletic forward sprint lean & subtle shoulder counter-rotation
    this.player.torso.rotation.x = 0.22;
    this.player.torso.rotation.y = Math.sin(this.runCycle) * 0.08;
    this.player.head.rotation.y = -Math.sin(this.runCycle) * 0.05;
  }

  private animateChaser(dt: number) {
    const chaserZ = this.playerZ - this.chaserDistance;
    // Chaser tracks player lane smoothly
    const chaserX = this.playerX * 0.85;
    this.chaser.position.set(chaserX, this.groundY, chaserZ);

    const legAngle = Math.sin(this.runCycle * 1.25) * 0.85;

    // Bulldog enthusiastic 4-legged gallop
    this.chaser.dogLegs.forEach((leg, i) => {
      leg.rotation.x = (i % 2 === 0 ? 1 : -1) * legAngle;
    });

    // Police officer waving nightstick and pumping arms
    this.chaser.inspectorArms.rotation.x = Math.sin(this.runCycle * 0.9) * 0.55;
  }

  private updateCamera(dt: number) {
    // Dynamic camera following player smoothly
    const targetCamZ = this.playerZ - 6.8;
    const targetCamY = (this.jetpackTimer > 0 ? 15.0 : Math.max(3.8, this.playerY + 3.2));
    const targetCamX = this.playerX * 0.45;

    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1.0, 16 * dt);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1.0, 14 * dt);
    this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1.0, 22 * dt);

    // Apply Camera Shake
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
    }

    // Look slightly ahead of player
    this.camera.lookAt(this.playerX * 0.7, this.playerY + 1.2, this.playerZ + 8.0);
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.mesh.position.addScaledVector(p.vel, dt);
          p.vel.y -= 14 * dt; // Gravity
          const scale = 1 - p.life / p.maxLife;
          p.mesh.scale.set(scale, scale, scale);
        }
      }
    }
  }

  private emitMetrics() {
    const upgradeMult = this.upgrades.multiplier > 1 ? (1 + (this.upgrades.multiplier - 1) * 0.25) : 1;
    this.onMetricsUpdate?.({
      state: this.state,
      score: this.score,
      highScore: this.highScore,
      coins: this.coins,
      speed: Math.round(this.currentSpeed * 3.6), // km/h
      multiplier: Math.round((this.multiplierTimer > 0 ? 2 : 1) * upgradeMult * 10) / 10,
      letters: { ...this.letters },
      activePowerUps: {
        magnet: Math.ceil(this.magnetTimer),
        superSneakers: Math.ceil(this.superSneakersTimer),
        multiplier: Math.ceil(this.multiplierTimer),
        jetpack: Math.ceil(this.jetpackTimer),
        hoverboard: Math.ceil(this.hoverboardTimer),
      },
      hoverboardInventory: this.hoverboardsCount,
      activeBoard: this.activeBoard,
      upgrades: { ...this.upgrades },
      comboPopup: this.comboPopup,
    });
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);
    sound.stopMusic();
    sound.stopJetpackLoop();
    this.renderer.dispose();
  }
}
