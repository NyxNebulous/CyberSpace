window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    const tileSize = 240;
    const gap = 35;
    const gridColor = "rgba(17, 255, 0, 0.91)";
    const gardenSize = tileSize - 2 * gap;
    const arcRad = gardenSize / 1.15;
    const keysPressed = {};

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
    let camera = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
    const player = { x: X * tileSize + tileSize / 2, y: Y * tileSize + 1.1*tileSize / 2, size: 12, color: "white", noOfKeys: 0, step: 3, shards: 0, health: 100, shardsDel: 0 };
    let buildings = [];
    let towers = [];
    let bullets = [];
    let keys = [];
    let bots = [];
    let healthPacks = [];
    let shields = [];
    let speedBoosters = [];
    let hostage = [];
    let cooldown = 0;

    // local storage
    if (!localStorage.getItem("highScore")) {
        localStorage.setItem("highScore", "0");
    }

    const constructionIcon = new Image();
    constructionIcon.src = "Assets/construction.png";

    const shieldIcon = new Image();
    shieldIcon.src = "Assets/shield.png";

    const healIcon = new Image();
    healIcon.src = "Assets/first-aid.png";

    const keyIcon = new Image();
    keyIcon.src = "Assets/crystal.png";

    const speedIcon = new Image();
    speedIcon.src = "Assets/flash.png";

    const baseIcon = new Image();
    baseIcon.src = "Assets/base.png";

    const shieldSound = new Audio("Assets/shields.mp3");
    const healSound = new Audio("Assets/heal.mp3");
    const speedSound = new Audio("Assets/speed.mp3");

    class Towers {
        constructor(x, y, r, a1, a2) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.a1 = a1;
            this.a2 = a2;
            this.health = 100;
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
            if (towerDest) {
                this.destroyed = true;
                this.health = 0;
            }
            else this.draw(ctx);
        }

        reconstruct() {
            if (!this.destroyed) return;

            if (!this.rebuilding) {
                this.rebuilding = true;
                this.health = 0;
            }

            this.health += 0.015;

            if (this.health >= 100) {
                this.health = 100;
                this.rebuilding = false;
                this.destroyed = false;
                for (const element of buildings[this.gridX][this.gridY]) {
                    if (this.x > element.x && this.x < element.x + element.size && this.y < element.y + element.size && this.y > element.y) {
                        element.destroyed = false;
                        element.hit = 0;
                    }
                }
            }

        }

    }

    class Bot {
        constructor(x, y, mutate) {
            this.x = x;
            this.y = y;

            this.baseSize = mutate.baseSize;
            this.baseColor = mutate.baseColor;
            this.baseSpeed = mutate.baseSpeed;

            this.chaseSize = mutate.chaseSize;
            this.chaseSpeed = mutate.chaseSpeed;
            this.chaseColor = mutate.chaseColor;

            this.shootInterval = mutate.shootInterval;
            this.takeDamage = mutate.takeDamage;
            this.giveDamage = mutate.giveDamage;

            this.size = mutate.baseSize;
            this.speed = mutate.baseSpeed;
            this.color = mutate.baseColor;
            this.type = mutate.type;
            this.range = mutate.range;

            this.dx = 0;
            this.dy = 0;
            this.chasing = false;
            this.health = 100;
            this.dead = false;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            const barWidth = 20;
            const barHeight = 3;
            const percent = this.health / 100;
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 8, barWidth, barHeight);
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.size - 8, barWidth * percent, barHeight);
        }

        move() {

            ctx.fillStyle = this.color.replace("rgb", "rgba").replace(")", ", 0.1)");
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fill();

            if (this.returningToGrid) {
                const targetX = Math.round(this.x / tileSize) * tileSize;
                const targetY = Math.round(this.y / tileSize) * tileSize;

                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const moveX = (dx / dist) * this.speed;
                const moveY = (dy / dist) * this.speed;

                if (dist < 1) {
                    this.x = targetX;
                    this.y = targetY;
                    this.returningToGrid = false;
                    this.dx = 0;
                    this.dy = 0;
                } else {
                    this.x += moveX;
                    this.y += moveY;
                }
                return;
            }

            const crossRoad = Math.floor(this.x) % tileSize === 0 && Math.floor(this.y) % tileSize === 0;

            if (crossRoad && !this.chasing) {
                let dir = Math.random() < 0.5 ? "x" : "y";
                let dirVal = Math.random() < 0.5 ? -1 : 1;

                if ((dir === "x" && dirVal === -this.dx) || (dir === "y" && dirVal === -this.dy)) {
                    dirVal *= -1;
                }

                if (this.x <= 0 && dir === "x" && dirVal === -1) dirVal = 1;
                if (this.y <= 0 && dir === "y" && dirVal === -1) dirVal = 1;
                if (this.x >= canvas.width - tileSize && dir === "x" && dirVal === 1) dirVal = -1;
                if (this.y >= canvas.height - tileSize && dir === "y" && dirVal === 1) dirVal = -1;

                this.dx = dir === "x" ? dirVal : 0;
                this.dy = dir === "y" ? dirVal : 0;
            }

            if (!this.chasing) {
                this.x += this.dx * this.speed;
                this.y += this.dy * this.speed;
            }

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.range) {
                this.chasing = true;
                this.speed = this.chaseSpeed;
                this.color = this.chaseColor;
                this.size = this.chaseSize;

                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;

            } else if (distance > this.range && this.chasing) {
                this.chasing = false;
                this.size = this.baseSize;
                this.speed = this.baseSpeed;
                this.color = this.baseColor;
                this.returningToGrid = true;
            }

            if (this.chasing && ++cooldown % this.shootInterval == 0) {
                cooldown = 0;
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const X = dx / Math.sqrt(dx * dx + dy * dy);
                const Y = dy / Math.sqrt(dx * dx + dy * dy);

                const bullet = new Shot(this.x, this.y, X, Y, this.giveDamage);
                hostage.push(bullet);
            }
        }
    }

    class LightBot extends Bot {
        constructor(x, y) {
            super(x, y, {
                baseSize: 8,
                baseSpeed: 1,
                baseColor: "rgb(255, 255, 0)",
                chaseColor: "rgb(255, 115, 0)",
                chaseSize: 11,
                chaseSpeed: 1.8,
                shootInterval: 35,
                takeDamage: 15,
                giveDamage: 0.3,
                range: tileSize / 1.5
            });
        }
    }

    class HeavyBot extends Bot {
        constructor(x, y) {
            super(x, y, {
                baseSize: 11,
                baseSpeed: 0.5,
                baseColor: "rgb(78, 225, 255)",
                chaseColor: "rgb(0, 0, 158)",
                chaseSize: 13,
                chaseSpeed: 1.2,
                shootInterval: 60,
                takeDamage: 5,
                giveDamage: 0.8,
                range: tileSize / 1.5
            });
        }
    }

    class SniperBot extends Bot {
        constructor(x, y) {
            super(x, y, {
                baseSize: 7,
                baseSpeed: 0.5,
                baseColor: "rgb(172, 78, 255)",
                chaseColor: "rgb(82, 0, 182)",
                chaseSize: 10,
                chaseSpeed: 0,
                shootInterval: 250,
                takeDamage: 15,
                giveDamage: 2,
                range: tileSize * 1.5
            });
        }
    }

    class Shot {
        constructor(x, y, dx, dy, harm) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.speed = 7;
            this.size = 3;
            this.canMove = true;
            this.giveDamage = harm;
        }

        shoot() {

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= player.size) {
                player.health -= this.giveDamage;
                this.canMove = false;
            }
            if (dist > canvas.width) {
                this.canMove = false;
            }
            if (this.canMove) {
                this.x += this.dx * this.speed;
                this.y += this.dy * this.speed;
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = "rgb(255, 91, 69)";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.stroke;
        }
    }

    class Key {
        constructor(index) {

            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.r = 15;
            this.index = index;
        }

        draw() {

            ctx.save();
            ctx.shadowColor = "black";
            ctx.shadowBlur = "5";
            ctx.drawImage(keyIcon, this.x - this.r / 2, this.y - this.r / 2, this.r, this.r);
            ctx.restore();
        }

        capture() {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.r + player.size) {
                keys[this.index].captured = true;
                player.noOfKeys++;
                const collectSound = new Audio("Assets/scale.mp3");
                collectSound.play();
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
                this.speed *= 0.5;
                nextX = this.x + this.dx * this.speed;
            }

            if (nextY + this.size > canvas.height || nextY - this.size < 0) {
                this.dy = -this.dy;
                this.speed *= 0.5;
                nextY = this.y + this.dy * this.speed;
            }

            const proximityX = Math.floor(this.x / tileSize);
            const proximityY = Math.floor(this.y / tileSize);

            if (buildings[proximityX][proximityY]) {
                for (const element of buildings[proximityX][proximityY]) {
                    if (element.hit >= 5) continue;

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

        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = "rgb(255, 255, 0)";
            ctx.fill();
        }
    }

    class Shield {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = 24;
        }

        draw() {
            ctx.save();
            ctx.shadowColor = "cyan";
            ctx.shadowBlur = 5;
            ctx.drawImage(shieldIcon, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.restore();
        }

        collect() {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.size / 2 + player.size) {
                shieldSound.play();
                player.shielded = true;
                setTimeout(() => player.shielded = false, 6000);
                return true;
            }
            return false;
        }
    }

    class HealthPack {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = 24;
        }

        draw() {
            ctx.save();
            ctx.shadowColor = 'green';
            ctx.shadowBlur = 5;
            ctx.drawImage(healIcon, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.restore();
        }

        collect() {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.size / 2 + player.size) {
                healSound.play();
                player.health = Math.min(player.health + 25, 100);
                return true;
            }
            return false;
        }
    }

    class SpeedBooster {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = 24;
        }

        draw() {
            ctx.drawImage(speedIcon, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }

        collect() {
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.size / 2 + player.size) {
                speedSound.play();
                player.step = 6;
                setTimeout(() => player.step = 2.5, 5000);
                return true;
            }
            return false;
        }
    }

    function generateMap() {
        for (let i = 0; i < canvas.width; i += tileSize) {
            let row = [];
            for (let j = 0; j < canvas.height; j += tileSize) {
                const gardenX = i + gap;
                const gardenY = j + gap;
                const centerX = i + tileSize / 2;
                const centerY = j + tileSize / 2;

                const a1 = Math.random() * Math.PI * 2;
                const a2 = a1 + Math.PI / 3;
                const cond1 = centerX == X * tileSize + tileSize / 2 && centerY == Y * tileSize + tileSize / 2;
                const cond2 = centerX == hubX * tileSize + tileSize / 2 && centerY == hubY * tileSize + tileSize / 2;

                if (!cond1 && !cond2) {
                    const tower = new Towers(centerX, centerY, arcRad, a1, a2);
                    tower.gridX = i / tileSize;
                    tower.gridY = j / tileSize;
                    towers.push(tower);
                }

                // creating buildings
                const unit = gardenSize / 2.7;
                const buildingsInGarden = [];

                buildingsInGarden.push({ x: centerX - unit / 2, y: centerY - unit / 2, size: unit, hit: 0, destroyed: false, color: "rgb(0, 0, 0)" })
                for (let k = 0; k < 5; k++) {
                    const bx = gardenX + Math.random() * (gardenSize - unit);
                    const by = gardenY + Math.random() * (gardenSize - unit);

                    buildingsInGarden.push({ x: bx, y: by, size: unit, hit: 0, destroyed: false, color: `rgba(0, 0, 0, 0.95)` });
                }
                row.push(buildingsInGarden);
            }
            buildings.push(row);
        }

        for (let i = 0; i < 54; i++) {
            const key = new Key(i);
            keys.push({ key: key, captured: false });
        }

        for (let i = 0; i < 4; i++) {
            const bot = new LightBot(hubX * tileSize, hubY * tileSize);
            bots.push(bot);
        }

        for (let i = 0; i < 3; i++) {
            const bot = new HeavyBot(hubX * tileSize, hubY * tileSize);
            bots.push(bot);
        }

        for (let i = 0; i < 2; i++) {
            const bot = new SniperBot(hubX * tileSize, hubY * tileSize);
            bots.push(bot);
        }
        console.log(bots);
        for (let i = 0; i < 7; i++) {
            const pack = new HealthPack();
            healthPacks.push({ pack: pack, collected: false });
        }

        for (let i = 0; i < 3; i++) {
            const shield = new Shield();
            shields.push({ shield: shield, collected: false });
        }
        
        for (let i = 0; i < 4; i++) {
            const booster = new SpeedBooster();
            speedBoosters.push({ booster: booster, collected: false });
        }


    }

    function drawGrid(pos) {
        ctx.lineWidth = 40;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
    }

    function drawGarden(x, y, color, base = false, hub = false) {
        if (base) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + tileSize / 2, y + tileSize / 2, 70, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "20px Orbitron";
            ctx.fillStyle = "rgb(255, 73, 73)";
            ctx.drawImage(baseIcon, x + tileSize / 2 - 37.5, y + tileSize / 2 - 50, 75, 75);
            ctx.fillText("B A S E", x + tileSize / 2 - 40, y + tileSize / 2 + 50);
        }
        else if (hub) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + tileSize / 2, y + tileSize / 2, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = "20px Orbitron";
            ctx.fillStyle = "rgb(255, 255, 0)";
            ctx.fillText("H U B", x + tileSize / 2 - 28, y + tileSize / 2 + 5);
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
        const camRight = camera.x + camera.width;
        const camBottom = camera.y + camera.height;

        for (let i = 0; i < canvas.width; i += tileSize) {
            drawGrid(i);
            for (let j = 0; j < canvas.height; j += tileSize) {
                const color = (i / tileSize == X && j / tileSize == Y) ? "cyan" : (i / tileSize == hubX && j / tileSize == hubY) ? "rgb(166, 0, 255)" : gridColor;
                const gardenX = i + gap;
                const gardenY = j + gap;
                if (
                    gardenX + tileSize < camera.x ||
                    gardenX > camRight ||
                    gardenY + tileSize < camera.y ||
                    gardenY > camBottom
                ) continue;
                drawGarden(gardenX, gardenY, color);
            }
        }

        for (let i = 0; i < buildings.length; i++) {
            for (let j = 0; j < buildings[i].length; j++) {
                for (const building of buildings[i][j]) {
                    if (
                        building.x + building.size < camera.x ||
                        building.x > camRight ||
                        building.y + building.size < camera.y ||
                        building.y > camBottom
                    ) continue;
                    if (i == X && j == Y) building.hit = 5;
                    if (building.hit < 5) {
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
                    } else {
                        building.destroyed = true;
                    }
                }
            }
        }

        drawGarden(X * tileSize, Y * tileSize, "whitesmoke", true, false);
        drawGarden(hubX * tileSize, hubY * tileSize, "purple", false, true);

        towers.forEach(arc => {
            if (arc.destroyed) return;

            if (
                arc.x + arc.r < camera.x ||
                arc.x - arc.r > camRight ||
                arc.y + arc.r < camera.y ||
                arc.y - arc.r > camBottom
            ) return;

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

        keys.forEach(element => {
            if (element.captured) return;
            if (
                Math.abs(element.key.x - player.x) > camera.width / 1.5 ||
                Math.abs(element.key.y - player.y) > camera.height / 1.5
            ) return;

            element.key.draw();
            element.key.capture();
        });

        healthPacks.forEach(element => {
            if (!element.collected &&
                Math.abs(element.pack.x - player.x) < camera.width / 1.5 &&
                Math.abs(element.pack.y - player.y) < camera.height / 1.5
            ) {
                element.pack.draw();
                if (element.pack.collect()) element.collected = true;
            }
        });

        shields.forEach(element => {
            if (!element.collected &&
                Math.abs(element.shield.x - player.x) < camera.width / 1.5 &&
                Math.abs(element.shield.y - player.y) < camera.height / 1.5
            ) {
                element.shield.draw();
                if (element.shield.collect()) element.collected = true;
            }
        });

        speedBoosters.forEach(element => {
            if (!element.collected &&
                Math.abs(element.booster.x - player.x) < camera.width / 1.5 &&
                Math.abs(element.booster.y - player.y) < camera.height / 1.5
            ) {
                element.booster.draw();
                if (element.booster.collect()) element.collected = true;
            }
        });

        bots = bots.filter(bot => !bot.dead);
        bots.forEach(bot => {
            bot.draw();
            bot.move();

            for (let bullet of bullets) {
                const dx = bullet.x - bot.x;
                const dy = bullet.y - bot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bot.size + bullet.size) {
                    bullet.canMove = false;
                    bot.health -= bot.takeDamage;
                    if (bot.health <= 0) {
                        bot.dead = true;
                    }
                }
            }
            bullets = bullets.filter(bullet => bullet.canMove);
        });
    }

    function drawPlayer() {

        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
        ctx.fill();

        const move = () => {
            let canMove = true;

            let proximityX = Math.floor(player.x / tileSize);
            let proximityY = Math.floor(player.y / tileSize);

            let nextX = player.x;
            let nextY = player.y;

            if (keysPressed["w"] || keysPressed["ArrowUp"]) nextY -= player.step;
            if (keysPressed["s"] || keysPressed["ArrowDown"]) nextY += player.step;
            if (keysPressed["a"] || keysPressed["ArrowLeft"]) nextX -= player.step;
            if (keysPressed["d"] || keysPressed["ArrowRight"]) nextX += player.step;

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

                if (inCone && !player.shielded) {
                    player.health -= 0.04;
                    break;
                }
            }
        }

        // health bar
        const barWidth = 30;
        const barHeight = 4;
        const healthPercent = player.health / 100;

        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.fillRect(player.x - barWidth / 2, player.y - player.size - 10, barWidth, barHeight);

        ctx.fillStyle = 'lime';
        ctx.fillRect(player.x - barWidth / 2, player.y - player.size - 10, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(player.x - barWidth / 2, player.y - player.size - 10, barWidth, barHeight);

        // Show Shards
        for (let i = 0; i < player.shards; i++) {
            ctx.fillStyle = 'cyan';
            ctx.beginPath();
            ctx.rect(player.x - 20 + i * 10, player.y + player.size + 10, 6, 6);
            ctx.fill();
        }

        // Show speed booster
        if (player.step > 3) {
            ctx.drawImage(speedIcon, player.x + 20, player.y - 10, 8, 8);
        }

        // Show shielded or not
        if (player.shielded) {
            ctx.drawImage(shieldIcon, player.x - 25, player.y - 10, 8, 8);
        }

    }

    function updateStatus() {
        systemHealth -= 1 / 1000;
        const onHub = Math.abs(hubX * tileSize + tileSize / 2 - player.x) < tileSize / 3 && Math.abs(hubY * tileSize + tileSize / 2 - player.y) < tileSize / 3;
        const onBase = Math.abs(X * tileSize + tileSize / 2 - player.x) < tileSize / 3 && Math.abs(Y * tileSize + tileSize / 2 - player.y) < tileSize / 3;

        if (onHub && player.noOfKeys >= 5) {
            player.noOfKeys -= 5;
            player.shards++;
        }

        if (onBase && player.shards > 0) {
            systemHealth += 10;
            player.shardsDel++;
            player.shards--;

            const savedScore = parseInt(localStorage.getItem("highScore"));
            if (savedScore < player.shardsDel) {
                localStorage.setItem("highScore", player.shardsDel.toString());
                console.log("new high score");
            }
        }

        systemHealth = Math.min(systemHealth, 100);

        document.getElementById("plHealth").textContent = `Player's Health : ${Math.floor(player.health)}`;
        document.getElementById("sysHealth").textContent = `System's Health : ${Math.floor(systemHealth)}`;
        document.getElementById("noOfKeys").textContent = `Keys : ${player.noOfKeys}`;
        document.getElementById("shardsDel").textContent = `Shards Delivered : ${player.shardsDel}`;
        document.getElementById("highScore").textContent = `High Score : ${localStorage.getItem("highScore")}`;


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
    let lastTime = performance.now();
    let frameCount = 0;

    function animate() {
        requestAnimationFrame(animate);
        const now = performance.now();
        frameCount++;

        if (now - lastTime >= 1000) {
            console.log("FPS:", frameCount);
            frameCount = 0;
            lastTime = now;
        }

        if (isPaused) return;

        updateCamera();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-camera.x, -camera.y);

        drawSaved();
        drawPlayer();
        updateStatus();

        towers.forEach(element => {
            if (element.destroyed) {
                element.reconstruct();

                if (element.rebuilding) {
                    const barWidth = 45;
                    const barHeight = 8;

                    ctx.fillStyle = "rgb(150, 0, 0)";
                    ctx.fillRect(element.x - barWidth / 2, element.y - 20, barWidth, barHeight);

                    ctx.fillStyle = "rgb(0, 166, 255)";
                    ctx.fillRect(element.x - barWidth / 2, element.y - 20, barWidth * element.health / 100, barHeight);

                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(element.x - barWidth / 2, element.y - 20, barWidth, barHeight);

                    ctx.drawImage(constructionIcon, element.x - 20, element.y, 40, 40);
                }
            }
            if (!element.destroyed)
                element.rotate(ctx);
        });
        bullets.forEach(element => {
            if (element.canMove) {
                element.shoot();
                element.draw(ctx);
            }
        });
        bullets = bullets.filter(bullet => bullet.canMove);

        hostage.forEach(element => {
            if (element.canMove) {
                element.shoot();
                element.draw(ctx);
            }
        });
        hostage = hostage.filter(bullet => bullet.canMove);

        ctx.restore();
    }

    generateMap();
    animate();


    window.addEventListener("keydown", (e) => {
        keysPressed[e.key] = true;
    });

    window.addEventListener("keyup", (e) => {
        keysPressed[e.key] = false;
    });

    canvas.addEventListener("click", (event) => {
        if (isPaused) return;
        const dx = event.x + camera.x - player.x;
        const dy = event.y + camera.y - player.y;
        const X = dx / Math.sqrt(dx * dx + dy * dy);
        const Y = dy / Math.sqrt(dx * dx + dy * dy);

        const bullet = new Bullet(player.x, player.y, X, Y);
        bullets.push(bullet);
        const shootSound = new Audio("Assets/shoot.mp3");
        shootSound.play();
    });

    window.addEventListener("resize", () => {
        canvas.width = 3120;
        canvas.height = 1680;
        updateCamera();
        drawSaved();
    });

    //stops browser from scrolling
    // window.addEventListener("keydown", (e) => {
    //     keysPressed[e.key] = true;
    //     if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    //         e.preventDefault();
    //     }
    // });

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
        player.shardsDel = 0;
        systemHealth = 51;

        for (const tower of towers) {
            tower.destroyed = false;
            tower.health = 100;
            tower.rebuilding = false;
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

        for (const shield of shields) {
            shield.collected = false;
        }

        for (const pack of healthPacks) {
            pack.collected = false;
        }

        player.x = tileSize * 2;
        player.y = tileSize * 2;
        drawSaved();
    });
});