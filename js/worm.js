"use strict";

window.onload = function() {
	const game = new Game();

	const startEvent = function(event) {
		game.start();
		document.removeEventListener('keydown', startEvent);
	}

	document.addEventListener('keydown', startEvent);
}

function sleep(ms) {
	const wakeUpTime = Date.now() + ms;
	while (Date.now() < wakeUpTime) {}
}

class Game {
	#canvas; #ctx; #blocks; #size; #items;
	#scoreEl; #score; #t; #bg;

	constructor () {
		this.#canvas = document.getElementById ('canvas');
		this.#ctx = this.#canvas.getContext ('2d');
		this.#blocks = [];
		this.#size = 0;
		this.#items = [];
		this.#scoreEl = document.getElementById ('scoreEl');
		this.#score = 0;
		this.#t = 250;

		let block = new Block (600, 250, null, true);

		this.#blocks.push (block);
		this.#scoreEl.innerHTML = this.#score;
	}

	start() {
		this.#blocks[0].draw (this.#ctx);
		this.#blocks[0].turn('r');
		this.interval = setInterval (this.update.bind(this), this.#t);

		document.addEventListener('keydown', this.keydown.bind(this));
	}

	keydown (e) {
		let block = this.#blocks[0];
		let d = block.direction;

		if ((e.keyCode == 87 || e.keyCode == 38) && d != 'd')
			block.turn ('u');
		else if ((e.keyCode == 83 || e.keyCode == 40) && d != 'u')
			block.turn ('d');
		else if ((e.keyCode == 65 || e.keyCode == 37) && d != 'r')
			block.turn ('l');
		else if ((e.keyCode == 68 || e.keyCode == 39) && d != 'l')
			block.turn ('r');
	}

	newBlock () {
		let d = this.#blocks[this.#size].direction;
		let x = this.#blocks[this.#size].xPos;
		let y = this.#blocks[this.#size].yPos;

		if (d == 'u')           y += 50;
		else if (d == 'd')      y -= 50;
		else if (d == 'l')      x += 50;
		else if (d == 'r')      x -= 50;

		this.#blocks.push (new Block(x, y, d, false));

		this.#size ++;
	}

	position () {
		for (var i=this.#size; i > 0; i--)
			this.#blocks[i].turn (this.#blocks[i-1].direction);
	}

	checkWithBlock() {
		let head = this.#blocks[0];

		for (var i = 2; i <= this.#size; i++) {
			var body = this.#blocks[i];

			if (Math.abs (head.xPos - body.xPos) < 50 && Math.abs (head.yPos - body.yPos) < 50)
				this.gameOver();
		}
	}

	checkWithWall() {
		let head = this.#blocks[0];

		if (head.xPos > canvas.width-50 || head.xPos < 0 || head.yPos > canvas.height-50 || head.yPos < 0)
			this.gameOver();
	}

	newItemorNot() {
		let random = Math.floor (Math.random() * Math.floor(2500/this.#t));       //0 ~ 15
		let w = canvas.width;
		let h = canvas.height;


		if (this.#blocks[0].direction == null)           // if game didn't start
			return;

		if (this.#items.length >= 5)      //if too many items exist
			return;

		if (random == 0) {
			do {
				var f = false;
				var rX = Math.floor (Math.random() * w / 50) * 50;      //random x position
				var rY = Math.floor (Math.random() * h / 50) * 50;      //random y position

				this.#blocks.forEach (block => {
					if (block.xPos == rX && block.yPos == rY)       //if block nesting with new item position
						f = true;
				});
			} while (f);

			this.#items.push (new Item(rX, rY));
		}
	}

	checkWithItem (head) {

		for (var i=0; i<this.#items.length; i++) {
			var item = this.#items[i];

			if (Math.abs (head.xPos - item.xPos) < 50 && Math.abs (head.yPos - item.yPos) < 50) {       //item collide with head
				this.#items.splice (i, 1);       //remove item
				this.newBlock();

				this.#score += 100;
				this.#scoreEl.innerHTML = this.#score;

				this.#t -= 5;
				clearInterval(this.interval);
				this.interval = setInterval (this.update.bind(this), this.#t);
			}
		}
	}

	gameOver() {

		clearInterval(this.interval);

		alert('game over');

		location.reload();
	}

	update() {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

		this.position();

		this.#items.forEach(item => {
			item.draw(this.#ctx);
		});

		this.#blocks.forEach(block => {
			block.move ();
			block.draw (this.#ctx);
		});

		this.checkWithItem(this.#blocks[0]);
		this.checkWithBlock();
		this.checkWithWall();
		this.newItemorNot();

	}
}

class Block {
	#x; #y; #d; #td; #color; #color_list; #head;

	static color_list = ['red', 'orange', 'yellow', 'lawngreen', 'blue', 'cyan', 'magenta'];

	constructor (x, y, d, head) {
		this.#x = x;
		this.#y = y;
		this.#d = d;
		this.#td = null;         //will turn to this direction
		this.#head = head;      //whether it is a head or not

		this.#color = Block.color_list[Math.floor(Math.random() * 7)];
	}

	get xPos () { return this.#x; }
	get yPos () { return this.#y; }
	get direction () { return this.#d; }

	setDirection (d) { this.#d = d; }
	turn (d) { this.#td = d; }
	setColor (color) { this.#color = color; }

	move () {
		this.#d = this.#td;

		if (this.#d =='u')
			this.#y -= 50;
		else if (this.#d == 'd')
			this.#y += 50;
		else if (this.#d == 'l')
			this.#x -= 50;
		else if (this.#d == 'r')
			this.#x += 50;
	}

	draw (ctx) {
		ctx.beginPath();

		if (this.#head)
			ctx.arc(this.#x+25, this.#y+25, 25, 0, Math.PI * 2);
		else
			ctx.arc(this.#x+25, this.#y+25, 20, 0, Math.PI * 2);

		ctx.fillStyle = this.#color;
		ctx.fill();
		ctx.closePath();
	}
}

class Item {
	#x; #y;

	constructor (x, y) {
		this.#x = x;
		this.#y = y;
	}
	get xPos() { return this.#x; }
	get yPos() { return this.#y; }

	draw (ctx) {
		ctx.beginPath();
		ctx.rect(this.#x+15, this.#y+15, 15, 15);
		ctx.fillStyle = 'lime';
		ctx.fill();
		ctx.closePath();
	}
}

// window.onload = function () {
// 	var ctx = document.getElementById ('canvas').getContext('2d');
// 	ctx.globalAlpha = 0.1;
// 	ctx.drawImage (bg, 425, 75, 400, 400);
// 	ctx.globalAlpha = 1.0;
// }