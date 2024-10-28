const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("start-button");
const livesDisplay = document.getElementById("lives");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const backgroundMusic = document.getElementById("background-music");
const hitSound = document.getElementById("hit-sound");
const gameOverSound = document.getElementById("gameover-sound");

let ballRadius = 10;
let x, y, dx, dy;
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX;
let brickRowCount = 3;
let brickColumnCount = 5;
let brickWidth, brickHeight;
let bricks = [];
let score = 0;
let lives = 3;
let timer;
let timeLimit = 60; // 限定時間60秒
let gameStarted = false;

function initializeBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1, hits: Math.floor(Math.random() * 3) + 1 }; // 隨機設置擊打次數
        }
    }
}

function getBrickColor(hits) {
    switch (hits) {
        case 3: return "orange";
        case 2: return "yellow";
        case 1: return "blue";
        default: return "gray";
    }
}

class Particle {
    constructor(x, y, dx, dy, radius, color) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.color = color;
        this.life = 1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.life -= 0.02;
    }
}

let particles = [];

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        let dx = (Math.random() - 0.5) * 2;
        let dy = (Math.random() - 0.5) * 2;
        let radius = Math.random() * 3 + 1;
        particles.push(new Particle(x, y, dx, dy, radius, color));
    }
}

function drawParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
}

function drawBricks() {
    const padding = 10; // 磚塊之間的間距
    brickWidth = (canvas.width - (brickColumnCount + 1) * padding) / brickColumnCount; // 計算磚塊寬度
    brickHeight = 20; // 磚塊高度

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                const brickX = c * (brickWidth + padding) + padding; // 計算磚塊的 X 位置
                const brickY = r * (brickHeight + padding) + padding; // 計算磚塊的 Y 位置
                b.x = brickX;
                b.y = brickY;

                ctx.fillStyle = getBrickColor(b.hits);
                ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = "white";
                ctx.font = "16px Arial";
                ctx.fillText(b.hits, brickX + brickWidth / 2 - 5, brickY + brickHeight / 2 + 5);
            }
        }
    }
}

let trail = [];

function drawBallWithTrail() {
    trail.push({ x: x, y: y });
    if (trail.length > 10) {
        trail.shift();
    }

    trail.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, ballRadius - index * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 149, 221, ${1 - index * 0.1})`;
        ctx.fill();
        ctx.closePath();
    });

    drawBall();
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.fillStyle = "#0095DD";
    ctx.fillRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.hits--;
                    if (b.hits <= 0) {
                        b.status = 0;
                        score++;
                        scoreDisplay.textContent = score;
                        createParticles(b.x + brickWidth / 2, b.y + brickHeight / 2, "orange");
                    }
                    hitSound.currentTime = 0; // 重置音效時間
                    hitSound.play(); // 播放擊打音效
                    if (score === brickRowCount * brickColumnCount) {
                        alert("恭喜！你贏了！"); // 贏得遊戲的提示
                        document.location.reload();
                    }
                }
            }
        }
    }
}

function startTimer() {
    timer = setInterval(() => {
        timeLimit--;
        timerDisplay.textContent = timeLimit;
        if (timeLimit <= 0) {
            endGame("時間到，遊戲結束！");
        }
    }, 1000);
}

function endGame(message) {
    clearInterval(timer);
    gameOverSound.play();
    alert(message);
    document.location.reload();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBallWithTrail();
    drawPaddle();
    drawParticles();
    collisionDetection();

    // 邊界檢測
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            lives--;
            livesDisplay.textContent = lives;
            if (!lives) {
                endGame("遊戲結束，請重新開始！");
            } else {
                resetBall();
            }
        }
    }

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
}

function resetBall() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 2;
    dy = -2;
    paddleX = (canvas.width - paddleWidth) / 2;
}

startButton.addEventListener("click", () => {
    // 設定初始值
    resetBall();
    initializeBricks();
    backgroundMusic.play();
    backgroundMusic.volume = 0.5; // 設定音量
    score = 0;
    lives = 3;
    timeLimit = 60; // 重置時間
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    timerDisplay.textContent = timeLimit;

    gameStarted = true;
    startTimer(); // 開始計時
    draw();
});

// 控制擋板
document.addEventListener("mousemove", (e) => {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
});
class Ball {
    constructor(x, y, radius, dx, dy, color = "#0095DD") {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.trail = [];
    }

    draw(ctx) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) this.trail.shift();

        this.trail.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius - index * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 149, 221, ${1 - index * 0.1})`;
            ctx.fill();
            ctx.closePath();
        });

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.x += this.dx;
        this.y += this.dy;
    }

    reverseX() {
        this.dx = -this.dx;
    }

    reverseY() {
        this.dy = -this.dy;
    }

    resetPosition(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight - 30;
        this.dx = 2;
        this.dy = -2;
    }
}
class Paddle {
    constructor(width, height, canvasWidth) {
        this.width = width;
        this.height = height;
        this.x = (canvasWidth - this.width) / 2;
    }

    draw(ctx, canvasHeight) {
        ctx.fillStyle = "#0095DD";
        ctx.fillRect(this.x, canvasHeight - this.height, this.width, this.height);
    }

    move(relativeX, canvasWidth) {
        if (relativeX > 0 && relativeX < canvasWidth) {
            this.x = relativeX - this.width / 2;
        }
    }
}
class Brick {
    constructor(x, y, width, height, hitsRequired) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.hitsRequired = hitsRequired;
        this.status = 1;
    }

    draw(ctx) {
        if (this.status === 1) {
            ctx.fillStyle = this.getColor();
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.fillText(this.hitsRequired, this.x + this.width / 2 - 5, this.y + this.height / 2 + 5);
        }
    }

    getColor() {
        switch (this.hitsRequired) {
            case 3: return "orange";
            case 2: return "yellow";
            case 1: return "blue";
            default: return "gray";
        }
    }

    hit() {
        this.hitsRequired--;
        if (this.hitsRequired <= 0) {
            this.status = 0;
        }
    }
}
class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ball = new Ball(canvas.width / 2, canvas.height - 30, 10, 2, -2);
        this.paddle = new Paddle(75, 10, canvas.width);
        this.bricks = [];
        this.score = 0;
        this.lives = 3;
        this.timeLimit = 60;
        this.difficulty = "medium"; // 可以設定簡單、中等、困難
        this.initializeBricks();
    }

    initializeBricks() {
        const brickRowCount = this.difficulty === "easy" ? 3 : this.difficulty === "hard" ? 5 : 4;
        const brickColumnCount = this.difficulty === "easy" ? 5 : this.difficulty === "hard" ? 7 : 6;
        const brickPadding = 10;
        const brickWidth = (this.canvas.width - (brickColumnCount + 1) * brickPadding) / brickColumnCount;
        const brickHeight = 20;

        for (let c = 0; c < brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                const hitsRequired = Math.floor(Math.random() * 3) + 1;
                const brickX = c * (brickWidth + brickPadding) + brickPadding;
                const brickY = r * (brickHeight + brickPadding) + brickPadding;
                this.bricks[c][r] = new Brick(brickX, brickY, brickWidth, brickHeight, hitsRequired);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ball.draw(this.ctx);
        this.paddle.draw(this.ctx, this.canvas.height);
        this.bricks.forEach(column => column.forEach(brick => brick.draw(this.ctx)));
    }

    update() {
        this.ball.move();
        this.checkCollisions();
    }

    checkCollisions() {
        // 檢查球和磚塊的碰撞
        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const brick = this.bricks[c][r];
                if (brick.status === 1) {
                    if (this.ball.x > brick.x && this.ball.x < brick.x + brick.width &&
                        this.ball.y > brick.y && this.ball.y < brick.y + brick.height) {
                        this.ball.reverseY();
                        brick.hit();
                        if (brick.status === 0) {
                            this.score++;
                        }
                    }
                }
            }
        }
        // 檢查球和擋板的碰撞
        // 檢查邊界判定和遊戲結束
    }
}
