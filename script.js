const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const tileSize = 240;
const gap = 35;
const gridColor = "#1BFC06";
const gardenSize = tileSize - 2 * gap;
const arcRad = gardenSize / 1.4;
const mapWidth = 3120;
const mapHeight = 1560;
const keysPressed = {};


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = { x: canvas.width / 2, y: canvas.height / 2, size: 10, color: "blue" };
let buildings = [];
let towers = [];
let bullets = [];

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawSaved();
});

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
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, this.r, this.a1, this.a2, false);
        ctx.closePath();

        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    rotate(ctx) {
        const vel = Math.PI / 500;
        this.a1 += vel;
        this.a2 += vel;
        this.draw(ctx);
    }

}

function drawMap() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < mapWidth; i += tileSize) {
        drawGrid(i);
        let row = [];
        for (let j = 0; j < mapHeight; j += tileSize) {
            const gardenX = i + gap;
            const gardenY = j + gap;
            const centerX = i + tileSize / 2;
            const centerY = j + tileSize / 2;

            drawGarden(gardenX, gardenY);

            const a1 = Math.random() * Math.PI * 2;
            const a2 = a1 + Math.PI / 3;
            const tower = new Towers(centerX, centerY, arcRad, a1, a2);
            tower.draw(ctx);
            towers.push(tower);

            // creating buildings
            const unit = gardenSize / 2.5;
            const buildingsInGarden = [];

            for (let k = 0; k < 5; k++) {
                const bx = gardenX + Math.random() * (gardenSize - unit);
                const by = gardenY + Math.random() * (gardenSize - unit);
                ctx.fillStyle = "black";
                ctx.fillRect(bx, by, unit, unit);
                buildingsInGarden.push({ x: bx, y: by, size: unit });
            }
            row.push(buildingsInGarden);
        }
        buildings.push(row);
    }
}

function drawGrid(pos) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = gridColor;

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
}

function drawGarden(x, y) {
    ctx.fillStyle = gridColor;
    ctx.fillRect(x, y, gardenSize, gardenSize);
}

function drawSaved() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < canvas.width; i += tileSize) {
        drawGrid(i);
        for (let j = 0; j < canvas.height; j += tileSize) {
            const gardenX = i + gap;
            const gardenY = j + gap;
            drawGarden(gardenX, gardenY);
        }
    }

    for (let i = 0; i < buildings.length; i++) {
        for (let j = 0; j < buildings[i].length; j++) {
            for (const building of buildings[i][j]) {
                ctx.fillStyle = "black";
                ctx.fillRect(building.x, building.y, building.size, building.size);
            }
        }
    }


    towers.forEach(arc => {
        ctx.beginPath();
        ctx.moveTo(arc.x, arc.y);
        ctx.arc(arc.x, arc.y, arc.r, arc.a1, arc.a2, false);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}


function animateTowers() {
    requestAnimationFrame(animateTowers);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    drawSaved();
    drawPlayer();
    towers.forEach(element => {
        element.rotate(ctx);
    });
    bullets.forEach(element => {
        element.draw(ctx);
        element.shoot();
    });
}

drawMap();
animateTowers();
drawPlayer();


window.addEventListener("keydown", (e) => {
    keysPressed[e.key] = true;
});

window.addEventListener("keyup", (e) => {
    keysPressed[e.key] = false;
});

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    const move = () => {
        let canMove = true;
        let step = 1;

        let proximityX = Math.floor(player.x / tileSize);
        let proximityY = Math.floor(player.y / tileSize);

        let nextX = player.x;
        let nextY = player.y;

        if (keysPressed["ArrowUp"]) nextY -= step;
        if (keysPressed["ArrowDown"]) nextY += step;
        if (keysPressed["ArrowLeft"]) nextX -= step;
        if (keysPressed["ArrowRight"]) nextX += step;
        if (nextX - player.size < 0 || nextY - player.size < 0 || nextX + player.size > mapWidth || nextY + player.size > mapHeight) return;
        for (const element of buildings[proximityX][proximityY]) {
            const inX = nextX + player.size > element.x && nextX - player.size < element.x + element.size;
            const inY = nextY + player.size > element.y && nextY - player.size < element.y + element.size;
            if (inX && inY) {
                canMove = false;
            }
        }

        if (canMove) {
            player.x = nextX;
            player.y = nextY;
        }
    }
    move();
}

class Bullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.speed = 5;
        this.size = 4;
    }

    shoot() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
        if (this.x + this.size > canvas.width || this.x - this.size < 0) {
            this.dx = -this.dx;
            this.speed *= 0.5;
        }
        if (this.y + this.size > canvas.height || this.y - this.size< 0) {
            this.dy = -this.dy;
            this.speed *= 0.5;
        }
        if(this.speed <= 0.25) bullets.shift();
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "yellow";
        ctx.fill();
    }
}

canvas.addEventListener("click", (event) => {
    const dx = event.x - player.x;
    const dy = event.y - player.y;
    const dirX = dx/Math.abs(dx);
    const dirY = dx/Math.abs(dy);
    const X = dx / Math.sqrt(dx * dx + dy * dy);
    const Y = dy / Math.sqrt(dx * dx + dy * dy);

    const bullet = new Bullet(player.x, player.y, X, Y);
    bullets.push(bullet);
});

console.log(bullets);