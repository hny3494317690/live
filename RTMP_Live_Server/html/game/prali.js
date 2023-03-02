function randomColor() {
    let r = Math.floor(Math.random() * 128);
    let g = Math.floor(Math.random() * 128);
    let b = Math.floor(Math.random() * 128);
    return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}

function arrayAdd(array, item) {
    for (let i = 0; i < array.length; ++i) {
        if (!array[i]) {
            array[i] = item;
            return;
        }
    }
    array[array.length] = item;
}

function randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a));
}

function randRange(range) {
    return range[0] + Math.random() * (range[1] - range[0]);
}

let Status = {
    IDLE: 0,
    COMBAT: 1,
    WAKE: 2,
    ENCROACH: 3,
};

class Key {
    constructor(code) {
        this.code = code;
        this.history = false;
        this.current = false;
        this.status = Status.IDLE;

        this.up = function() {
            return this.history && !this.current;
        };
        this.down = function() {
            return !this.history && this.current;
        };
    }
}

let prestartStage = {
    __proto__: new Stage(0),

    rhythm: [],
    pointer: [],

    frame: 0,
    combo: 0,
    tolerance: 60,
    drawTolerance: 6,
    keys: [
        new Key("d"),
        new Key("f"),
        new Key("g"),
        new Key("h"),
        new Key("j"),
        new Key("k"),
    ],

    judgeLineHeight: 0,
    judgeLineWidth: 5,
    gradient: null,
    gradientDark: null,
    gradientLight: null,

    wall: [0],
    wallSpace: 5,

    keyOffset: 20,

    particles: [],
    particleVelocity: [3, 10],
    particleAngle: [0, 2 * Math.PI],
    particleLife: [80, 120],
    particleSize: [5, 20],
    particleQuantity: 15,

    start: function(context, size, intentor) {
        for (let i = 0; i < this.keys.length; ++i) {
            this.rhythm.push([]);
            this.pointer.push(0);
            this.wall.push((i + 1) * size[0] / this.keys.length);
        }

        for (let i = 0; i < this.keys.length; ++i) {
            for (j = 800 + 80 * randInt(0, 20); j < 199999999;) {
                if (randInt(0, 8) === 0) {
                    let duration = Math.pow(2, randInt(1, 3)) * randInt(1, 8) * 40;
                    this.rhythm[i].push([j, j + duration]);
                    j += duration;

                    j += Math.pow(2, randInt(2, 6)) * randInt(1, 8) * 40 + 80;
                } else {
                    this.rhythm[i].push([j, j]);

                    j += Math.pow(2, randInt(1, 4)) * randInt(1, 6) * 40 + 80;
                }

                
            }
        }

        this.judgeLineHeight = size[1] * 0.6;

        this.gradient = context.createLinearGradient(0, 0, size[0], 0);
        this.gradient.addColorStop(0, "#FF0000");
        this.gradient.addColorStop(0.2, "#FFFF00");
        this.gradient.addColorStop(0.4, "#00FF00");
        this.gradient.addColorStop(0.6, "#00FFFF");
        this.gradient.addColorStop(0.8, "#0000FF");
        this.gradient.addColorStop(1, "#FF00FF");

        this.gradientDark = context.createLinearGradient(0, 0, size[0], 0);
        this.gradientDark.addColorStop(0, "#AA0000");
        this.gradientDark.addColorStop(0.2, "#AAAA00");
        this.gradientDark.addColorStop(0.4, "#00AA00");
        this.gradientDark.addColorStop(0.6, "#00AAAA");
        this.gradientDark.addColorStop(0.8, "#0000AA");
        this.gradientDark.addColorStop(1, "#AA00AA");

        this.gradientLight = context.createLinearGradient(0, 0, size[0], 0);
        this.gradientLight.addColorStop(0, "#FF5555");
        this.gradientLight.addColorStop(0.2, "#FFFF55");
        this.gradientLight.addColorStop(0.4, "#55FF55");
        this.gradientLight.addColorStop(0.6, "#55FFFF");
        this.gradientLight.addColorStop(0.8, "#5555FF");
        this.gradientLight.addColorStop(1, "#FF55FF");
    },

    render: function(context, size, intentor) {
        for (let i = 0; i < this.keys.length; ++i) {
            if (this.pointer[i] === this.rhythm[i].length) {
                continue;
            }
            let key = this.keys[i];

            if (key.status === Status.COMBAT) {
                if (key.up()) {
                    key.status = Status.IDLE;
                    this.combo = 0;
                    this.rhythm[i][this.pointer[i]++][2] = 2;
                    if (this.pointer[i] === this.rhythm[i].length) {
                        continue;
                    }
                }
            } else if (key.status === Status.IDLE && key.down()) {
                if (this.rhythm[i][this.pointer[i]][0] - this.frame <= this.tolerance) {
                    key.status = Status.COMBAT;
                    //++this.combo;
                } else {
                    key.status = Status.ENCROACH;
                }
            }
        }

        for (let i = 0; i < this.keys.length; ++i) {
            let key = this.keys[i];
            if (key.status === Status.COMBAT) {
                ++this.combo;
                this.addRandomParticle([(this.wall[i] + this.wall[i + 1]) / 2, this.judgeLineHeight], this.isShort(this.rhythm[i][this.pointer[i]]) ? this.particleQuantity : this.particleQuantity / 12);
            }
        }

        for (let i = 0; i < this.keys.length; ++i) {
            if (this.pointer[i] === this.rhythm[i].length) {
                continue;
            }
            let key = this.keys[i];

            if (key.status === Status.COMBAT && this.rhythm[i][this.pointer[i]][1] - this.frame <= (this.isShort(this.rhythm[i][this.pointer[i]]) ? this.tolerance : 0)) {
                key.status = Status.WAKE;
                this.rhythm[i][this.pointer[i]++][2] = 1;
                if (this.pointer[i] === this.rhythm[i].length) {
                    continue;
                }
            }
    
            if (key.status === Status.ENCROACH || key.status === Status.WAKE) {
                if (key.up()) {
                    key.status = Status.IDLE;
                } else if (this.frame - this.rhythm[i][this.pointer[i]][0] > this.tolerance) {
                    this.combo = 0;
                    this.rhythm[i][this.pointer[i]++][2] = 2;
                    if (this.pointer[i] === this.rhythm[i].length) {
                        continue;
                    }
                }
            }
    
            if (key.status === Status.IDLE && this.frame - this.rhythm[i][this.pointer[i]][0] > this.tolerance) {
                this.combo = 0;
                this.rhythm[i][this.pointer[i]++][2] = 2;
                if (this.pointer[i] === this.rhythm[i].length) {
                    continue;
                }
            }
        }

        this.locomoteParticle();
        
        for (let i = 0; i < this.keys.length; ++i) {
            this.keys[i].history = this.keys[i].current;
        }

        context.clearRect(0, 0, size[0], size[1]);

        //绘制旋律
        this.drawRhythm(context, size);

        //绘制combo
        {
            context.fillStyle = "#00AA00";
            context.font = "80px eva";
            let text = "COMBO   " + this.combo;
            let width = context.measureText(text).width;
            context.textBaseline = "top";
            context.fillText(text, (size[0] - width) / 2, 0);
        }

        //绘制墙壁
        context.beginPath();
        context.moveTo(this.wall[1], 0);
        for (let i = 1; i < this.keys.length; ++i) {
            context.lineTo(this.wall[i], size[1]);
            context.moveTo(this.wall[i + 1], 0);
        }
        context.strokeStyle = this.gradientLight;
        context.lineWidth = 2;
        context.setLineDash([40, 20]);
        context.stroke();
        context.setLineDash([1, 0]);

        //绘制按键
        context.fillStyle = this.gradient;
        context.font = "60px Arial";
        context.textBaseline = "bottom"
        for (let i = 0; i < this.keys.length; ++i) {
            let text = this.keys[i].code.toUpperCase();
            let width = context.measureText(text).width;
            context.fillText(text, (this.wall[i] + this.wall[i + 1]) / 2 - width / 2, this.judgeLineHeight - this.keyOffset);
        }

        //绘制粒子
        this.drawParticle(context);

        //绘制判定线
        context.fillStyle = this.gradient;
        context.fillRect(0, this.judgeLineHeight - this.judgeLineWidth / 2, size[0], this.judgeLineWidth);

        this.frame += 4;
    },

    keyDown: function(event, context, size, intentor) {
        for (let i = 0; i < this.keys.length; ++i) {
            if (event.key === this.keys[i].code) {
                this.keys[i].current = true;
                break;
            }
        }
    },
    keyUp: function(event, context, size, intentor) {
        for (let i = 0; i < this.keys.length; ++i) {
            if (event.key === this.keys[i].code) {
                this.keys[i].current = false;
                break;
            }
        }
    },

    drawRhythm: function(context, size) {
        for (let i = 0; i < this.keys.length; ++i) {
            for (let j = this.pointer[i]; j < this.rhythm[i].length; ++j) {
                if (!this.drawKey(this.rhythm[i][j], this.wall[i] + this.wallSpace, this.wall[i + 1] - this.wallSpace, size)) {
                    break;
                }
            }
            for (let j = this.pointer[i] - 1; j >= 0; --j) {
                if (!this.drawKey(this.rhythm[i][j], this.wall[i] + this.wallSpace, this.wall[i + 1] - this.wallSpace, size)) {
                    break;
                }
            }
        }
    },

    drawKey: function(duration, left, right, size) {
        let actualFrom = this.judgeLineHeight + this.frame - duration[0];
        let actualTo = this.judgeLineHeight + this.frame - duration[1];

        if (actualFrom + this.drawTolerance < 0 || actualTo - this.drawTolerance > size[1]) {
            return false;
        }

        if (duration[2] === 1) {
            return true;
        }

        if (duration[2] === 0 || !(duration[2])) {
            context.beginPath();

            context.strokeStyle = "#0000aa";
            context.fillStyle = "#90d7ec";
            context.lineWidth = 2;

            
            context.moveTo(right, actualTo);
            context.arc(right - this.drawTolerance, actualFrom, this.drawTolerance, 0, 0.5 * Math.PI);
            context.arc(left + this.drawTolerance, actualFrom, this.drawTolerance, 0.5 * Math.PI, Math.PI);
            context.arc(left + this.drawTolerance, actualTo, this.drawTolerance, Math.PI, 1.5 * Math.PI);
            context.arc(right - this.drawTolerance, actualTo, this.drawTolerance, 1.5 * Math.PI, 0);

            context.stroke();
            context.fill();
        } else {
            context.beginPath();
            
            context.strokeStyle = "#0000aa";
            context.fillStyle = "#f47a55";
            context.lineWidth = 2;

            
            context.moveTo(right, actualTo);
            context.arc(right - this.drawTolerance, actualFrom, this.drawTolerance, 0, 0.5 * Math.PI);
            context.arc(left + this.drawTolerance, actualFrom, this.drawTolerance, 0.5 * Math.PI, Math.PI);
            context.arc(left + this.drawTolerance, actualTo, this.drawTolerance, Math.PI, 1.5 * Math.PI);
            context.arc(right - this.drawTolerance, actualTo, this.drawTolerance, 1.5 * Math.PI, 0);

            context.stroke();
            context.fill();
        }

        return true;
    },

    addRandomParticle: function(position, quantity) {
        for (let i = 0; i < quantity; ++i) {
            let velocity = randRange(this.particleVelocity);
            let angle = randRange(this.particleAngle);
            let particle = new Particle([position[0], position[1]], [velocity * Math.cos(angle), velocity * Math.sin(angle)], randRange(this.particleSize), randRange(this.particleLife));
            arrayAdd(this.particles, particle);
        }
    },

    locomoteParticle: function() {
        for (let i = 0; i < this.particles.length; ++i) {
            let particle = this.particles[i];
            if (!particle) {
                continue;
            }

            particle.render();
            if (particle.life <= 0) {
                delete this.particles[i];
            }
        }
    },

    drawParticle: function(context) {
        context.fillStyle = this.gradient;
        for (let i = 0; i < this.particles.length; ++i) {
            let particle = this.particles[i];
            if (!particle) {
                continue;
            }

            context.globalAlpha = particle.life / particle.maxLife;
            context.fillRect(particle.position[0] - particle.size, particle.position[1] - particle.size, 2 * particle.size, 2 * particle.size);
        }
        context.globalAlpha = 1;
    },

    isShort(rhythm) {
        return rhythm[0] === rhythm[1];
    }
};

class Particle {
    constructor(position, velocity, size, life) {
        this.position = position;
        this.velocity = velocity;
        this.size = size;
        this.maxLife = this.life = life;
    }

    render() {
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];
        this.velocity[1] += 0.3;
        --this.life;
    }
}

let publics = {};
let game = new Game([
    prestartStage,
], publics);