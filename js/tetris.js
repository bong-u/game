"use strict";

window.onload = function() {
	const game = new Game();

	const startEvent = function(event) {
	game.start();
	document.removeEventListener('keypress', startEvent);
	}

	document.addEventListener('keypress', startEvent);
}

function NextblockCtx() {
	const canvas = document.getElementById ('next_block');
	return canvas.getContext ('2d');
}

class Game {
	#canvas; #ctx; #score; #scoreEl; #bg;   
	#current; #next; #board; #t; 

	static wb = 10;
	static hb = 20;

	constructor () {
		this.#canvas = document.getElementById ('canvas');
		this.#ctx = this.#canvas.getContext ('2d');

		this.#current = new Shape(true);
		this.#next = new Shape(false);

		this.#board = [];
		this.#t = 500;

		this.#scoreEl = document.getElementById ('score_value');
		this.#score = 0;

		for (var i=0; i<Game.hb; i++)
			this.#board[i] = new Array (Game.wb).fill(0);
	}

	start() {
		document.getElementById('intro').remove();
		// document.getElementById('canvas').style.border = '1px solid white';

		this.interval = setInterval (this.update.bind(this), this.#t);
		window.onkeydown = (e) => this.keydown (e, this.#current);

		this.updateScreen();

		this.#next.draw(NextblockCtx());
	}

	keydown (e, current) { 

		if (e.keyCode == 40)        //down
			current.move(0, 30);
		else if (e.keyCode == 37)   //left
			current.move(-30, 0);
		else if (e.keyCode == 39)   //right
			current.move(30, 0);

		else if (e.keyCode == 90) { //z
			current.rotate(1);
			if (this.checkAfterRotation())
				current.rotate(-1);
		}
		else if (e.keyCode == 88) { //x
			current.rotate(-1);
			if (this.checkAfterRotation())
				current.rotate(1);
		}

		this.check();
		this.updateScreen();
	}

	checkWithWall (cBlock) {
		if (cBlock.xPos < 0 || cBlock.xPos > this.#canvas.width-30)
			return true;

		return false;
	}

	checkStack(cBlock) {

		if (cBlock.yPos > this.#canvas.height - 30)     //touch with side wall
			return true;

		for (var i=0; i<Game.wb; i++) {
			for (var j=0; j<Game.hb; j++) {
				if (!this.#board[j][i])     continue;

				if (Math.abs(cBlock.xPos - this.#board[j][i].xPos) < 30 &&
					Math.abs(cBlock.yPos - this.#board[j][i].yPos) < 30)        //touch with stacked block
					return true;
			} 
		}

		return false;
	}

	drawBlocks(ctx) {
		for (var i=0; i<Game.wb; i++) {
			for (var j=0; j<Game.hb; j++) {
				if (this.#board[j][i])
					this.#board[j][i].draw(ctx);
			}
		}
	}

	updateScreen() {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

		this.#current.draw(this.#ctx);

		this.drawBlocks(this.#ctx);
	}

	stack() {
		if (this.#current.yPos == 0)
			this.gameOver();

		while (this.#current.Blocks.length != 0) {
			var block = this.#current.pop();
			this.#board [block.yPos/30] [block.xPos/30] = block;
		}

		this.#current = this.#next;
		this.#current.position();
		this.#next = new Shape(false);

		NextblockCtx().clearRect(0, 0, 160, 160);
		this.#next.draw(NextblockCtx());

		this.checkLineClear();

		this.#score += 10;
		this.#scoreEl.innerHTML = ('00000' + this.#score).slice(-5);            //fill 5 digits with 0
	}


	check() {
		for (const block of this.#current.Blocks) {
			if (this.checkStack(block)) {
				this.#current.reverse();

				if (this.#current.getlastdX())       //left or right collision don't need to stack
					return;

				this.stack();
				return;
			}
			if (this.checkWithWall(block)) {
				this.#current.reverse();
				return; 
			}
		}
	}

	checkAfterRotation() {
		var f = false;
		for (const block of this.#current.Blocks) {
			if (this.checkStack(block) || this.checkWithWall(block))
				f = true;
		};

		return f;
	}

	checkLineClear() {
		let eraseLine = [];
		var cnt = 0;

		for (var i=0; i<Game.hb; i++) {
			cnt = 0;
			for (var j=0; j<Game.wb; j++)
				if (this.#board[i][j])  cnt++;

				if (cnt == Game.wb)
					eraseLine.push(i);
		}

		for (const line of eraseLine) {
			for (var i=0; i<Game.wb; i++) {
				this.#board[line][i] = 0;

				for (var j=line; j>0; j--) {
					this.#board[j][i] = this.#board[j-1][i];
					if (this.#board[j][i])  this.#board[j][i].move(0, 30);
				}
			}

			this.#score += 100;
			this.#t -= 20;
		}

		if (eraseLine.length != 0) {
			clearInterval(this.interval);
			this.interval = setInterval (this.update.bind(this), this.#t);
		}
	}

	gameOver() {
		clearInterval(this.interval);

		alert('game over');

		location.reload();
	}

	update() {
		this.#current.move (0, 30);

		this.check();

		this.updateScreen();
	}
}

class Shape {
	#blocks; #shape; #color; #x; #y; #lastdX; #lastdY;

	static shapeData = [
		[[1,1,1,1],[0,0,0,0],[0,0,0,0],[0,0,0,0]],      //일자형
		[[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],      //┴형
		[[1,1,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0]],      //┌형
		[[1,1,0,0],[1,0,0,0],[1,0,0,0],[0,0,0,0]],      //┐형
		[[1,1,0,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],		//ㅁ형
		[[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],		//Z형
		[[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]]		//Z형-reverse
	];

	static colorData = ['red', 'blue', 'green', 'yellow', 'orange'];

	constructor(current) {      //current or next        
		this.#blocks = [];
		this.#shape = Shape.shapeData[Math.floor(Math.random() * 7)];
		this.#color = Shape.colorData[Math.floor(Math.random() * 5)];

		this.#lastdX = 0;
		this.#lastdY = 0;

		if (current) {
			this.#x = 120;
			this.#y = 0;
		}
		else {
			this.#x = 0;
			this.#y = 0;
		}

		this.align();
		this.trim();
	}

	getlastdX() { return this.#lastdX; }
	get yPos() { return this.#y; }
	get Blocks() { return this.#blocks; }
	pop() { return this.#blocks.pop(); }

	position() {
		this.#x = 120;
		this.#y = 0;
		this.align();
	}

	align() {
		this.#blocks = [];

		for (var i=0; i<4; i++) {
			for (var j=0; j<4; j++) {
				if (this.#shape[i][j])
					this.#blocks.push(new Block(this.#x + j*30, this.#y + i*30, this.#color));
			}
		}
	}

	draw(ctx) {
		for (const block of this.#blocks)
			block.draw(ctx);
	}

	move(dx, dy) {
		this.#x += dx;
		this.#y += dy;
		this.#lastdX = dx;
		this.#lastdY = dy;

		for (const block of this.#blocks)
			block.move(dx, dy);
	}

	reverse() {
		this.#x -= this.#lastdX;
		this.#y -= this.#lastdY;

		for (const block of this.#blocks)
			block.move(this.#lastdX, this.#lastdY, -1);
	}

	rotate(type) {      //1 -> clockwise , -1 = anti-clockwise

		var temp = this.#shape.map(v => v.slice());

		if (type == 1) {    //clockwise
			for (var i=0; i<4; i++) {
				for (var j=0; j<4; j++)
					this.#shape[i][j] = temp[3-j][i];
			}
		}
		else {    //anti-clockwise
			for (var i=0; i<4; i++) {
				for (var j=0; j<4; j++)
					this.#shape[i][j] = temp[j][3-i];
			}
		}

		this.trim();
		this.align();
	}

	trim() {
		var x = -1;
		var y = -1;

		var temp = this.#shape.map(v => v.slice());

		for (var i=0; i<4 && y == -1; i++) {
			for (var j=0; j<4 && y == -1; j++) {
				if (this.#shape[i][j])
					y = i;
			}
		}
		for (var i=0; i<4 && x == -1; i++) {
			for (var j=0; j<4 && x == -1; j++) {
				if (this.#shape[j][i])
					x = i;
			}
		}

		this.#shape = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

		for (var i=y, k=0; i<4; i++, k++) {
			for (var j=x, l=0; j<4; j++, l++)
				this.#shape[k][l] = temp[i][j];
		}
	}
}

class Block {
	#x; #y; #color;

	constructor (x, y, color) {
		this.#x = x;
		this.#y = y;
		this.#color = color;
	}

	get xPos () { return this.#x; }
	get yPos () { return this.#y; }

	move (x, y, n=1) {      //reverse if n == -1
		this.#x += x * n;
		this.#y += y * n;
	}

	draw (ctx) {
		ctx.beginPath();
		ctx.rect(this.#x, this.#y, 30, 30);
		ctx.fillStyle = this.#color;
		ctx.fill();
		ctx.closePath();

		// ctx.strokeStyle = 'white';
		ctx.lineWidth = 3;
		ctx.strokeRect(this.#x, this.#y, 30, 30);
	}
}