/**
 * Antigravity Background - Constellation / Node Garden Effect
 * Rede de partículas conectadas (Estilo "Network")
 */

(function () {
    // === CONFIGURAÇÃO VISUAL ===
    const config = {
        particleCount: window.innerWidth < 768 ? 60 : 130, // Quantidade de pontos
        particleColor: '30, 41, 59', // Slate 800 (Cinza escuro/Preto para os pontos)
        particleSize: 2.5, // Tamanho dos pontos

        connectionDistance: 140, // Distância máxima para conectar
        connectionColor: '51, 65, 85', // Slate 700 (Cinza azulado para as linhas)

        bgGradient: ['#ffffff', '#f1f5f9'], // Fundo Branco -> Cinza muito claro

        mouseInteractionRadius: 250,
        speed: 0.2 // Velocidade moderada (Nem muito rápido, nem parado)
    };

    // Criar/Buscar Canvas
    let canvas = document.getElementById('antigravity-bg');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'antigravity-bg';
        document.body.prepend(canvas);
    }
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    let mouse = { x: null, y: null };

    // === Ajuste de Tamanho ===
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        config.particleCount = window.innerWidth < 768 ? 60 : 130;
        initParticles();
    }
    window.addEventListener('resize', resize);

    // === Classe Partícula ===
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * config.speed; // Velocidade X
            this.vy = (Math.random() - 0.5) * config.speed; // Velocidade Y
            this.size = config.particleSize;
        }

        update() {
            // Movimento constante
            this.x += this.vx;
            this.y += this.vy;

            // Interação com Mouse (Repulsão Suave)
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < config.mouseInteractionRadius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (config.mouseInteractionRadius - distance) / config.mouseInteractionRadius;
                    // Força de repulsão suave
                    const strength = 0.01;
                    this.vx -= forceDirectionX * force * strength * 0.05;
                    this.vy -= forceDirectionY * force * strength * 0.05;
                }
            }

            // Rebater nas bordas
            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${config.particleColor}, 0.25)`; // Opacidade 0.7 (Visível sem pesar)

            ctx.fill();
        }
    }

    // === Inicializar ===
    function initParticles() {
        particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // === Mouse Eventos ===
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // === Loop Principal (Draw) ===
    function animate() {
        requestAnimationFrame(animate);

        // Limpar e desenhar fundo
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, config.bgGradient[0]);
        gradient.addColorStop(1, config.bgGradient[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Atualizar e Desenhar Partículas
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Desenhar Linhas (Conexões)
            for (let j = i; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < config.connectionDistance) {
                    ctx.beginPath();
                    // Opacidade da linha baseada na distância (mais perto = mais escuro)
                    // Multiplicado por 0.45 para um meio termo ideal
                    let opacity = (1 - (distance / config.connectionDistance)) * 0.1;

                    ctx.strokeStyle = `rgba(${config.connectionColor}, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Start
    resize();
    animate();

})();
