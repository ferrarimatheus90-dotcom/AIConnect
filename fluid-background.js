/**
 * Micro Particles Network
 * Particles appear around the mouse and connect (unite) with lines.
 */

const canvas = document.getElementById('bg-animation');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

// Configuration
const config = {
    color: 'rgba(0, 85, 255, 1)',   // Primary Blue
    lineColor: 'rgba(0, 85, 255,',  // Line color prefix
    particleSize: 2,                // Micro size
    connectionDistance: 100,        // Distance to unite
    spawnRate: 4,                   // Particles per move
    lifeSpeed: 0.015,               // Fade speed
    velocity: 1                     // Movement speed
};

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * config.particleSize + 1;
        this.velX = (Math.random() - 0.5) * config.velocity;
        this.velY = (Math.random() - 0.5) * config.velocity;
        this.life = 1.0;
        // Random slight color variation for depth
        this.color = Math.random() > 0.5 ? 'rgba(0, 85, 255,' : 'rgba(0, 200, 255,';
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.life -= config.lifeSpeed;
    }

    draw() {
        // Draw particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.life + ')';
        ctx.fill();
    }
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Mouse Interaction
let mouse = { x: undefined, y: undefined };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;

    // Spawn particles on move
    for (let i = 0; i < config.spawnRate; i++) {
        // Spawn slightly offset from center for better spread
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        particles.push(new Particle(mouse.x + offsetX, mouse.y + offsetY));
    }
});

// Connect particles
function connect() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            // Check distance
            let dx = particles[a].x - particles[b].x;
            let dy = particles[a].y - particles[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.connectionDistance) {
                // Opacity based on particle life and distance
                let opacity = (1 - (distance / config.connectionDistance)) * Math.min(particles[a].life, particles[b].life);
                if (opacity > 0) {
                    ctx.strokeStyle = config.lineColor + opacity + ')';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, width, height);

    // Remove dead particles
    particles = particles.filter(p => p.life > 0);

    // Update and Draw
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw Connections
    connect();
}

animate();
