class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.snake = [{x: 5, y: 5}];
        this.food = this.generateFood();
        this.direction = 'right';
        this.score = 0;
        this.gameLoop = null;
        this.speed = 150;
        this.isGameOver = false;

        // 自适应画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 绑定按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('endBtn').addEventListener('click', () => this.endGame());

        // 绑定键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 绑定移动端控制按钮
        document.getElementById('upBtn').addEventListener('click', () => this.handleDirection('up'));
        document.getElementById('downBtn').addEventListener('click', () => this.handleDirection('down'));
        document.getElementById('leftBtn').addEventListener('click', () => this.handleDirection('left'));
        document.getElementById('rightBtn').addEventListener('click', () => this.handleDirection('right'));

        // 绑定触摸事件
        let touchStartX = 0;
        let touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0 && this.direction !== 'left') {
                    this.handleDirection('right');
                } else if (deltaX < 0 && this.direction !== 'right') {
                    this.handleDirection('left');
                }
            } else {
                if (deltaY > 0 && this.direction !== 'up') {
                    this.handleDirection('down');
                } else if (deltaY < 0 && this.direction !== 'down') {
                    this.handleDirection('up');
                }
            }
        }, { passive: false });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxSize = Math.min(container.clientWidth - 20, 400);
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;
        this.gridSize = Math.floor(maxSize / 20);
        this.draw();
    }

    handleDirection(newDirection) {
        if (this.isGameOver) return;
        
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        if (opposites[newDirection] !== this.direction) {
            this.direction = newDirection;
        }
    }

    generateFood() {
        const x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
        const y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
        return {x, y};
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格背景
        this.ctx.strokeStyle = '#eee';
        for (let i = 0; i < this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // 绘制蛇
        this.ctx.fillStyle = '#4CAF50';
        this.snake.forEach((segment, index) => {
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
            // 绘制蛇眼睛
            if (index === 0) {
                this.ctx.fillStyle = '#000';
                const eyeSize = this.gridSize / 4;
                const eyeOffset = this.gridSize / 4;
                this.ctx.fillRect(
                    segment.x * this.gridSize + eyeOffset,
                    segment.y * this.gridSize + eyeOffset,
                    eyeSize,
                    eyeSize
                );
                this.ctx.fillRect(
                    segment.x * this.gridSize + this.gridSize - eyeOffset - eyeSize,
                    segment.y * this.gridSize + eyeOffset,
                    eyeSize,
                    eyeSize
                );
            }
        });

        // 绘制食物
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    move() {
        const head = {...this.snake[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // 检查是否撞墙
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            this.gameOver();
            return;
        }

        // 检查是否撞到自己
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('score').textContent = `分数: ${this.score}`;
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    handleKeyPress(e) {
        switch(e.key) {
            case 'ArrowUp':
                this.handleDirection('up');
                break;
            case 'ArrowDown':
                this.handleDirection('down');
                break;
            case 'ArrowLeft':
                this.handleDirection('left');
                break;
            case 'ArrowRight':
                this.handleDirection('right');
                break;
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.endGame();
        alert(`游戏结束！最终得分：${this.score}`);
    }

    startGame() {
        if (!this.gameLoop) {
            this.snake = [{x: 5, y: 5}];
            this.direction = 'right';
            this.score = 0;
            this.isGameOver = false;
            document.getElementById('score').textContent = `分数: ${this.score}`;
            this.food = this.generateFood();
            this.gameLoop = setInterval(() => {
                this.move();
                this.draw();
            }, this.speed);
        }
    }

    endGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }
}

// 初始化游戏
const game = new SnakeGame(); 