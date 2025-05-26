window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    const tileSize = 240;
    const gap = 35;
    const gridColor = "rgba(17, 255, 0, 0.91)";
    const gardenSize = tileSize - 2 * gap;
    const arcRad = gardenSize / 1.15;
    const keysPressed = {};
    let camera = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };

    canvas.width = 3120;
    canvas.height = 1680;

    let isPaused = false;
    let hubX, hubY, X, Y;

    do {
        X = Math.floor(Math.random() * (Math.floor(canvas.width / tileSize)));
        Y = Math.floor(Math.random() * (Math.floor(canvas.height / tileSize)));

        hubX = Math.floor(Math.random() * (Math.floor(canvas.width / tileSize)));
        hubY = Math.floor(Math.random() * (Math.floor(canvas.height / tileSize)));

    } while (Math.abs(hubX - X) < 6 || Math.abs(hubY - Y) < 4 || (X == 0 && Y == 0) || (hubX == 0 && hubY == 0));

    let systemHealth = 51;
    const player = { x: tileSize, y: tileSize, size: 12, color: "white", noOfKeys: 0, shards: 0, health: 100 };
    let buildings = [];
    let towers = [];
    let bullets = [];
    let keys = [];

    class Towers {
        constructor(x, y, r, a1, a2) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.a1 = a1;
            this.a2 = a2;
        }
        draw(ctx) {

            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 132, 0, 0.63)';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.r, this.a1, this.a2, false);
            ctx.closePath();

            ctx.fillStyle = 'rgba(255, 0, 0, 0)';
            ctx.fill();

        }
        rotate(ctx) {
            const vel = Math.PI / 400;
            this.a1 += vel;
            this.a2 += vel;

            let towerDest = true;
            for (const element of buildings[this.gridX][this.gridY]) {
                if (this.x > element.x && this.x < element.x + element.size && this.y < element.y + element.size && this.y > element.y) {
                    if (!element.destroyed) {
                        towerDest = false;
                        break;
                    }
                }
            }
            if (towerDest) this.destroyed = true;
            else this.draw(ctx);
        }

    }

    class Key {
        constructor(index) {

            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.r = 6;
            this.index = index;
        }

        draw() {

            ctx.beginPath();
            ctx.fillStyle = 'rgb(255, 0, 251)';
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
            ctx.fill();
        }

        capture() {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.r + player.size) {
                keys[this.index].captured = true;
                player.noOfKeys++;
            }
        }
    }

    class Bullet {
        constructor(x, y, dx, dy) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.speed = 7;
            this.size = 4;
            this.canMove = true;
        }

        shoot() {
            let nextX = this.x + this.dx * this.speed;
            let nextY = this.y + this.dy * this.speed;

            if (nextX + this.size > canvas.width || nextX - this.size < 0) {
                this.dx = -this.dx;
                this.speed *= 0.2;
                nextX = this.x + this.dx * this.speed;
            }

            if (nextY + this.size > canvas.height || nextY - this.size < 0) {
                this.dy = -this.dy;
                this.speed *= 0.2;
                nextY = this.y + this.dy * this.speed;
            }

            const proximityX = Math.floor(this.x / tileSize);
            const proximityY = Math.floor(this.y / tileSize);

            for (const element of buildings[proximityX][proximityY]) {
                if (element.hit >= 8) continue;

                const inX = nextX + this.size > element.x && nextX - this.size < element.x + element.size;
                const inY = nextY + this.size > element.y && nextY - this.size < element.y + element.size;

                if (inX && inY) {
                    const prevX = this.x;
                    const prevY = this.y;

                    if (prevX + this.size <= element.x || prevX - this.size >= element.x + element.size) {
                        // this.canMove = false
                        this.dx = -this.dx;
                    }

                    if (prevY + this.size <= element.y || prevY - this.size >= element.y + element.size) {
                        // this.canMove = false;
                        this.dy = -this.dy;
                    }
                    this.speed *= 0.5;
                    element.hit++;
                }
            }
            if (this.canMove) {
                this.x += this.dx * this.speed;
                this.y += this.dy * this.speed;
            }
            if (this.speed < 0.9) this.canMove = false;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = "rgb(255, 255, 0)";
            ctx.fill();
        }
    }

    function drawMap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < canvas.width; i += tileSize) {
            drawGrid(i);
            let row = [];
            for (let j = 0; j < canvas.height; j += tileSize) {
                let color;
                if (i / tileSize == X && j / tileSize == Y) {
                    color = "cyan";
                } else {
                    color = gridColor;
                }

                const gardenX = i + gap;
                const gardenY = j + gap;
                const centerX = i + tileSize / 2;
                const centerY = j + tileSize / 2;

                drawGarden(gardenX, gardenY, color);

                const a1 = Math.random() * Math.PI * 2;
                const a2 = a1 + Math.PI / 3;
                const cond1 = centerX == X * tileSize + tileSize / 2 && centerY == Y * tileSize + tileSize / 2;
                const cond2 = centerX == hubX * tileSize + tileSize / 2 && centerY == hubY * tileSize + tileSize / 2;

                if (!cond1 && !cond2) {
                    const tower = new Towers(centerX, centerY, arcRad, a1, a2);
                    tower.gridX = i / tileSize;
                    tower.gridY = j / tileSize;
                    tower.draw(ctx);
                    towers.push(tower);
                }

                // creating buildings
                const unit = gardenSize / 2.7;
                const buildingsInGarden = [];

                buildingsInGarden.push({ x: centerX - unit / 2, y: centerY - unit / 2, size: unit, hit: 0, destroyed: false, color: "rgb(0, 0, 0)" })
                for (let k = 0; k < 5; k++) {
                    const a = Math.floor(Math.random() * 256);
                    const b = Math.floor(Math.random() * 256);
                    const c = Math.floor(Math.random() * 256);
                    const bx = gardenX + Math.random() * (gardenSize - unit);
                    const by = gardenY + Math.random() * (gardenSize - unit);
                    ctx.fillStyle = `rgba(0,0,0,0.95)`;
                    ctx.fillRect(bx, by, unit, unit);

                    ctx.strokeStyle = 'rgb(0, 213, 255)';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(bx, by, unit, unit);

                    buildingsInGarden.push({ x: bx, y: by, size: unit, hit: 0, destroyed: false, color: `rgba(0, 0, 0, 0.95)` });
                }
                row.push(buildingsInGarden);
            }
            buildings.push(row);
        }

        // to create keys 
        for (let i = 0; i < 50; i++) {
            const key = new Key(i);
            key.draw();
            keys.push({ key: key, captured: false });
        }
    }

    function drawGrid(pos) {
        ctx.lineWidth = 40;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        // ctx.setLineDash([22, 26]);

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();

        // ctx.setLineDash([]);
    }

    function drawGarden(x, y, color, base = false, hub = false) {
        if (base) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + tileSize / 2, y + tileSize / 2, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "20px Orbitron";
            ctx.fillStyle = "rgb(255, 73, 73)";
            ctx.fillText("B A S E" ,x + tileSize / 2 - 40, y + tileSize / 2 + 5);
        }
        else if (hub) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + tileSize / 2, y + tileSize / 2, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "20px Orbitron";
            ctx.fillStyle = "rgb(255, 255, 0)";
            ctx.fillText("H U B" ,x + tileSize / 2 - 28, y + tileSize / 2 + 5);
        }
        else {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, gardenSize, gardenSize);

            const cellSize = gardenSize / 20;
            ctx.strokeStyle = 'rgb(0, 156, 5)';
            ctx.lineWidth = 1.5;

            for (let i = 1; i < 20; i++) {
                ctx.beginPath();
                ctx.moveTo(x + i * cellSize, y);
                ctx.lineTo(x + i * cellSize, y + gardenSize);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x, y + i * cellSize);
                ctx.lineTo(x + gardenSize, y + i * cellSize);
                ctx.stroke();
            }

            // Road Highlight Lines
            ctx.strokeStyle = 'rgb(255, 255, 0)';
            ctx.setLineDash([1, 10]);
            ctx.strokeRect(x - 5, y - 5, gardenSize + 2 * 5, gardenSize + 2 * 5);
            ctx.setLineDash([]);
        }
    }

    function drawSaved() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < canvas.width; i += tileSize) {
            drawGrid(i);
            for (let j = 0; j < canvas.height; j += tileSize) {
                const color = (i / tileSize == X && j / tileSize == Y) ? "cyan" : (i / tileSize == hubX && j / tileSize == hubY) ? "rgb(166, 0, 255)" : gridColor;
                const gardenX = i + gap;
                const gardenY = j + gap;
                drawGarden(gardenX, gardenY, color);
            }
        }


        for (let i = 0; i < buildings.length; i++) {
            for (let j = 0; j < buildings[i].length; j++) {
                for (const building of buildings[i][j]) {
                    if (building.hit < 8) {
                        ctx.fillStyle = `rgba(0,0,0,0.95)`;
                        ctx.fillRect(building.x, building.y, building.size, building.size);

                        ctx.strokeStyle = 'rgb(0, 208, 255)';
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(building.x, building.y, building.size, building.size);

                        const cellSize = building.size / 5;
                        ctx.strokeStyle = 'rgb(255, 255, 255)';
                        ctx.lineWidth = 0.15;

                        for (let i = 1; i < 5; i++) {
                            ctx.beginPath();
                            ctx.moveTo(building.x + i * cellSize, building.y);
                            ctx.lineTo(building.x + i * cellSize, building.y + building.size);
                            ctx.stroke();

                            ctx.beginPath();
                            ctx.moveTo(building.x, building.y + i * cellSize);
                            ctx.lineTo(building.x + building.size, building.y + i * cellSize);
                            ctx.stroke();
                        }

                    }
                    else building.destroyed = true;
                }
            }
        }

        drawGarden(X * tileSize, Y * tileSize, "blue", true, false);
        drawGarden(hubX * tileSize, hubY * tileSize, "purple", false, true);

        towers.forEach(arc => {             // Doubt : Why is this even neccessary??
            if (arc.destroyed) return;
            ctx.beginPath();
            ctx.moveTo(arc.x, arc.y);
            ctx.arc(arc.x, arc.y, arc.r, arc.a1, arc.a2, false);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        keys.forEach((element) => {
            if (element.captured) return;
            element.key.draw();
            element.key.capture();
        });
    }


    function drawPlayer() {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
        ctx.fill();

        const move = () => {
            let canMove = true;
            let step = 2.5;

            let proximityX = Math.floor(player.x / tileSize);
            let proximityY = Math.floor(player.y / tileSize);

            let nextX = player.x;
            let nextY = player.y;

            if (keysPressed["ArrowUp"]) nextY -= step;
            if (keysPressed["ArrowDown"]) nextY += step;
            if (keysPressed["ArrowLeft"]) nextX -= step;
            if (keysPressed["ArrowRight"]) nextX += step;
            if (nextX - player.size < 0 || nextY - player.size < 0 || nextX + player.size > canvas.width || nextY + player.size > canvas.height) return;
            for (const element of buildings[proximityX][proximityY]) {
                if (element.hit < 5) {
                    const inX = nextX + player.size > element.x && nextX - player.size < element.x + element.size;
                    const inY = nextY + player.size > element.y && nextY - player.size < element.y + element.size;
                    if (inX && inY)
                        canMove = false;
                }
            }

            if (canMove) {
                player.x = nextX;
                player.y = nextY;
            }
        }
        move();

        const normalize = (angle) => (angle + Math.PI * 2) % (Math.PI * 2);

        for (const tower of towers) {
            if (tower.destroyed) continue;

            const dx = player.x - tower.x;
            const dy = player.y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < tower.r + player.size) {
                const theta = normalize(Math.atan2(dy, dx));
                let a1 = normalize(tower.a1);
                let a2 = normalize(tower.a2);

                const inCone = (a1 < a2) ? theta >= a1 && theta <= a2 : theta >= a1 || theta <= a2;

                if (inCone) {
                    console.log("health decrease");
                    player.health -= 0.05;
                    break;
                }
            }
        }
    }

    function updateStatus() {
        systemHealth -= 1 / 1000;
        const onHub = Math.floor(player.x / tileSize) == hubX && Math.floor(player.y / tileSize) == hubY;
        const onBase = Math.floor(player.x / tileSize) == X && Math.floor(player.y / tileSize) == Y;

        if (onHub && player.noOfKeys >= 5) {
            player.noOfKeys -= 5;
            player.shards++;
        }

        if (onBase && player.shards > 0) {
            systemHealth += 10;
            player.shards--;
        }

        systemHealth = Math.min(systemHealth, 100);

        document.getElementById("plHealth").textContent = `Player's Health : ${Math.floor(player.health)}`;
        document.getElementById("sysHealth").textContent = `System's Health : ${Math.floor(systemHealth)}`;
        document.getElementById("noOfKeys").textContent = `Keys : ${player.noOfKeys}`;
        document.getElementById("shards").textContent = `Shards : ${player.shards}`;
        document.getElementById("shardsDel").textContent = `Shards Delivered : ${player.shards}`;


        if (systemHealth >= 100) {
            alert("YOU WIN! AUREX is Restored!");
        }
        else if (systemHealth <= 0) {
            alert("SYSTEM DIED!");
        }
        if (player.health <= 0) {
            alert("YOU DIED");
        }
    }

    function updateCamera() {
        camera.width = window.innerWidth;
        camera.height = window.innerHeight;

        camera.x = player.x - camera.width / 2;
        camera.y = player.y - camera.height / 2;

        camera.x = Math.max(0, Math.min(camera.x, canvas.width - camera.width));
        camera.y = Math.max(0, Math.min(camera.y, canvas.height - camera.height));
    }


    function animate() {
        requestAnimationFrame(animate);
        if (isPaused) return;

        updateCamera();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        drawSaved();
        drawPlayer();
        updateStatus();

        towers.forEach(element => {
            if (!element.destroyed)
                element.rotate(ctx);
        });
        bullets.forEach(element => {
            if (element.canMove) {
                element.shoot();
                element.draw(ctx);
            }
        });

        ctx.restore();
    }

    drawMap();
    animate();
    drawPlayer();


    window.addEventListener("keydown", (e) => {
        keysPressed[e.key] = true;
    });

    window.addEventListener("keyup", (e) => {
        keysPressed[e.key] = false;
    });

    canvas.addEventListener("click", (event) => {
        const dx = event.x + camera.x - player.x;
        const dy = event.y + camera.y - player.y;
        const X = dx / Math.sqrt(dx * dx + dy * dy);
        const Y = dy / Math.sqrt(dx * dx + dy * dy);

        const bullet = new Bullet(player.x, player.y, X, Y);
        bullets.push(bullet);
    });

    window.addEventListener("resize", () => {
        canvas.width = 3120;
        canvas.height = 1680;
        updateCamera();
        drawSaved();
    });

    //stops browser from scrolling
    window.addEventListener("keydown", (e) => {
        keysPressed[e.key] = true;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
            e.preventDefault();
        }
    });

    // Pause, Resume and Reset
    const pause = document.getElementById("Pause");
    const resume = document.getElementById("Resume");
    const reset = document.getElementById("Reset");

    pause.addEventListener("click", () => {
        isPaused = true;
    });

    resume.addEventListener("click", () => {
        isPaused = false;
    });

    reset.addEventListener("click", () => {
        player.health = 100;
        player.noOfKeys = 0;
        player.shards = 0;
        systemHealth = 51;

        for (const tower of towers) {
            tower.destroyed = false;
        }

        for (const row of buildings) {
            for (const cell of row) {
                for (const building of cell) {
                    building.hit = 0;
                    building.destroyed = false;
                }
            }
        }

        for (const key of keys) {
            key.captured = false;
        }
        drawSaved();
    });
});