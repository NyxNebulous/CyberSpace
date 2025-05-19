const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const tileSize = 240;
const gap = 35;
const gridColor = "#1BFC06";
const gardenSize = tileSize - 2 * gap;
const arcRad = gardenSize / 1.15;
const keysPressed = {};

canvas.width = 3120;
canvas.height = 1680;

const X = Math.floor(Math.random() * (Math.floor(canvas.width / tileSize)));
const Y = Math.floor(Math.random() * (Math.floor(canvas.height / tileSize)));

const hubX = Math.floor(Math.random() * (Math.floor(canvas.width / tileSize)));
const hubY = Math.floor(Math.random() * (Math.floor(canvas.height / tileSize)));

const player = { x: tileSize, y: tileSize, size: 12, color: "white", noOfKeys: 0 };
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
        this.r = 5;
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
        this.speed = 5;
        this.size = 4;
        this.canMove = true;
    }

    shoot() {
        let nextX = this.x;
        let nextY = this.y;

        nextX += this.dx * this.speed;
        nextY += this.dy * this.speed;

        if (nextX + this.size > canvas.width || nextX - this.size < 0) {
            this.dx = -this.dx;
            this.speed *= 0.5;
        }
        if (nextY + this.size > canvas.height || nextY - this.size < 0) {
            this.dy = -this.dy;
            this.speed *= 0.5;
        }

        let proximityX = Math.floor(this.x / tileSize);
        let proximityY = Math.floor(this.y / tileSize);

        for (const element of buildings[proximityX][proximityY]) {
            const inX = nextX + this.size > element.x && nextX - this.size < element.x + element.size;
            const inY = nextY + this.size > element.y && nextY - this.size < element.y + element.size;
            if (element.hit < 5) {
                if (inX && inY) {
                    this.canMove = false;
                    element.hit++;
                }
            }
        }
        if (this.canMove) {
            this.x = nextX;
            this.y = nextY;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "yellow";
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

            buildingsInGarden.push({ x: centerX - unit/2, y: centerY - unit/2, size: unit, hit: 0, destroyed: false })
            for (let k = 0; k < 5; k++) {
                const bx = gardenX + Math.random() * (gardenSize - unit);
                const by = gardenY + Math.random() * (gardenSize - unit);
                ctx.fillStyle = "black";
                ctx.fillRect(bx, by, unit, unit);
                buildingsInGarden.push({ x: bx, y: by, size: unit, hit: 0, destroyed: false });
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

function drawGarden(x, y, color, base = false, hub = false) {
    if (base) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    else if (hub) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + tileSize / 2, y + tileSize / 2, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, gardenSize, gardenSize);
    }
}

function drawSaved() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < canvas.width; i += tileSize) {
        drawGrid(i);
        for (let j = 0; j < canvas.height; j += tileSize) {
            const color = (i / tileSize == X && j / tileSize == Y) ? "cyan" : (i / tileSize == hubX && j / tileSize == hubY) ? "magenta" : gridColor;
            const gardenX = i + gap;
            const gardenY = j + gap;
            drawGarden(gardenX, gardenY, color);
        }
    }

    for (let i = 0; i < buildings.length; i++) {
        for (let j = 0; j < buildings[i].length; j++) {
            for (const building of buildings[i][j]) {
                if (building.hit < 5) {
                    ctx.fillStyle = "black";
                    ctx.fillRect(building.x, building.y, building.size, building.size);
                }
                else building.destroyed = true;
            }
        }
    }

    drawGarden(X * tileSize, Y * tileSize, "blue", true, false);
    drawGarden(hubX * tileSize, hubY * tileSize, "purple", false, true);

    towers.forEach(arc => {
        if (arc.destroyed) return;
        ctx.beginPath();
        ctx.moveTo(arc.x, arc.y);
        ctx.arc(arc.x, arc.y, arc.r, arc.a1, arc.a2, false);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    keys.forEach((element) => {
        if (element.captured) return;
        element.key.draw();
        element.key.capture();
    });
}

function animateTowers() {
    requestAnimationFrame(animateTowers);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSaved();
    drawPlayer();
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

}

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

canvas.addEventListener("click", (event) => {
    const dx = event.x - player.x;
    const dy = event.y - player.y;
    const X = dx / Math.sqrt(dx * dx + dy * dy);
    const Y = dy / Math.sqrt(dx * dx + dy * dy);

    const bullet = new Bullet(player.x, player.y, X, Y);
    bullets.push(bullet);
});

window.addEventListener("resize", () => {
    canvas.width = 3120;
    canvas.height = 1680;
    drawSaved();
});

//stops browser from scrolling
window.addEventListener("keydown", (e) => {
    keysPressed[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
    }
});
