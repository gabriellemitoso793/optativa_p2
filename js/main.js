import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

/**
 * CLASSE GERENCIADORA DE JOGO
 * Controla o estado, pontuação e loop principal.
 */
class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000510, 0.015);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias false p/ performance do Bloom
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        document.body.appendChild(this.renderer.domElement);

        // PÓS-PROCESSAMENTO (BLOOM)
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloom.strength = 1.8; // Intensidade do brilho
        bloom.radius = 0.5;
        this.composer.addPass(bloom);

        // Luzes
        const ambient = new THREE.AmbientLight(0x404040);
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 2);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);

        // Variáveis de Jogo
        this.isPlaying = false;
        this.score = 0;
        this.time = 0;
        this.speed = 40;
        this.clock = new THREE.Clock();
        
        // Entidades
        this.player = new Player(this.scene);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.environment = new Environment(this.scene);

        // Inputs
        this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
        this.setupInputs();
        this.setupUI();
        
        // Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupInputs() {
        window.addEventListener('keydown', e => this.handleKey(e.code, true));
        window.addEventListener('keyup', e => this.handleKey(e.code, false));
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.composer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    handleKey(code, pressed) {
        const map = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', Space: 'space', ShiftLeft: 'shift' };
        if(map[code]) this.keys[map[code]] = pressed;
    }

    setupUI() {
        document.getElementById('start-btn').onclick = () => this.start();
        document.getElementById('restart-btn').onclick = () => this.start();
    }

    start() {
        this.isPlaying = true;
        this.score = 0;
        this.time = 0;
        this.player.reset();
        this.enemies.forEach(e => this.scene.remove(e.mesh));
        this.enemies = [];
        this.projectiles.forEach(p => this.scene.remove(p.mesh));
        this.projectiles = [];
        
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        this.updateHUD();
        this.clock.start();
    }

    gameOver() {
        this.isPlaying = false;
        document.getElementById('game-over-screen').classList.add('active');
        document.getElementById('final-score').innerText = `SCORE FINAL: ${Math.floor(this.score)}`;
    }

    spawnEnemy() {
        if(Math.random() < 0.05) {
            this.enemies.push(new Enemy(this.scene));
        }
    }

    createExplosion(position, color) {
        for(let i=0; i<15; i++) {
            this.particles.push(new Particle(this.scene, position, color));
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        const dt = Math.min(this.clock.getDelta(), 0.1);

        if(this.isPlaying) {
            this.time += dt;
            this.score += dt * 10;
            
            // Player Logic
            this.player.update(dt, this.keys);
            
            // Camera follow & Speed Effect
            const targetFOV = this.keys.shift ? 75 : 60; // Efeito Turbo
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, dt * 5);
            this.camera.updateProjectionMatrix();
            
            this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.player.mesh.position.x * 0.5, dt * 2);

            // Shoot Logic
            if(this.keys.space && this.player.canShoot) {
                this.projectiles.push(new Projectile(this.scene, this.player.mesh.position));
                this.player.canShoot = false;
                setTimeout(() => this.player.canShoot = true, 250); // Cooldown
            }

            // Projectiles
            for(let i = this.projectiles.length-1; i>=0; i--) {
                const p = this.projectiles[i];
                if(p.update(dt)) {
                    this.scene.remove(p.mesh);
                    this.projectiles.splice(i, 1);
                }
            }

            // Enemies & Collisions
            this.spawnEnemy();
            for(let i = this.enemies.length-1; i>=0; i--) {
                const e = this.enemies[i];
                e.update(dt, this.speed + (this.score * 0.05)); // Acelera com o tempo

                // Colisão Projetil-Inimigo
                let enemyHit = false;
                for(let j = this.projectiles.length-1; j>=0; j--) {
                    const proj = this.projectiles[j];
                    if(e.mesh.position.distanceTo(proj.mesh.position) < 2.5) {
                        this.createExplosion(e.mesh.position, 0xffaa00);
                        this.scene.remove(e.mesh);
                        this.scene.remove(proj.mesh);
                        this.enemies.splice(i, 1);
                        this.projectiles.splice(j, 1);
                        this.score += 50;
                        enemyHit = true;
                        break;
                    }
                }
                if(enemyHit) continue;

                // Colisão Player-Inimigo
                if(e.mesh.position.distanceTo(this.player.mesh.position) < 2.0) {
                    this.createExplosion(this.player.mesh.position, 0x00f3ff);
                    this.player.takeDamage();
                    this.scene.remove(e.mesh);
                    this.enemies.splice(i, 1);
                    if(this.player.shield <= 0) this.gameOver();
                }

                // Remove se passar
                if(e.mesh.position.z > 10) {
                    this.scene.remove(e.mesh);
                    this.enemies.splice(i, 1);
                }
            }

            // Particles
            for(let i=this.particles.length-1; i>=0; i--) {
                if(this.particles[i].update(dt)) {
                    this.particles.splice(i, 1);
                }
            }

            // Environment
            this.environment.update(dt, this.speed);
            this.updateHUD();
        }

        this.composer.render();
    }

    updateHUD() {
        document.getElementById('score').innerText = Math.floor(this.score);
        document.getElementById('time').innerText = new Date(this.time * 1000).toISOString().substr(14, 5);
        document.getElementById('shield-bar').style.width = `${this.player.shield}%`;
    }
}

/**
 * CLASSE PLAYER - Constrói uma nave complexa
 */
class Player {
    constructor(scene) {
        this.mesh = new THREE.Group();
        
        // Corpo principal
        const bodyGeo = new THREE.ConeGeometry(0.5, 3, 5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = -Math.PI / 2;
        this.mesh.add(body);

        // Asas
        const wingGeo = new THREE.BoxGeometry(3, 0.1, 1);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x0044aa });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.z = 0.5;
        this.mesh.add(wing);

        // Motor (Luz)
        const engineLight = new THREE.PointLight(0x00f3ff, 1, 5);
        engineLight.position.set(0, 0, 1.5);
        this.mesh.add(engineLight);

        this.shield = 100;
        this.canShoot = true;
        scene.add(this.mesh);
    }

    reset() {
        this.mesh.position.set(0, 0, 0);
        this.shield = 100;
        this.mesh.visible = true;
    }

    takeDamage() {
        this.shield -= 34; // 3 hits morre
        // Piscar nave
        this.mesh.visible = false;
        setTimeout(() => this.mesh.visible = true, 100);
        setTimeout(() => this.mesh.visible = false, 200);
        setTimeout(() => this.mesh.visible = true, 300);
    }

    update(dt, keys) {
        const speed = keys.shift ? 15 : 10;
        
        if (keys.w && this.mesh.position.y < 4) this.mesh.position.y += speed * dt;
        if (keys.s && this.mesh.position.y > -2) this.mesh.position.y -= speed * dt;
        if (keys.a && this.mesh.position.x > -6) {
            this.mesh.position.x -= speed * dt;
            this.mesh.rotation.z = Math.min(this.mesh.rotation.z + 5*dt, 0.5); // Inclina
        }
        if (keys.d && this.mesh.position.x < 6) {
            this.mesh.position.x += speed * dt;
            this.mesh.rotation.z = Math.max(this.mesh.rotation.z - 5*dt, -0.5); // Inclina
        }

        // Retorna inclinação ao normal
        if (!keys.a && !keys.d) {
            this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, dt * 5);
        }
    }
}

/**
 * CLASSE INIMIGO - Formas Geométricas com brilho
 */
class Enemy {
    constructor(scene) {
        const geometry = new THREE.IcosahedronGeometry(Math.random() * 0.5 + 0.5, 0);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff0055, 
            emissive: 0xff0000,
            emissiveIntensity: 2,
            roughness: 0.2,
            metalness: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.mesh.position.x = (Math.random() - 0.5) * 12;
        this.mesh.position.y = (Math.random() - 0.5) * 6;
        this.mesh.position.z = -100; // Nasce longe

        // Rotação aleatória
        this.rotSpeed = { x: Math.random(), y: Math.random() };
        
        scene.add(this.mesh);
    }

    update(dt, speed) {
        this.mesh.position.z += speed * dt;
        this.mesh.rotation.x += this.rotSpeed.x * 2 * dt;
        this.mesh.rotation.y += this.rotSpeed.y * 2 * dt;
    }
}

/**
 * CLASSE PROJETIL
 */
class Projectile {
    constructor(scene, startPos) {
        const geo = new THREE.CapsuleGeometry(0.1, 1, 4, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geo, mat);
        
        this.mesh.position.copy(startPos);
        this.mesh.rotation.x = Math.PI / 2;
        scene.add(this.mesh);
    }

    update(dt) {
        this.mesh.position.z -= 60 * dt; // Muito rápido
        return this.mesh.position.z < -120; // Retorna true se deve ser deletado
    }
}

/**
 * CLASSE PARTÍCULA (SISTEMA DE EXPLOSÃO)
 */
class Particle {
    constructor(scene, pos, color) {
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.2),
            new THREE.MeshBasicMaterial({ color: color, transparent: true })
        );
        this.mesh.position.copy(pos);
        
        // Direção aleatória de explosão
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        this.life = 1.0; // 1 segundo de vida
        this.scene = scene;
        scene.add(this.mesh);
    }

    update(dt) {
        this.life -= dt * 2;
        this.mesh.position.addScaledVector(this.velocity, dt);
        this.mesh.rotation.x += dt * 5;
        this.mesh.scale.setScalar(this.life); // Diminui até sumir
        
        if(this.life <= 0) {
            this.scene.remove(this.mesh);
            return true; // Morreu
        }
        return false;
    }
}

/**
 * CLASSE AMBIENTE (GRID RETRÔ E ESTRELAS)
 */
class Environment {
    constructor(scene) {
        // Grid no chão
        this.grid = new THREE.GridHelper(200, 40, 0x00f3ff, 0x111111);
        this.grid.position.y = -5;
        scene.add(this.grid);

        // Estrelas
        const starsGeo = new THREE.BufferGeometry();
        const starsPos = [];
        for(let i=0; i<1000; i++) {
            starsPos.push((Math.random() - 0.5) * 400); // x
            starsPos.push((Math.random() - 0.5) * 400); // y
            starsPos.push((Math.random() - 0.5) * 400); // z
        }
        starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsPos, 3));
        const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({color: 0xffffff, size: 0.5}));
        scene.add(stars);
    }

    update(dt, speed) {
        // Ilusão de movimento infinito no grid
        this.grid.position.z += speed * dt;
        if(this.grid.position.z > 10) this.grid.position.z = 0;
    }
}

// INICIALIZAÇÃO
new Game();