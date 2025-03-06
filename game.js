class SnakeGame {
    constructor() {
        console.log('游戏构造函数被调用');
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('游戏初始化开始');
        // 初始化游戏元素
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('找不到游戏画布元素');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('无法获取画布上下文');
            return;
        }

        // 初始化按钮
        this.startBtn = document.getElementById('startBtn');
        this.endBtn = document.getElementById('endBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');

        if (!this.startBtn || !this.endBtn || !this.pauseBtn || !this.restartBtn) {
            console.error('找不到游戏按钮元素');
            return;
        }

        // 设置按钮初始状态
        this.startBtn.disabled = false;
        this.endBtn.disabled = true;
        this.pauseBtn.disabled = true;

        // 初始化游戏状态
        this.gridSize = 20;
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameLoop = null;
        this.speed = 150;
        this.isGameOver = false;
        this.isPaused = false;
        this.obstacles = [];
        this.speedMultiplier = 1;
        this.gameMode = 'classic';
        this.difficulty = 'easy';
        this.startTime = 0;
        this.gameTime = 0;
        this.powerUps = {
            speedBoost: { active: false, duration: 0 },
            shield: { active: false, duration: 0 },
            doubleScore: { active: false, duration: 0 }
        };
        this.portals = [];
        this.mazeWalls = [];
        this.currentLevel = 1;
        this.targetScore = 0;
        this.timeLimit = 0;
        this.levelTimer = null;

        // 初始化关卡数据
        this.levels = [
            {
                level: 1,
                targetScore: 50,
                timeLimit: 60,
                obstacles: 3,
                speed: 150,
                description: "第一关：基础训练"
            },
            {
                level: 2,
                targetScore: 100,
                timeLimit: 55,
                obstacles: 5,
                speed: 130,
                description: "第二关：速度提升"
            },
            {
                level: 3,
                targetScore: 150,
                timeLimit: 50,
                obstacles: 7,
                speed: 120,
                description: "第三关：障碍挑战"
            },
            {
                level: 4,
                targetScore: 200,
                timeLimit: 45,
                obstacles: 10,
                speed: 110,
                description: "第四关：迷宫探险"
            },
            {
                level: 5,
                targetScore: 300,
                timeLimit: 40,
                obstacles: 12,
                speed: 100,
                description: "第五关：终极挑战"
            }
        ];

        // 生成食物
        this.food = this.generateFood();

        // 自适应画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 绑定事件
        this.bindEvents();

        // 初始化显示
        this.updateHighScoresDisplay();
        this.draw();
        console.log('游戏初始化完成');
    }

    bindEvents() {
        console.log('开始绑定事件');
        // 绑定按钮事件
        this.startBtn.addEventListener('click', () => {
            console.log('开始游戏按钮被点击');
            this.startGame();
        });

        this.endBtn.addEventListener('click', () => {
            console.log('结束游戏按钮被点击');
            this.endGame();
            this.startBtn.disabled = false;
            this.endBtn.disabled = true;
            this.pauseBtn.disabled = true;
        });

        this.pauseBtn.addEventListener('click', () => {
            console.log('暂停按钮被点击');
            this.togglePause();
            this.pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
        });

        this.restartBtn.addEventListener('click', () => {
            console.log('重新开始按钮被点击');
            this.restartGame();
            this.startBtn.disabled = false;
            this.endBtn.disabled = true;
            this.pauseBtn.disabled = true;
        });

        // 绑定设置变更事件
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.updateSpeed();
        });

        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            this.resetGame();
        });

        // 绑定技能按钮事件
        document.getElementById('speedBoost').addEventListener('click', () => this.activatePowerUp('speedBoost'));
        document.getElementById('shield').addEventListener('click', () => this.activatePowerUp('shield'));
        document.getElementById('doubleScore').addEventListener('click', () => this.activatePowerUp('doubleScore'));

        // 绑定键盘事件，阻止方向键的默认行为
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            this.handleKeyPress(e);
        });

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
        console.log('事件绑定完成');
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxSize = Math.min(container.clientWidth - 40, 400);
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;
        this.gridSize = Math.floor(maxSize / 20);
        this.draw();
    }

    updateSpeed() {
        const speeds = {
            'easy': 150,
            'medium': 100,
            'hard': 70
        };
        this.speed = speeds[this.difficulty] / this.speedMultiplier;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => {
                this.move();
                this.draw();
                this.updateGameTime();
            }, this.speed);
        }
        // 更新速度显示
        const displaySpeed = Math.round((1 / this.speed) * 10000);
        document.getElementById('speed').textContent = displaySpeed;
        console.log('速度更新为:', this.speed, '显示速度为:', displaySpeed);
    }

    updateGameTime() {
        this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
        document.getElementById('gameTime').textContent = this.gameTime;
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
        } while (this.isPositionOccupied(food));
        return food;
    }

    generateObstacles() {
        this.obstacles = [];
        const obstacleCount = {
            'easy': 3,
            'medium': 5,
            'hard': 8
        }[this.difficulty];

        for (let i = 0; i < obstacleCount; i++) {
            let obstacle;
            do {
                obstacle = {
                    x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                    y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
                };
            } while (this.isPositionOccupied(obstacle));
            this.obstacles.push(obstacle);
        }
    }

    generateMaze() {
        this.mazeWalls = [];
        const mazeSize = Math.floor(this.canvas.width / this.gridSize);
        const maze = Array(mazeSize).fill().map(() => Array(mazeSize).fill(0));
        
        // 使用深度优先搜索生成迷宫
        const stack = [];
        const start = {x: 1, y: 1};
        maze[start.y][start.x] = 1;
        stack.push(start);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current, maze);
            
            if (neighbors.length === 0) {
                stack.pop();
                continue;
            }

            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            maze[next.y][next.x] = 1;
            stack.push(next);
        }

        // 将迷宫转换为墙壁
        for (let y = 0; y < mazeSize; y++) {
            for (let x = 0; x < mazeSize; x++) {
                if (maze[y][x] === 0) {
                    this.mazeWalls.push({x, y});
                }
            }
        }
    }

    getUnvisitedNeighbors(pos, maze) {
        const neighbors = [];
        const directions = [
            {x: 0, y: -2},
            {x: 2, y: 0},
            {x: 0, y: 2},
            {x: -2, y: 0}
        ];

        for (const dir of directions) {
            const newX = pos.x + dir.x;
            const newY = pos.y + dir.y;
            
            if (newX > 0 && newX < maze[0].length - 1 &&
                newY > 0 && newY < maze.length - 1 &&
                maze[newY][newX] === 0) {
                neighbors.push({x: newX, y: newY});
            }
        }

        return neighbors;
    }

    generatePortals() {
        this.portals = [];
        const portalCount = 2;
        
        for (let i = 0; i < portalCount; i++) {
            let portal;
            do {
                portal = {
                    x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                    y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
                };
            } while (this.isPositionOccupied(portal));
            this.portals.push(portal);
        }
    }

    isPositionOccupied(pos) {
        if (!this.snake || !this.obstacles || !this.mazeWalls || !this.portals) {
            return false;
        }
        return this.snake.some(segment => segment.x === pos.x && segment.y === pos.y) ||
               this.obstacles.some(obs => obs.x === pos.x && obs.y === pos.y) ||
               this.mazeWalls.some(wall => wall.x === pos.x && wall.y === pos.y) ||
               this.portals.some(portal => portal.x === pos.x && portal.y === pos.y) ||
               (this.food && this.food.x === pos.x && this.food.y === pos.y);
    }

    activatePowerUp(type) {
        if (this.powerUps[type].active) return;

        const durations = {
            'speedBoost': 5000,
            'shield': 8000,
            'doubleScore': 10000
        };

        this.powerUps[type].active = true;
        this.powerUps[type].duration = durations[type];
        document.getElementById(type).classList.add('active');

        // 处理速度提升
        if (type === 'speedBoost') {
            this.speedMultiplier *= 1.5;
            this.updateSpeed();
            // 更新速度显示
            const displaySpeed = Math.round((1 / this.speed) * 10000);
            document.getElementById('speed').textContent = displaySpeed;
        }

        setTimeout(() => {
            this.powerUps[type].active = false;
            document.getElementById(type).classList.remove('active');
            
            // 恢复速度
            if (type === 'speedBoost') {
                this.speedMultiplier /= 1.5;
                this.updateSpeed();
                // 更新速度显示
                const displaySpeed = Math.round((1 / this.speed) * 10000);
                document.getElementById('speed').textContent = displaySpeed;
            }
        }, durations[type]);
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

        // 绘制迷宫墙壁
        if (this.mazeWalls) {
            this.ctx.fillStyle = '#666';
            this.mazeWalls.forEach(wall => {
                this.ctx.fillRect(
                    wall.x * this.gridSize,
                    wall.y * this.gridSize,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            });
        }

        // 绘制障碍物
        if (this.obstacles) {
            this.ctx.fillStyle = '#666';
            this.obstacles.forEach(obstacle => {
                this.ctx.fillRect(
                    obstacle.x * this.gridSize,
                    obstacle.y * this.gridSize,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            });
        }

        // 绘制传送门
        if (this.portals) {
            this.portals.forEach((portal, index) => {
                this.ctx.fillStyle = `hsl(${index * 180}, 70%, 50%)`;
                this.ctx.beginPath();
                this.ctx.arc(
                    portal.x * this.gridSize + this.gridSize / 2,
                    portal.y * this.gridSize + this.gridSize / 2,
                    this.gridSize / 2 - 2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            });
        }

        // 绘制蛇
        if (this.snake) {
            this.snake.forEach((segment, index) => {
                // 蛇身渐变色
                const hue = (120 + index * 2) % 360;
                this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
                
                // 如果有护盾效果，添加发光效果
                if (this.powerUps.shield.active && index === 0) {
                    this.ctx.shadowColor = '#fff';
                    this.ctx.shadowBlur = 10;
                } else {
                    this.ctx.shadowBlur = 0;
                }

                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize - 2,
                    this.gridSize - 2
                );

                // 重置阴影效果
                this.ctx.shadowBlur = 0;

                // 绘制蛇眼睛
                if (index === 0) {
                    this.ctx.fillStyle = '#000';
                    const eyeSize = this.gridSize / 4;
                    const eyeOffset = this.gridSize / 4;
                    
                    // 根据方向调整眼睛位置
                    let eyeX1, eyeX2, eyeY1, eyeY2;
                    switch(this.direction) {
                        case 'right':
                            eyeX1 = eyeX2 = segment.x * this.gridSize + this.gridSize - eyeOffset - eyeSize;
                            eyeY1 = segment.y * this.gridSize + eyeOffset;
                            eyeY2 = segment.y * this.gridSize + this.gridSize - eyeOffset - eyeSize;
                            break;
                        case 'left':
                            eyeX1 = eyeX2 = segment.x * this.gridSize + eyeOffset;
                            eyeY1 = segment.y * this.gridSize + eyeOffset;
                            eyeY2 = segment.y * this.gridSize + this.gridSize - eyeOffset - eyeSize;
                            break;
                        case 'up':
                            eyeX1 = segment.x * this.gridSize + eyeOffset;
                            eyeX2 = segment.x * this.gridSize + this.gridSize - eyeOffset - eyeSize;
                            eyeY1 = eyeY2 = segment.y * this.gridSize + eyeOffset;
                            break;
                        case 'down':
                            eyeX1 = segment.x * this.gridSize + eyeOffset;
                            eyeX2 = segment.x * this.gridSize + this.gridSize - eyeOffset - eyeSize;
                            eyeY1 = eyeY2 = segment.y * this.gridSize + this.gridSize - eyeOffset - eyeSize;
                            break;
                    }

                    this.ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize);
                    this.ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize);
                }
            });
        }

        // 绘制食物
        if (this.food) {
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

        // 如果游戏暂停，显示暂停文字
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    move() {
        if (this.isPaused) return;

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
            if (!this.powerUps.shield.active) {
                this.gameOver();
                return;
            }
            // 如果有护盾，从另一边出现
            head.x = (head.x + this.canvas.width / this.gridSize) % (this.canvas.width / this.gridSize);
            head.y = (head.y + this.canvas.height / this.gridSize) % (this.canvas.height / this.gridSize);
        }

        // 检查是否撞到自己
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            if (!this.powerUps.shield.active) {
                this.gameOver();
                return;
            }
        }

        // 检查是否撞到障碍物或迷宫墙壁
        if ((this.obstacles.some(obs => obs.x === head.x && obs.y === head.y) ||
             this.mazeWalls.some(wall => wall.x === head.x && wall.y === head.y)) &&
            !this.powerUps.shield.active) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            // 根据难度和模式计算得分
            const baseScore = {
                'easy': 5,
                'medium': 10,
                'hard': 15
            }[this.difficulty];

            const finalScore = this.powerUps.doubleScore.active ? baseScore * 2 : baseScore;
            this.score += finalScore;
            document.getElementById('score').textContent = this.score;
            
            // 更新最高分
            if (this.score > this.highScore) {
                this.highScore = this.score;
                document.getElementById('highScore').textContent = this.highScore;
                this.saveHighScore();
                this.updateHighScoresDisplay();
            }

            // 根据游戏模式更新速度
            if (this.gameMode === 'speed') {
                this.speedMultiplier += 0.1;
                this.updateSpeed();
                document.getElementById('speed').textContent = this.speedMultiplier.toFixed(1);
            }

            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }

        // 检查是否进入传送门
        const portalIndex = this.portals.findIndex(portal => portal.x === head.x && portal.y === head.y);
        if (portalIndex !== -1) {
            const otherPortal = this.portals[(portalIndex + 1) % 2];
            head.x = otherPortal.x;
            head.y = otherPortal.y;
            this.snake[0] = head;
        }
    }

    handleDirection(newDirection) {
        if (this.isGameOver || this.isPaused) return;
        
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
            case ' ':
                this.togglePause();
                break;
        }
    }

    togglePause() {
        if (!this.gameLoop) return;
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
    }

    gameOver() {
        this.isGameOver = true;
        this.endGame();
        if (this.gameMode === 'level') {
            clearInterval(this.levelTimer);
        }
        
        // 创建游戏结束界面
        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'gameOver';
        gameOverDiv.className = 'game-over';
        gameOverDiv.innerHTML = `
            <h2>游戏结束</h2>
            <p>最终得分: <span id="finalScore">${this.score}</span></p>
            <p>游戏时间: <span id="finalTime">${this.gameTime}</span>秒</p>
            <button id="restartBtn">重新开始</button>
            <button id="deleteBtn">删除记录</button>
        `;
        document.body.appendChild(gameOverDiv);

        // 绑定按钮事件
        document.getElementById('restartBtn').addEventListener('click', () => {
            gameOverDiv.remove();
            this.restartGame();
        });

        document.getElementById('deleteBtn').addEventListener('click', () => {
            localStorage.removeItem('snakeHighScore');
            this.highScore = 0;
            this.updateHighScoresDisplay();
            alert('最高分记录已删除！');
        });

        // 启用所有按钮
        this.startBtn.disabled = false;
        this.endBtn.disabled = false;
        this.pauseBtn.disabled = false;
    }

    restartGame() {
        document.getElementById('gameOver').style.display = 'none';
        this.resetGame();
        this.startGame();
    }

    resetGame() {
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.score = 0;
        this.speedMultiplier = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.powerUps = {
            speedBoost: { active: false, duration: 0 },
            shield: { active: false, duration: 0 },
            doubleScore: { active: false, duration: 0 }
        };
        document.getElementById('score').textContent = '0';
        // 重置速度显示
        const displaySpeed = Math.round((1 / this.speed) * 10000);
        document.getElementById('speed').textContent = displaySpeed;
        document.getElementById('pauseBtn').textContent = '暂停';
        document.getElementById('gameTime').textContent = '0';
        this.food = this.generateFood();
        this.obstacles = [];
        this.portals = [];
        this.mazeWalls = [];

        // 根据游戏模式初始化特殊元素
        if (this.gameMode === 'obstacle') {
            this.generateObstacles();
        } else if (this.gameMode === 'maze') {
            this.generateMaze();
        } else if (this.gameMode === 'portal') {
            this.generatePortals();
        } else if (this.gameMode === 'level') {
            document.getElementById('levelInfo').style.display = 'block';
            this.startLevel(1);
        } else {
            document.getElementById('levelInfo').style.display = 'none';
        }

        // 重置技能按钮状态
        Object.keys(this.powerUps).forEach(type => {
            document.getElementById(type).classList.remove('active');
        });
    }

    startGame() {
        console.log('开始游戏');
        // 重置游戏状态
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.food = this.generateFood();
        this.startTime = Date.now();
        
        // 更新显示
        document.getElementById('score').textContent = '0';
        document.getElementById('pauseBtn').textContent = '暂停';
        const gameOverDiv = document.getElementById('gameOver');
        if (gameOverDiv) {
            gameOverDiv.remove();
        }
        
        // 开始游戏循环
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        this.gameLoop = setInterval(() => {
            this.move();
            this.draw();
            this.updateGameTime();
        }, this.speed);

        // 更新按钮状态
        this.startBtn.disabled = true;
        this.endBtn.disabled = false;
        this.pauseBtn.disabled = false;
        console.log('游戏循环已启动');
    }

    endGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    loadHighScore() {
        const savedScore = localStorage.getItem('snakeHighScore');
        return savedScore ? parseInt(savedScore) : 0;
    }

    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }

    updateHighScoresDisplay() {
        const highScoresList = document.getElementById('highScoresList');
        highScoresList.innerHTML = `
            <li>最高分: ${this.highScore}</li>
        `;
    }

    startLevel(level) {
        const levelData = this.levels[level - 1];
        this.currentLevel = level;
        this.targetScore = levelData.targetScore;
        this.timeLimit = levelData.timeLimit;
        this.speed = levelData.speed;
        
        document.getElementById('currentLevel').textContent = level;
        document.getElementById('targetScore').textContent = this.targetScore;
        document.getElementById('timeLimit').textContent = this.timeLimit;
        
        this.resetGame();
        this.generateObstacles();
        this.startGame();
        
        // 开始倒计时
        this.levelTimer = setInterval(() => {
            this.timeLimit--;
            document.getElementById('timeLimit').textContent = this.timeLimit;
            
            if (this.timeLimit <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    checkLevelComplete() {
        if (this.score >= this.targetScore) {
            clearInterval(this.levelTimer);
            if (this.currentLevel < this.levels.length) {
                this.showLevelComplete();
            } else {
                this.showGameComplete();
            }
        }
    }

    showLevelComplete() {
        const levelComplete = document.createElement('div');
        levelComplete.className = 'game-over';
        levelComplete.innerHTML = `
            <h2>恭喜通过第 ${this.currentLevel} 关！</h2>
            <p>得分: ${this.score}</p>
            <p>剩余时间: ${this.timeLimit}秒</p>
            <button id="nextLevelBtn">进入下一关</button>
        `;
        document.body.appendChild(levelComplete);
        
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            levelComplete.remove();
            this.startLevel(this.currentLevel + 1);
        });
    }

    showGameComplete() {
        const gameComplete = document.createElement('div');
        gameComplete.className = 'game-over';
        gameComplete.innerHTML = `
            <h2>恭喜通关！</h2>
            <p>最终得分: ${this.score}</p>
            <p>总用时: ${this.gameTime}秒</p>
            <button id="restartGameBtn">重新开始</button>
        `;
        document.body.appendChild(gameComplete);
        
        document.getElementById('restartGameBtn').addEventListener('click', () => {
            gameComplete.remove();
            this.resetGame();
            this.startLevel(1);
        });
    }
}

// 初始化游戏
window.addEventListener('load', () => {
    const game = new SnakeGame();
}); 