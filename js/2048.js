'use strict';

window.onload = function() {
	new Block(0, 0);		//to call constructor ( load images )=
	setTimeout(function() { new Game(); }, 100);
}

class Game {
    #canvas; #ctx;
    #board;
	#score; #scoreEl;

    constructor() {
        this.#canvas = document.getElementById ('canvas');
        this.#ctx = this.#canvas.getContext ('2d');

        this.#board = new Array(4).fill(0).map(() => new Array(4).fill(0));
		
		this.#score = 0;
		this.#scoreEl = document.getElementById('scoreEl');

        this.#board[0][0] = new Block(0, 0);
        this.#board[0][0].draw(this.#ctx);

        document.addEventListener('keydown', this.keydown.bind(this));
		
		this.update();
    }

    keydown (e) {
        if (e.keyCode == 87 || e.keyCode == 38)        //up
            this.moveBlocks('u');
        else if (e.keyCode == 83 || e.keyCode == 40)   //down
            this.moveBlocks('d');
        else if (e.keyCode == 65 || e.keyCode == 37)   //left
            this.moveBlocks('l');
        else if (e.keyCode == 68 || e.keyCode == 39)   //right
            this.moveBlocks('r');

        this.update();
    }
    
	moveBlocks(d) {
        let ismoved = false;
        let ismerged = false;

		if (d == 'd')	this.rotateBoard(1);		//rotate 1 times
		if (d == 'r')	this.rotateBoard(2);		//rotate 2 times
		if (d == 'u')	this.rotateBoard(3);		//rotate 3 times
		
		ismoved = this.slideLeft();					//moving blocks to left
		ismerged =  this.mergeBlocks();				//combine blocks with the same number
		this.slideLeft();							//fill the blanks
		
		if (d == 'd')	this.rotateBoard(3);		//rotate 3 times
		if (d == 'r')	this.rotateBoard(2);		//rotate 2 times
		if (d == 'u')	this.rotateBoard(1);		//rotate 1 times
		
        if (ismoved || ismerged)
			this.newBlock();

    }
	
	slideLeft() {
        let movement = false;

		for (var i=0; i<4; i++) {       //moving blocks to left
			var line = this.#board[i];		//copy line
			this.#board[i] = [0,0,0,0];		//clear original line
			for (var j=0, k=0; j<4; j++) {
				if (line[j])				//if block exists
					this.#board[i][k++] = line[j];		//move the block and k++
			}
            if (this.#board[i].toString() != line.toString())    //is there any difference
                movement = true;                                 //consider it was moved
		}

        return movement;
	}
	
	mergeBlocks() {
        let movement = false;

		for (var i=0; i<4; i++) {		//combine blocks
			for (var j=0; j<3; j++) {	//0 ~ 2 : can't combine last block
			
				if (!this.#board[i][j]) continue;			//exclude blanks
				
				if (this.#board[i][j].Num == this.#board[i][j+1].Num) {		//if next block has same number
					this.#board[i][j].increase();			//increase left block's number
					this.#board[i][j+1] = 0;				//remove right block
					
					this.#score += Math.pow(2, this.#board[i][j].Num + 1);
                    movement = true;                        //consider it was moved
				}
			}
		}

        return movement;
	}
	
	rotateBoard(n) {		//rotate clock-wise n times
	
		for (var k=0; k<n; k++) {
			var temp = this.#board.map(v => v.slice());		//deep-copy board
			this.#board = new Array(4).fill(0).map(() => new Array(4).fill(0));		//fill 0
            
			for (var i=0; i<4; i++) {
				for (var j=0; j<4; j++) {
					if (!temp[3-j][i]) continue;			//exclude blanks
					this.#board[i][j] = temp[3-j][i];		//rotate
				}
			}
		}
	}
	
	positionBlocks() {
		for (var i=0; i<4; i++) {
			for (var j=0; j<4; j++) {
				if (!this.#board[i][j]) continue;		//exclude blanks
				this.#board[i][j].setPos(j, i);			//set position
			}
		}
	}
    
    newBlock() {
        let ri=0; let rj=0;
        do {
            ri = Math.floor(Math.random() * 4);
            rj = Math.floor(Math.random() * 4);
        } while (this.#board[ri][rj]);				//until fild blank space

        this.#board[ri][rj] = new Block(rj, ri);
		
		this.checkGameover();
    }
	
	checkGameover() {
		let movable = false;
		let full = false;
		let c = 0;
		
		for (var i=0; i<4; i++) {
			for (var j=0; j<4; j++) {
				if (this.#board[i][j]) c++;		//count filled space
			}
		}
		
		if (c == 16)
			full = true;
		else
			return;
			
		for (var i=0; i<4; i++) {
			for (var j=0; j<4; j++) {
				if (this.#board[i][j].Num == this.#board[i][j+1].Num)		//horizontal line check
					movable = true;
				if (this.#board[j][i].Num == this.#board[j+1][i].Num)		//vertical line check
					movable = true;
			}
		}
		
		if (!movable && full) 	//can't move and full
			this.gameOver();
	}
	
	gameOver() {
		this.update();
		
		setTimeout(function() {		//alert after display
			alert('Gameover!');
		}, 10);
	}
	
	updateScore() {
		this.#scoreEl.innerHTML = ('00000' + this.#score).slice(-5); 		//fill 5 digits with 0
	}

    update() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		
		this.positionBlocks();

        for (let blocks of this.#board) {
            for (let block of blocks) {
                if (!block)  continue;
                block.draw(this.#ctx);
            }
        }
		
		this.updateScore();
    }
}

class Block {
    #x; #y; #color; #n;

    static images = [];

    constructor (i, j) {
        this.setPos(i, j);
        this.#n = 0;
        this.#color = 'red';

        for (var i=0; i<19; i++) {
            Block.images.push(new Image());
            Block.images[i].src = 'res/rank'+i+'.png';
        }
    }

    get Num() { return this.#n };

    setPos(i, j) {
        this.#x = i * 100;
        this.#y = j * 100;
        return this;
    }

    increase() { this.#n++; };

    draw (ctx) {
        ctx.drawImage(Block.images[this.#n], this.#x, this.#y);
    }
}
