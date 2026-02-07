/**
 * NodeGarden Implementation
 * Bundled for browser usage.
 * Based on: https://github.com/pakastin/nodegarden
 */

(function () {
    const targetFPS = 1000 / 60;
    const { devicePixelRatio = 1, requestAnimationFrame } = window;

    // --- Utils ---
    function defined(a, b) {
        return a != null ? a : b;
    }

    // --- Node Class ---
    class Node {
        constructor(garden) {
            this.garden = garden;
            this.reset();
        }

        reset({ x, y, vx, vy, m } = {}) {
            this.x = defined(x, Math.random() * this.garden.width);
            this.y = defined(y, Math.random() * this.garden.height);
            this.vx = defined(vx, Math.random() * 0.5 - 0.25);
            this.vy = defined(vy, Math.random() * 0.5 - 0.25);
            this.m = defined(m, Math.random() * 2.5 + 0.5);
        }

        addForce(force, direction) {
            this.vx += force * direction.x / this.m;
            this.vy += force * direction.y / this.m;
        }

        distanceTo(node) {
            const x = node.x - this.x;
            const y = node.y - this.y;
            const total = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            return { x, y, total };
        }

        update(deltaTime) {
            this.x += this.vx * deltaTime / targetFPS;
            this.y += this.vy * deltaTime / targetFPS;

            // Bounce/Reset at edges
            if (this.x > this.garden.width + 50 || this.x < -50 || this.y > this.garden.height + 50 || this.y < -50) {
                this.reset();
            }
        }

        squaredDistanceTo(node) {
            return (node.x - this.x) * (node.x - this.x) + (node.y - this.y) * (node.y - this.y);
        }

        collideTo(node) {
            node.vx = node.m * node.vx / (this.m + node.m) + this.m * this.vx / (this.m + node.m);
            node.vy = node.m * node.vy / (this.m + node.m) + this.m * this.vy / (this.m + node.m);
            this.reset();
        }

        render() {
            this.garden.ctx.beginPath();
            this.garden.ctx.arc(this.x, this.y, this.getDiameter(), 0, 2 * Math.PI);
            this.garden.ctx.fill();
        }

        getDiameter() {
            return this.m;
        }
    }

    // --- NodeGarden Class ---
    class NodeGarden {
        constructor(container) {
            this.nodes = [];
            this.container = container;
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.started = false;
            this.nightMode = false; // Default to Light Mode

            // Retina support
            if (devicePixelRatio && (devicePixelRatio !== 1)) {
                this.canvas.style.transform = 'scale(' + 1 / devicePixelRatio + ')';
                this.canvas.style.transformOrigin = '0 0';
            }
            this.canvas.id = 'nodegarden';

            // Interaction
            window.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const bcr = container.getBoundingClientRect();
                const scrollPos = { x: window.scrollX, y: window.scrollY };

                const mouseNode = new Node(this);
                mouseNode.x = (e.pageX - scrollPos.x - bcr.left) * devicePixelRatio;
                mouseNode.y = (e.pageY - scrollPos.y - bcr.top) * devicePixelRatio;
                mouseNode.m = 15;
                mouseNode.update = () => { };
                mouseNode.reset = () => { };
                mouseNode.render = () => { };

                this.nodes.unshift(mouseNode);

                const moveHandler = (e) => {
                    mouseNode.x = (e.pageX - scrollPos.x - bcr.left) * devicePixelRatio;
                    mouseNode.y = (e.pageY - scrollPos.y - bcr.top) * devicePixelRatio;
                };

                const upHandler = () => {
                    for (let i = 0; i < this.nodes.length; i++) {
                        if (this.nodes[i] === mouseNode) {
                            this.nodes.splice(i--, 1);
                            break;
                        }
                    }
                    window.removeEventListener('mousemove', moveHandler);
                    window.removeEventListener('mouseup', upHandler);
                };

                window.addEventListener('mousemove', moveHandler);
                window.addEventListener('mouseup', upHandler);
            });

            this.container.appendChild(this.canvas);
            this.resize();
        }

        start() {
            if (!this.playing) {
                this.playing = true;
                this.render(true);
            }
        }

        stop() {
            if (this.playing) {
                this.playing = false;
            }
        }

        resize() {
            this.width = this.container.clientWidth * devicePixelRatio;
            this.height = this.container.clientHeight * devicePixelRatio;
            this.area = this.width * this.height;
            this.nodes.length = Math.sqrt(this.area) / 25 | 0;

            this.canvas.width = this.width;
            this.canvas.height = this.height;

            // Styles
            if (this.nightMode) {
                this.ctx.fillStyle = '#ffffff';
            } else {
                this.ctx.fillStyle = '#0f172a'; // Modern Slate 900
            }

            for (let i = 0; i < this.nodes.length; i++) {
                if (this.nodes[i]) { continue; }
                this.nodes[i] = new Node(this);
            }
        }

        render(start, time) {
            if (!this.playing) return;
            if (start) {
                requestAnimationFrame((time) => {
                    this.render(true, time);
                });
            }

            const deltaTime = time - (this.lastTime || time);
            this.lastTime = time;

            this.ctx.clearRect(0, 0, this.width, this.height);

            for (let i = 0; i < this.nodes.length - 1; i++) {
                const nodeA = this.nodes[i];
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const nodeB = this.nodes[j];
                    const squaredDistance = nodeA.squaredDistanceTo(nodeB);
                    const force = 3 * (nodeA.m * nodeB.m) / squaredDistance;
                    const opacity = force * 100;

                    if (opacity < 0.025) continue;

                    if (squaredDistance <= (nodeA.m / 2 + nodeB.m / 2) * (nodeA.m / 2 + nodeB.m / 2)) {
                        if (nodeA.m <= nodeB.m) nodeA.collideTo(nodeB);
                        else nodeB.collideTo(nodeA);
                        continue;
                    }

                    const distance = nodeA.distanceTo(nodeB);
                    const direction = {
                        x: distance.x / distance.total,
                        y: distance.y / distance.total
                    };

                    this.ctx.beginPath();
                    // Modern Line Color: Slate 500 equivalent, semi-transparent
                    this.ctx.strokeStyle = 'rgba(100, 116, 139, ' + (opacity < 1 ? opacity : 1) + ')';
                    this.ctx.moveTo(nodeA.x, nodeA.y);
                    this.ctx.lineTo(nodeB.x, nodeB.y);
                    this.ctx.stroke();

                    nodeA.addForce(force, direction);
                    nodeB.addForce(-force, direction);
                }
            }

            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].render();
                this.nodes[i].update(deltaTime || 0);
            }
        }
    }

    // Initialization
    const container = document.body; // Attach to body
    // Ensure styles for canvas
    const style = document.createElement('style');
    style.innerHTML = `
        #nodegarden {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: transparent;
        }
    `;
    document.head.appendChild(style);

    const nodeGarden = new NodeGarden(container);
    nodeGarden.start();

    window.addEventListener('resize', () => {
        nodeGarden.resize();
    });

})();
