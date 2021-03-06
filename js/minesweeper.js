"use strict";

window.onload = function() {
	const timer = new Timer();
	const flagnum = new Flagnum();
	
	document.getElementById('startBtn').onclick = function() {
		timer.init();
		flagnum.init();

		var n = document.getElementById('difficulty').value;

		if (n == 0)     return;

		const game = new Game(n, timer);
	};
}
	
class Timer {
	#time; #timer; #el;

	constructor() { this.init(); }

	init() {
		this.stopTimer();
		this.#time = 0;
		this.#timer = null;
		this.#el = document.getElementById('time');
		this.#el.innerHTML = '00 : 00';
	}

	startTimer() {
		if (this.#timer ==  null)
			this.#timer = setInterval(function () { this.interval() }.bind(this), 1000);
	}

	stopTimer() { clearInterval(this.#timer); }

	getTime() { return this.calcTime(); }

	calcTime() {
		var h = Math.floor(this.#time / 60);
		var s = this.#time - (h*60);
		if (h < 10) { h = '0'+h; }
		if (s < 10) { s = '0'+s; }

		return h + ' : ' + s;
	}

	interval() {
		this.#time++;

		this.#el.innerHTML = this.calcTime();
	}
}
class Flagnum {
	#el;

	constructor() { this.init(); }

	init() {
		this.#el = document.getElementById('flag_num');
		this.#el.innerHTML = '0';
	}
	update(n) {
		this.#el.innerHTML = n;
	}
}

class Game {
	#canvas; #ctx; #w; #h; #x; #y; #level;
	#blocks; #board; #reveal; #mine_num; #timer;
	
	static bw; static bh;

	constructor (level, timer) {
		this.#canvas = document.getElementById('board');
		this.#ctx = this.#canvas.getContext('2d');

		this.#level = level;
		this.#timer = timer;

		if (level == 1) {
			Game.bw = 9;
			Game.bh = 9;
			this.#x = 585;
			this.#y = 135;
			this.#mine_num = 10;
		}
		if (level == 2) {
			Game.bw = 16;
			Game.bh = 16;
			this.#x = 480;
			this.#y = 30;
			this.#mine_num = 40;
		}
		if (level == 3) {
			Game.bw = 30;
			Game.bh = 16;
			this.#x = 270;
			this.#y = 30;
			this.#mine_num = 99;
		}
		if (level == 4) {
			Game.bw = 48;
			Game.bh = 18;
			this.#x = 0;
			this.#y = 0;
			this.#mine_num = 240;
		}

		this.#w = Game.bw * 30;
		this.#h = Game.bh * 30;

		this.#board = new Array(Game.bh).fill(0).map(() => new Array(Game.bw).fill(0));
		this.#reveal = new Array(Game.bh).fill(0).map(() => new Array(Game.bw).fill(0));

		this.#canvas.onclick = this.leftClick.bind(this);
		this.#canvas.oncontextmenu = (ev) => { this.rightClick(ev) };

		this.newBoard();
		this.drawBoard();
	}

	leftClick () {
		this.#timer.startTimer();

		var rect = this.#canvas.getBoundingClientRect();
		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;

		const board = this.#board;


		for (var i=0; i<Game.bh; i++) {
			for (var j=0; j<Game.bw; j++) {
				if (0 < x - board[i][j].xPos && x - board[i][j].xPos < 30 &&    //is click pos exists in block
					0 < y - board[i][j].yPos && y - board[i][j].yPos < 30) {
					if (!this.reveal(i, j)) //if Gameover
						return;
					this.serialReveal(i, j);
					this.drawBoard();

					return;
				}
			}
		}
	}

	rightClick (ev) {
		ev.preventDefault(); 
		this.#timer.startTimer();

		var rect = this.#canvas.getBoundingClientRect();
		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;

		const board = this.#board;

		for (var i=0; i<Game.bh; i++) {
			for (var j=0; j<Game.bw; j++) {
				if (0 < x - board[i][j].xPos && x - board[i][j].xPos < 30 &&    //is click pos exists in block
					0 < y - board[i][j].yPos && y - board[i][j].yPos < 30) {
					this.flag(i, j);
					this.drawBoard();
					this.clearCheck();
					return;
				}
			}
		}

	}

	reveal (i, j) {
		this.#reveal[i][j] = 1;

		if (this.#board[i][j] instanceof Mine) {
			this.gameOver(i, j);		//pressed position i, j
			return false;
		}
		return true;
	}
	
	gameOver (a, b) {
		this.#timer.stopTimer();
		
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		this.#ctx.fillStyle = '#bebebe';
		this.#ctx.fillRect(this.#x, this.#y, this.#w, this.#h);		//fill background
		
		for (var i=0; i<Game.bh; i++) {
			for (var j=0; j<Game.bw; j++) {
				this.#board[i][j].draw(this.#ctx);
			}
		}
		
		new Mine(this.#x + b*30, this.#y + a*30).draw(this.#ctx, 'red');
		
		setTimeout(function() {			//alert after display
			alert('Game Over');
			location.reload();
		}, 20);
	}

	flag (i, j) {
		if (this.#reveal[i][j] == 0)		//if no flag on it
			this.#reveal[i][j] = 2;			//place flag
		else if (this.#reveal[i][j] == 2)	//if flag on it
			this.#reveal[i][j] = 0;			//remove flag
	}

	newBoard() {
		for (var i=0; i<Game.bh; i++) {
			for (var j=0; j<Game.bw; j++) 
				this.#board[i][j] = new Empty(this.#x + j*30, this.#y+ i*30);
		}


		for (var i=0; i<this.#mine_num; i++) {
			var r1 = Math.floor(Math.random() * Game.bw);
			var r2 = Math.floor(Math.random() * Game.bh);

			if (this.#board[r2][r1] instanceof Mine) {
				i--;
				continue;
			}

			this.#board[r2][r1] = new Mine(this.#x+r1*30, this.#y+r2*30);
			
			if (r1 != 0)
				this.arrangeNumber (r2, r1-1);
			if (r2 != 0)
				this.arrangeNumber (r2-1, r1);
			if (r1 != Game.bw-1)
				this.arrangeNumber (r2, r1+1);
			if (r2 != Game.bh-1)
				this.arrangeNumber (r2+1, r1);
			if (r1 != 0 && r2 != 0)
				this.arrangeNumber (r2-1, r1-1); 
			if (r1 != Game.bw-1 && r2 != 0)
				this.arrangeNumber (r2-1, r1+1); 
			if (r1 != 0 && r2 != Game.bh-1)
				this.arrangeNumber (r2+1, r1-1); 
			if (r1 != Game.bw-1 && r2 != Game.bh-1)
				this.arrangeNumber (r2+1, r1+1); 
		}
	}

	arrangeNumber(i, j) {
		if (this.#board[i][j] instanceof Number)        //if Number exists in position
			this.#board[i][j].increase();
		else if (this.#board[i][j] instanceof Mine)     //if Number exists in position
			return;
		else                                            //or make number with 1
			this.#board[i][j] = new Number(this.#x + j*30, this.#y + i*30, 1);
	}

	serialReveal (i, j) {
		var n =0;

		const arr = [];     //calculable surrounding blocks

		if (! (this.#board[i][j] instanceof Empty))     //if block is not Empty
			return;

		if (i != 0)    arr.push([-1, 0]);
		if (j != 0)    arr.push([0, -1]);
		if (i != Game.bh-1)    arr.push([1, 0]);
		if (j != Game.bw-1)    arr.push([0, 1]);
		if (i != 0 && j != Game.bw-1)   arr.push([-1, 1]);
		if (i != Game.bh-1 && j != 0)   arr.push([1, -1]);
		if (i != 0 && j != 0)   arr.push([-1, -1]);
		if (i != Game.bh-1 && j != Game.bw-1)   arr.push([1, 1]);

		for (const a of arr) {
			if (this.#reveal[i + a[0]][j + a[1]] == 1)       //if it was already revealed.
				continue;

			this.#reveal[i + a[0]][j + a[1]] = 1;
			this.serialReveal (i + a[0], j + a[1]);
		}
	}

	clearCheck() {
		var n=0;
		var flag=0;

		for (var i=0; i<Game.bh; i++) {
			for (var j=0; j<Game.bw; j++) {
				if (this.#reveal[i][j] == 2) {
					flag++;
					if (this.#board[i][j] instanceof Mine)
						n++;
				}
			}
		}

		flagnum.update(flag);

		if (n == this.#mine_num)
			this.clear();
	}
	
	clear() {
		timer.stopTimer();
		
		for (var i=0; i<Game.bh; i++) {
			for (var j=0; j<Game.bw; j++) {
				this.#board[i][j].draw(this.#ctx);
			}
		}
		
		setTimeout(function() {
			alert('clear');
		}, 10);
	}

	drawBoard() {

		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		this.#ctx.fillStyle = "#bebebe";
		this.#ctx.fillRect(this.#x, this.#y, this.#w, this.#h);		//fill background

		for (var i=0; i<Game.bh; i++) {
			for (var j=0; j<Game.bw; j++) {
				if (this.#reveal[i][j] == 2)
					new Flag(this.#x + j*30, this.#y + i*30).draw(this.#ctx);
				else if (this.#reveal[i][j] == 0)
					new Block(this.#x + j*30, this.#y + i*30, 1).draw(this.#ctx);
				else 
					this.#board[i][j].draw(this.#ctx);
			}
		}
	}
	
}

class Drawable {
	_x; _y;

	constructor(x, y) {
		this._x = x;
		this._y = y;
	}
	get xPos() { return this._x; }
	get yPos() { return this._y; }
}

class Empty extends Drawable {
	draw (ctx) {
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#898989';
		ctx.moveTo (this._x +  3, this._y +  3);
		ctx.lineTo (this._x + 27, this._y +  3);
		ctx.lineTo (this._x + 27, this._y + 27);
		ctx.lineTo (this._x +  3, this._y +  27);
		ctx.lineTo (this._x +  3, this._y +  3);
		ctx.stroke();
		ctx.closePath();
	}
}
class Block extends Drawable {
	draw (ctx) {
		ctx.beginPath();
		ctx.rect (this._x, this._y, 30, 30);
		ctx.fillStyle = '#c0c0c0'
		ctx.fill();
		ctx.closePath();

		ctx.lineWidth = 3;

		ctx.beginPath();
		ctx.strokeStyle = 'white';
		ctx.moveTo (this._x + 27, this._y +  3);
		ctx.lineTo (this._x +  3, this._y +  3);
		ctx.lineTo (this._x +  3, this._y + 27);
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		ctx.strokeStyle = '#727272';
		ctx.moveTo (this._x +  3, this._y + 27);
		ctx.lineTo (this._x + 27, this._y + 27);
		ctx.lineTo (this._x + 27, this._y +  3);
		ctx.stroke();
		ctx.closePath();
	}
}
class Flag extends Block {
	draw(ctx) {
		super.draw(ctx);

		ctx.beginPath();
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 2;
		ctx.moveTo (this._x + 17, this._y + 15);
		ctx.lineTo (this._x + 17, this._y + 23);
		ctx.stroke();
		
		ctx.fillStyle = 'red';
		ctx.moveTo (this._x + 18, this._y +  8);
		ctx.lineTo (this._x +  8, this._y + 12);
		ctx.lineTo (this._x + 18, this._y + 16);
		ctx.fill ();
		ctx.closePath();
	} 
}

class Mine extends Drawable {
	draw(ctx, color = 'black') {
		ctx.beginPath ();
		ctx.strokeStyle = color;
		ctx.lineWidth = 3;
		ctx.moveTo(this._x + 15, this._y +  3);
		ctx.lineTo(this._x + 15, this._y + 27);
		ctx.moveTo(this._x +  3, this._y + 15);
		ctx.lineTo(this._x + 27, this._y + 15);
		ctx.moveTo(this._x +  6, this._y +  6);
		ctx.lineTo(this._x + 24, this._y + 24);
		ctx.moveTo(this._x + 24, this._y +  6);
		ctx.lineTo(this._x +  6, this._y + 24);
		ctx.stroke();
		ctx.closePath();


		ctx.beginPath ();
		ctx.fillStyle = color;
		ctx.arc (this._x + 15 , this._y + 15, 8, 0, Math.PI*2);
		ctx.fill ();
		ctx.closePath();
		ctx.beginPath ();
		ctx.fillStyle = 'white';
		ctx.arc (this._x + 12 , this._y + 13, 2, 0, Math.PI*2);
		ctx.fill ();
		ctx.closePath();
	} 
}

class Number extends Drawable {
	#n;

	constructor(x, y, n) {
		super(x, y);
		this.#n = n;
	}

	increase () { this.#n++; }

	draw(ctx) {
		ctx.beginPath();
		ctx.font = 'bold 15px monospace';
		if (this.#n == 1)
			ctx.fillStyle = 'green';
		if (this.#n == 2)
			ctx.fillStyle = 'blue';
		if (this.#n == 3)
			ctx.fillStyle = 'purple';
		if (this.#n == 4)
			ctx.fillStyle = 'red';
		if (this.#n == 5)
			ctx.fillStyle = 'green';
		if (this.#n == 6)
			ctx.fillStyle = 'black';

		ctx.fillText(this.#n, this._x+11, this._y+18);
		ctx.closePath();
	} 

}