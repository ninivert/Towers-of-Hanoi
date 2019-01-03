const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

//
// precreate folders
//

const mkdirSync = function (dirPath) {
	try {
		fs.mkdirSync(dirPath);
	}
	catch (err) {
		if (err.code !== 'EEXIST') throw err;
	}
}

mkdirSync(path.join(__dirname, "hanoi_imgs"));
mkdirSync(path.join(__dirname, "counter_imgs"))
mkdirSync(path.join(__dirname, "video_out"));

//
// arrrrrrguments
//

const ARGS = process.argv.slice(2).reduce((acc, arg) => {
    let [key, value = true] = arg.split("=");
    acc[key] = value;
    return acc;
}, {});

const LAYERS = parseInt(ARGS.layers) || 3;
const DURATION = parseInt(ARGS.duration) || 60;
const FPS = parseInt(ARGS.fps) || 30;
const SCALING = parseInt(ARGS.scaling) || 1;
const FORCE_FIRST = parseInt(ARGS.forcelast) || 1;
const FORCE_LAST = parseInt(ARGS.forcefirst) || 1;
const COUNTER_DISPLAY = ARGS.counter_display === "true" ? true : false;
const COUNTER_RENDER = ARGS.counter_render === "true" ? true : false;
const COUNTER_SIZE = parseInt(ARGS.counter_size) || 50;
const COUNTER_FONT = ARGS.counter_font || "Arial";
const COUNTER_TEXT = COUNTER_SIZE*SCALING + "px " + COUNTER_FONT;
const TOTAL_FRAMES_NATURAL = DURATION * FPS;
const TOTAL_FRAMES_FORCED = FORCE_LAST + FORCE_FIRST;
const TOTAL_ITERATIONS = Math.pow(2, LAYERS);
const FPI = TOTAL_FRAMES_NATURAL / TOTAL_ITERATIONS;
const LOGBREAK = 100;
let iteration = 0;
let lastframe = 0;
let framecount = 0;
const start = new Date();

//
// Hanoi recursive algorithm
//

let game = new Array(3).fill().map((pole, i) => {
	if (i == 0) {
		return new Array(LAYERS).fill().map((disk, radius) => {
			return 2*radius + 1;
		});
	}
	else return new Array(LAYERS).fill().map(() => 0);
});

function hanoi(count, origin, destination) {
	function move(origin, destination) {
		let stIndex = 0, mvIndex = LAYERS-1;
		while (game[origin][stIndex] === 0 && stIndex < LAYERS) ++stIndex;
		while (game[destination][mvIndex] !== 0 && mvIndex > 0) --mvIndex;
		game[destination][mvIndex] = game[origin][stIndex];
		game[origin][stIndex] = 0;

		++iteration;
		render();
	}

	if (count === 1) {
		move(origin, destination);
		return true;
	}

	let temp = 3-origin-destination;
	hanoi(count-1, origin, temp);
	move(origin, destination);
	hanoi(count-1, temp, destination);
}

//
// Rendering function
//

function render() {
	const force = iteration < FORCE_FIRST || iteration > TOTAL_ITERATIONS - FORCE_LAST - 1;
	const currframe = Math.ceil(iteration * FPI);
	const natural = currframe !== lastframe;

	if (natural || force) {
		draw();
		let buffer = canvas.toBuffer("image/png");
		fs.writeFileSync(path.join(__dirname, "hanoi_imgs", `hanoi_${framecount}.png`), buffer, "binary");

		if (COUNTER_RENDER) {
			draw_counter();
			let buffer = canvas_counter.toBuffer("image/png");
			fs.writeFileSync(path.join(__dirname, "counter_imgs", `counter_${framecount}.png`), buffer, "binary");
		}

		if (framecount % LOGBREAK === 0) {
			console.log(`Rendered frame ${framecount} (${Math.floor(iteration/TOTAL_ITERATIONS*100)}%), iteration ${iteration}`)
		}

		lastframe = currframe;
		++framecount;
	}
}

//
// Draw a given configuration onto the canvas
//

// Sizes
const DISKR = 10 * SCALING;
const DISKH = 20 * SCALING;
const POLEW = 10 * SCALING;
const SPACING = 40 * SCALING;
const PADDING = 10 * SCALING;
const GROUND = 30 * SCALING;
const CEILING = 30 * SCALING;
const POLEH = LAYERS*DISKH + DISKH/2;
const MAXR = (2*LAYERS+1)*DISKR;
const W = 2*PADDING + 4*SPACING + 6*MAXR;
const H = GROUND + POLEH + POLEW/2 + CEILING + SPACING + PADDING;
// Colours
const BGC = "#1e272e";
const DISKC = "#ffdd59";
const POLEC = "#d2dae2";
const GROUNDC = "#485460";

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

const DISKGRADIENT = ctx.createLinearGradient(0, H-GROUND, 0, H-(GROUND+POLEH));
DISKGRADIENT.addColorStop(0, "#ff5e57");
DISKGRADIENT.addColorStop(1, "#ffdd59");

//
// Draw hanoi
//

function draw() {
	// Fill background
	ctx.fillStyle = BGC;
	ctx.fillRect(0, 0, W, H);

	// Draw iteration number
	if (COUNTER_DISPLAY) {
		ctx.fillStyle = POLEC;
		ctx.font = COUNTER_TEXT;
		ctx.textAlign = "end";
		ctx.textBaseline = "hanging";
		ctx.fillText(iteration.toLocaleString('de-DE'), W-PADDING, PADDING);
	}

	ctx.lineCap = "round";

	for (let i = 0; i < 3; ++i) {
		const x = PADDING + (i+1)*(SPACING + MAXR*2) - MAXR;
		const base = H - GROUND;

		// Draw poles
		ctx.strokeStyle = POLEC;
		ctx.lineWidth = POLEW;
		ctx.beginPath();
		ctx.moveTo(x, base);
		ctx.lineTo(x, base - POLEH);
		ctx.stroke();

		// Draw disks
		for (let j = 0; j < LAYERS; ++j) {
			const radius = game[i][j];
			if (radius !== 0) {
				const y = base - (LAYERS-1)*DISKH + j*DISKH - DISKH/2;
				const w = radius*DISKR + DISKH/2;
				const r = DISKH/2;
				ctx.beginPath();
				ctx.moveTo(x-w, y-r);
				ctx.lineTo(x+w, y-r);
				ctx.arc(x+w, y, r, -Math.PI/2, Math.PI/2);
				ctx.lineTo(x+w, y+r);
				ctx.arc(x-w, y, r, Math.PI/2, 3*Math.PI/2);
				ctx.closePath();
				ctx.fillStyle = DISKGRADIENT;
				ctx.fill();
			}
		}
	}

	// Fill the ground
	ctx.fillStyle = GROUNDC;
	ctx.fillRect(0, H-GROUND, W, GROUND);
}

//
// Draw counter
//

const canvas_counter = createCanvas(0, 0);
const ctx_counter = canvas_counter.getContext("2d");


ctx_counter.font = COUNTER_TEXT;
ctx_counter.textAlign = "center";
ctx_counter.textBaseline = "middle";
const metrics = ctx_counter.measureText(TOTAL_ITERATIONS.toLocaleString('de-DE'));
// Added padding for antialising bleed
const COUNTERH = COUNTER_SIZE + 2;
const COUNTERW = metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft + 2;

canvas_counter.width = COUNTERW;
canvas_counter.height = COUNTERH;

function draw_counter() {
	ctx_counter.font = COUNTER_TEXT;
	ctx_counter.fillStyle = BGC;
	ctx_counter.fillRect(0, 0, COUNTERW, COUNTERH);
	ctx_counter.fillStyle = POLEC;
	ctx_counter.fillText(iteration.toLocaleString('de-DE'), COUNTERW/2, COUNTERH/2);
}

//
// Start
//

console.log(`LAYERS: ${LAYERS},
DURATION: ${DURATION},
FPS: ${FPS},
SCALING: ${SCALING},
FORCE_FIRST: ${FORCE_FIRST},
FORCE_LAST: ${FORCE_LAST},
COUNTER_DISPLAY: ${COUNTER_DISPLAY},
COUNTER_RENDER: ${COUNTER_RENDER},
COUNTER_SIZE: ${COUNTER_SIZE},
COUNTER_FONT: ${COUNTER_FONT},
COUNTER_TEXT: ${COUNTER_TEXT},`);
render();
hanoi(LAYERS, 0, 2);
console.log(`Finished after ${Math.floor((new Date() - start) / (iteration/TOTAL_ITERATIONS) / 1000)} seconds.`);