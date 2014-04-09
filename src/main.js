var $ = require('jquery');
var SimplexNoise = require('simplex-noise');
var Vector2 = require('vecmath').Vector2;

var smoothstep = require('interpolation').smoothstep;
var lerp = require('interpolation').lerp;

var NoiseMap = require('./util/NoiseMap');
var imagedata = require('./util/imagedata');

var Particle = require('./impression').Particle;

var dat = require('dat-gui');

var tmp = new Vector2();
var tmp2 = new Vector2();
var raf = require('raf.js');

var width,
	height;



$(function() {
	var canvas = $("<canvas>").appendTo(document.body)[0];

	width = window.innerWidth,
	height = window.innerHeight;

    canvas.width = width;
	canvas.height = height;

	var context = canvas.getContext("2d");
	var noiseSize = 256;
	var noise = new NoiseMap(noiseSize);
	noise.scale = 3.2;
	// noise.seamless = true;
	noise.smoothing = true;
	noise.generate();

	$(window).bind('orientationchange', rotate);

	function rotate(){
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		setupParticles();
		animateIn();
	}


	var image = new Image();
	image.onload = handleImageLoad;
	image.src = "img/bg.png";

	var imagePixels;

	var options = {
		scale: noise.scale,
		shift: false,
		painting: true,

		//stroke options
		count: 1500,
		length: 33,
		thickness: 16.0,
		speed: 50.0,
		life: 1.0, 
		alpha: 0.25,
		round: true,
		motion: true,
		angle: 1,

		//color
		useOriginal: true,
		hue: 70,
		saturation: 1.0,
		lightness: 1.0,
		grain: .7,

		background: '#2f2f2f',
		clear: clear,
		animate: animateIn,
		viewOriginal: false,
	};

	$(document.body).css('background', options.background);

	$(image).appendTo(document.body).css({
		visibility: 'hidden',
		display: 'none'
	}).addClass('overlay original');
	
	var gui;


	var particles = [],
		count = 500,
		step = 0,
		time = 0;
	setupParticles();

	animateIn();

	function handleImageLoad() {
		imagePixels = imagedata.getImageData(image).data;
				
		// context.fillStyle = '#ebebeb';
		clearRect();

		// context.globalAlpha = 1;
		// context.drawImage(image, 0, 0);

		requestAnimationFrame(render);
	}

	function updateAnimation() {

		//wtf dat.gui...
		for (var k in gui.__folders.stroke.__controllers) {
			gui.__folders.stroke.__controllers[k].updateDisplay();
		}
		for (var k in gui.__folders.color.__controllers) {
			gui.__folders.color.__controllers[k].updateDisplay();
		}
	}


	function animateIn() {
		TweenLite.killTweensOf(options);
		updateAnimation();

		// TweenLite.to(options, 1.0, {
		// 	grain: 1.0,
		// 	onUpdate: updateGrain.bind(this),
		// });

		TweenLite.fromTo(options, 1.0, {
			thickness: 30,
		}, {
			thickness: 20,
			ease: Expo.easeOut,
			delay: 2.0,
		})
		TweenLite.fromTo(options, 3.0, {
			length: 23,
			alpha: 0.3,
			life: 0.7,
			// round: true,
			speed: 1,
		}, {
			life: 0.5,
			alpha: 0.2,
			length: 70,
			speed: 0.6,
			delay: 1.0,
			// ease: Expo.easeOut,
			onUpdate: updateAnimation.bind(this)
		});
		TweenLite.to(options, 3.0, {
			thickness: 7.0,
			length: 30,
			// onComplete: function() {
			// 	options.round = true;
			// },
			delay: 4.0,
		});
		TweenLite.to(options, 1.0, {
			length: 10,
			delay: 6.0,
		})
	}

	function setupParticles() {
		particles.length = 0;
		for (var i=0; i<count; i++) {
			particles.push(new Particle().reset(width, height).random());
		}
	}

	function updateGrain() {
		noiseOverlay.css('opacity', options.grain*0.2);
	}

	function clearRect() {
		context.globalAlpha = 1.0;
		context.fillStyle = options.background;
		context.fillRect(0, 0, width, height);
	}

	function clear() {
		TweenLite.killTweensOf(options);
		clearRect();
		setupParticles();
	}



	function render() {
		requestAnimationFrame(render);
		time+=0.1;
		step++;


		if (!options.painting )
			return;

		if (options.shift && step % 20 === 0) {
			noise.offset+=.01;
			noise.generate();
		}

		// context.globalAlpha = 0.1;
		// context.fillStyle = 'white';
		// context.fillRect(0, 0, width, height);

		// context.clearRect(0, 0, width, height);
		var imageWidth = image.width;

		// for (var y=0; y<height; y++) {
		// 	for (var x=0; x<width; x++) {
		// 		var sampleWidth = width,
		// 			sampleHeight = width;

		// 		var pxIndex = (x + (y * imageWidth))*4;
		// 		var red = imagePixels[ pxIndex ],
		// 			green = imagePixels[ pxIndex + 1],
		// 			blue = imagePixels[pxIndex + 2];
		// 		context.fillStyle = 'rgb('+red+', '+green+', '+blue+')';

		// 		// var n = noise.sample(x*(noiseSize/sampleWidth), y*(noiseSize/sampleHeight));
		// 		// context.fillStyle = 'hsl(0, 0%, '+((n/2+0.5)*100)+'%)';
		// 		context.fillRect(x, y, 1, 1);
		// 	}
		// }
		

		for (var i=0; i<particles.length; i++) {
			var p = particles[i];

			if (p.motion)
				p.position.add(p.velocity);

			//add in our motion
			var px = ~~p.position.x,
				py = ~~p.position.y;

			var sampleWidth = width,
				sampleHeight = width;

			var n = noise.sample(px*(noiseSize/sampleWidth), py*(noiseSize/sampleHeight));

			var angle = n * Math.PI * 2 * options.angle;
			
			tmp.set( Math.cos(angle), Math.sin(angle) );
			p.velocity.add(tmp);
			p.velocity.normalize();

			// if (p.position.x > width || p.position.x < 0 || p.position.y > height || p.position.y < 0 ) {
			// 	p.reset();
			// }

			if (/*p.position.x < 0 || */p.position.x > width || p.position.y > height || p.position.y < 0) {
				p.reset();
			}

			var rot = (n/2+0.5);
			var hue = (noise.offset % 50)/50 * rot;

			var pxIndex = (px + (py * imageWidth))*4;
			var red = imagePixels[ pxIndex ],
				green = imagePixels[ pxIndex + 1],
				blue = imagePixels[pxIndex + 2];

			// var alpha = Math.sin(time*0.1)*100+100;
			var alpha = options.hue;

			// CIE luminance for the RGB
			var val = 0.2126 * (red/255) + 0.7152 * (green/255) + 0.0722 * (blue/255);
			

			var brightness = val;
			
			// context.strokeStyle = 'hsl('+lerp(alpha, alpha-100, rot)+', '+(1-red/255)*lerp(0.7, 1, rot)*100+'%, '+lerp(0.45, 0.55, rot)*100+'%)';
			if (options.useOriginal)
				context.strokeStyle = 'rgb('+~~(red*brightness)+', '+~~(green*brightness)+', '+~~(blue*brightness)+')';
			else
				context.strokeStyle = 'hsl('+lerp(alpha, alpha-100, rot)+', '+(1-val)*lerp(0.2, 0.9, rot)*options.saturation*100+'%, '+(val)*lerp(0.45, 1, rot)*options.lightness*100+'%)';

			var s = 2;

			// context.fillStyle = 'black';
			// context.fillRect(p.position.x, p.position.y, 1, 1);

		 	context.beginPath();
			context.moveTo(p.position.x, p.position.y);
			var lineSize = (options.length*(n/2+0.5)*p.size);
			tmp.copy(p.position);
			tmp2.copy(p.velocity).scale(lineSize);
			tmp.add(tmp2);
			context.lineTo(tmp.x, tmp.y);
			context.stroke();
			context.globalAlpha = options.alpha;
			context.lineWidth = options.thickness*(n/2+0.5);
			context.lineCap = options.round ? 'round' : 'square';

			p.size += 0.1 * options.speed * p.speed;
			if (p.size >= options.life) {
				p.reset(width, height).random();	
			}
			
		}

	}
});