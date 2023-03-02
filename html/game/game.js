let PI_2 = Math.PI * 2;

let Vector2D = {
    add(vx, vy) {
        return [vx[0] + vy[0], vx[1] + vy[1]];
    },

    sub(vx, vy) {
        return [vx[0] - vy[0], vx[1] - vy[1]];
    },

    mul(factor, vector) {
        return [factor * vector[0], factor * vector[1]];
    },

    cross(vx, vy) {
        return vx[0] * vy[1] - vx[1] * vy[0];
    },

    length(vector) {
        return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    }
};

let AGHelper = {
    solve(params) {
        let detXY = params[0][0] * params[1][1] - params[0][1] * params[1][0];
        let detX = params[0][1] * params[1][2] - params[0][2] * params[1][1];
        let detY = params[0][0] * params[1][2] - params[0][2] * params[1][0];
        return [-detX / detXY, detY / detXY];
    },

    extendPoint(centre, vx, vy, radius, direction) {
        let rep = this.solve([
            [vx[1], -vx[0], radius * Vector2D.length[vx]],
            [vy[1], -vy[0], radius * Vector2D.length(vy)],
        ]);
        return Vector2D.add(centre, Vector2D.mul(direction, rep));
    },

    polyDirection(points) {
        let rep = [Vector2D.sub(points[0], points[points.length - 1]), Vector2D.sub(points[1], points[0])];
        let crossProduct = Vector2D.cross(rep[0], rep[1]);
        if (crossProduct > 0) {
            return 1;
        } else if (crossProduct < 0) {
            return -1;
        }

        for (let i = 1; i < points.length; ++i) {
            rep[0] = rep[1];
            if (i === points.length - 1) {
                rep[1] = Vector2D.sub(points[0], points[i]);
            } else {
                rep[1] = Vector2D.sub(points[i + 1], points[i]);
            }
            crossProduct = Vector2D.cross(rep[0], rep[1]);
            if (crossProduct > 0) {
                return 1;
            } else if (crossProduct < 0) {
                return -1;
            }
        }

        return 1;
    },

    pointInPoly(point, poly) {
        if (!poly.direction) {
            poly.direction = this.polyDirection(poly.points);
        };
        let border = Vector2D.sub(poly.points[0], poly.points[poly.points.length - 1]);
        let rep = Vector2D.sub(point, poly.points[0]);
        if (Vector2D.cross(border, rep) * poly.direction < 0) {
            return false;
        }
        for (let i = 1; i < poly.points.length; ++i) {
            border = Vector2D.sub(poly.points[i], poly.points[i - 1]);
            rep = Vector2D.sub(point, poly.points[i]);
            if (Vector2D.cross(border, rep) * poly.direction < 0) {
                return false;
            }
        }
        return true;
    }
};

class Stage {
    constructor(id) {
        this.id = id;
    }

    create() {};
    start(context, size, intentor) {};
    render(context, size, intentor) {};
    finish() {};
    keyDown(event, context, size, intentor) {};
    keyUp(event, context, size, intentor) {};
    mouseDown(context, size, intentor) {};
    mouseUp(context, size, intentor) {};
}

class Game {
    constructor(stages, publics) {
        this.stages = stages;
        this.current = 0;
        this.intentor = new Intentor(0, publics);
    }

    create() {
        this.stages.forEach(stage => {
            stage.create();
        });
    }

    start(context, size) {
        this.stages[this.current].start(context, size, this.intentor);
        while (this.intentor.toId != -1) {
            this.stages[this.current].finish();
            this.current = this.intentor.toId;
            this.intentor.forward();
            this.stages[this.current].start(context, size, this.intentor);
        }
    }

    render(context, size) {
        this.stages[this.current].render(context, size, this.intentor);
        while (this.intentor.toId != -1) {
            this.stages[this.current].finish();
            this.current = this.intentor.toId;
            this.intentor.forward();
            this.stages[this.current].start(context, size, this.intentor);
        }
    }

    keyDown(event, context, size) {
        this.stages[this.current].keyDown(event, context, size, this.intentor);
    }

    keyUp(event, context, size) {
        this.stages[this.current].keyUp(event, context, size, this.intentor);
    }

    mouseDown(context, size) {
        this.stages[this.current].mouseDown(context, size, this.intentor);
    }

    mouseUp(context, size) {
        this.stages[this.current].mouseUp(context, size, this.intentor);
    }
}

class Intentor {
    constructor(fromId, publics) {
        this.fromId = fromId;
        this.toId = -1;
        this.fromExtras = {};
        this.toExtras = {};
        this.publics = publics;
    }

    clearExtras() {
        this.toExtras = {};
    }

    getExtra(key) {
        return this.fromExtras[key];
    }

    extra(key, value) {
        this.toExtras[key] = value;
    }

    to(toId) {
        this.toId = toId;
    }

    forward() {
        this.fromId = this.toId;
        this.toId = -1;
        this.fromExtras = this.toExtras;
        this.toExtras = {};
    }
}

class Sprite {
    constructor(colliders, elements) {
        this.position = [0, 0];
        this.velocity = [0, 0];
        this.rotate = 0;
        this.scale = 1;
        this.colliders = colliders;
        this.elements = elements;
    }

    collide(sprite) {
        for (let i = 0; i < this.colliders.length; ++i) {
            MAIN: for (let j = 0; j < sprite.colliders.length; ++j) {
                let cx = this.colliders[i];
                let cy = sprite.colliders[j];
                if (cx.type === Collider.CIRCLE && cy.type === Collider.CIRCLE) {
                    let sx = Collider.getActualSize(cx, this, Collider.CIRCLE);
                    let sy = Collider.getActualSize(cy, sprite, Collider.CIRCLE);
                    if ((sx.radius + sy.radius) ** 2 > (sx.position[0] - sy.position[0]) ** 2 + (sx.position[1] - sy.position[1]) ** 2) {
                        return true;
                    }
                } else if (cx.type === Collider.CIRCLE && cy.type === Collider.POLY) {
                    let sx = Collider.getActualSize(cx, this, Collider.CIRCLE);
                    let sy = Collider.getActualSize(cy, sprite, Collider.POLY);
                    
                    if (AGHelper.pointInPoly(sx.position, sy)) {
                        return true;
                    }
                } else if (cy.type === Collider.CIRCLE && cx.type === Collider.POLY) {
                    let sx = Collider.getActualSize(cy, this, Collider.CIRCLE);
                    let sy = Collider.getActualSize(cx, sprite, Collider.POLY);
                    
                    if (AGHelper.pointInPoly(sx.position, sy)) {
                        return true;
                    }
                } else if (cx.type === Collider.POLY && cy.type === Collider.POLY) {
                    let normal, px, py;
                    for (let i = 0; i < cx.points.length; ++i) {
                        normal = this.getNormalVector(cx, i);
                        px = this.project(normal, cx);
                        py = this.project(normal, cy);
                        console.log([normal, px, py]);
                        if (px[1] < py[0] || py[1] < px[0]) {
                            continue MAIN;
                        }
                    }
                    for (let i = 0; i < cy.points.length; ++i) {
                        normal = this.getNormalVector(cy, i);
                        px = this.project(normal, cx);
                        py = this.project(normal, cy);
                        console.log([normal, px, py]);
                        if (px[1] < py[0] || py[1] < px[0]) {
                            continue MAIN;
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    }

    separateRegion(position) {
        let main = Math.asin(1 / Math.sqrt(position[0] ** 2 + position[1] ** 2));
        let phase = Math.atan2(position[0], position[1]);
        return PhaseRegion.strape(PhaseRegion.create([main - phase, Math.PI - main - phase]), PhaseRegion.create([Math.PI + main - phase, PI_2 - main - phase]));
    }

    getNormalVector(poly, index) {
        let vector = [0, 0];
        if (index === poly.points.length - 1) {
            vector[0] = poly.points[0][1] - poly.points[poly.points.length - 1][1];
            vector[1] = poly.points[poly.points.length - 1][0] - poly.points[0][0];
        } else {
            vector[0] = poly.points[index][1] - poly.points[index + 1][1];
            vector[1] = poly.points[index + 1][0] - poly.points[index][0];
        }
        return vector;
    }

    project(normal, poly) {
        let region = [this.dot(normal, poly.points[0]), this.dot(normal, poly.points[1])];
        let temp = 0;
        if (region[1] < region[0]) {
            temp = region[0];
            region[0] = region[1];
            region[1] = temp;
        }
        for (let i = 2; i < poly.points.length; ++i) {
            temp = this.dot(normal, poly.points[i]);
            if (temp < region[0]) {
                region[0] = temp;
            } else if (temp > region[1]) {
                region[1] = temp;
            }
        }
        return region;
    }

    dot(vx, vy) {
        return vx[0] * vy[0] + vx[1] * vy[1];
    }

    draw(context) {
        this.elements.forEach(element => {
            switch (element.type) {
                case Element.CIRCLE: {
                    let centre = Collider.transform(element.position, this);
                    if (element.fill) {
                        context.fillStyle = element.color;
                        context.resetTransform();
                        context.beginPath();
                        context.arc(centre[0], centre[1], element.radius * this.scale, 0, PI_2);
                        context.fill();
                    }
                    if (element.stroke) {
                        context.strokeStyle = element.color;
                        context.lineWidth = element.width;
                        context.resetTransform();
                        context.beginPath();
                        context.arc(centre[0], centre[1], element.radius * this.scale, 0, PI_2);
                        context.stroke();
                    }
                    break;
                }
                case Element.POLY: {
                    let point;
                    if (element.fill) {
                        context.fillStyle = element.color;
                        context.resetTransform();
                        context.beginPath();
                        point = Collider.transform(element.points[0], this);
                        context.moveTo(point[0], point[1]);
                        for (let i = 1; i < element.points.length; ++i) {
                            point = Collider.transform(element.points[i], this);
                            context.lineTo(point[0], point[1]);
                        }
                        context.fill();
                    }
                    if (element.stroke) {
                        context.strokeStyle = element.color;
                        context.lineWidth = element.width;
                        context.resetTransform();
                        context.beginPath();
                        point = Collider.transform(element.points[element.points.length - 1], this);
                        context.moveTo(point[0], point[1]);
                        for (let i = 0; i < element.points.length; ++i) {
                            point = Collider.transform(element.points[i], this);
                            context.lineTo(point[0], point[1]);
                        }
                        context.stroke();
                    }
                    break;
                }
                case Element.IMAGE: {
                    context.resetTransform();
                    context.translate(this.position[0], this.position[1]);
                    context.rotate(this.rotate);
                    context.scale(this.scale, this.scale);
                    context.drawImage(element.image, -element.cx, -element.cy);
                    break;
                }
                case Element.TEXT: {
                    context.resetTransform();
                    context.translate(this.position[0], this.position[1]);
                    context.rotate(this.rotate);
                    context.scale(this.scale, this.scale);
                    if (element.font) {
                        context.font = element.font;
                    }
                    if (element.baseline) {
                        context.textBaseline = element.baseline;
                    }

                    if (element.centre) {
                        let offset = context.measureText(element.text).width / 2;
                        if (element.fill) {
                            context.fillStyle = element.color;
                            context.fillText(element.text, element.position[0] - offset, element.position[1]);
                        }
                        if (element.stroke) {
                            context.strokeStyle = element.color;
                            context.lineWidth = element.width;
                            context.strokeText(element.text, element.position[0] - offset, element.position[1]);
                        }
                    } else {
                        if (element.fill) {
                            context.fillStyle = element.color;
                            context.fillText(element.text, element.position[0], element.position[1]);
                        }
                        if (element.stroke) {
                            context.strokeStyle = element.color;
                            context.lineWidth = element.width;
                            context.strokeText(element.text, element.position[0], element.position[1]);
                        }
                    }
                    break;
                }
            }
        });
    }

    attenuate(rate) {
        this.velocity[0] *= rate;
        this.velocity[1] *= rate;
    }

    locomote(deltaTime) {
        this.position[0] += this.velocity[0] * deltaTime;
        this.position[1] += this.velocity[1] * deltaTime;
    }
}

let Collider = {
    CIRCLE: 0,
    POLY: 1,
    getActualSize(collider, sprite, type) {
        switch (type) {
            case this.CIRCLE: {
                return {
                    position: this.transform([collider.x, collider.y], sprite),
                    points: [],
                    radius: collider.radius * sprite.scale,
                };
            }

            case this.POLY: {
                let actualSize = {
                    position: [],
                    points: [],
                    radius: 0,
                };
                collider.points.forEach(point => {
                    actualSize.points.push(this.transform(point, sprite));
                });
                return actualSize;
            }
        }
    },
    transform(position, sprite) {
        let r = Math.sqrt(position[0] ** 2 + position[1] ** 2) * sprite.scale;
        let theta = Math.atan2(position[1], position[0]) + sprite.rotate;
        return [sprite.position[0] + r * Math.cos(theta), sprite.position[1] + r * Math.sin(theta)];
    },
    createCircleCollider(cx, cy, r) {
        return {
            type: Collider.CIRCLE,
            x: cx,
            y: cy,
            radius: r,
        };
    },
    createPolyCollider(points) {
        return {
            type: Collider.POLY,
            points: points,
        };
    }
};

let Element = {
    CIRCLE: 0,
    POLY: 1,
    IMAGE: 2,
    TEXT: 3,
};

let PhaseRegion = {
    create(rawRegion) {
        if (Math.abs(rawRegion[0] - rawRegion[1]) >= PI_2) {
            return {
                full: true,
            };
        }
        if (rawRegion[0] === rawRegion[1]) {
            return {
                empty: true,
            };
        }

        let from = 0;
        let to = 0;
        if (rawRegion[0] < rawRegion[1]) {
            from = rawRegion[0] % PI_2;
            if (from < 0) {
                from += PI_2;
            }
            to = rawRegion[1] % PI_2;
            if (to < 0) {
                to += PI_2;
            }
        } else {
            from = rawRegion[1] % PI_2;
            if (from < 0) {
                from += PI_2;
            }
            to = rawRegion[0] % PI_2;
            if (to < 0) {
                to += PI_2;
            }
        }
        if (to < from) {
            let region = {
                regions: [],
            };
            if (to > 0) {
                region.regions.push([0, to]);
            }
            if (from < PI_2) {
                region.regions.push([from, PI_2]);
            }
            return region;
        }
        return {
            regions: [
                [from, to]
            ]
        };
    },

    complement(phaseRegion) {
        if (phaseRegion.empty) {
            return {
                full: true,
            };
        } else if (phaseRegion.full) {
            return {
                empty: true,
            };
        }

        let complemention = {
            regions: [],
        };

        if (phaseRegion.regions[0][0] !== 0) {
            complemention.regions.push([0, phaseRegion.regions[0][0]]);
        }
        for (let i = 0; i < phaseRegion.regions.length - 1; ++i) {
            complemention.regions.push([phaseRegion.regions[i][1], phaseRegion.regions[i + 1][0]]);
        }
        if (phaseRegion.regions[phaseRegion.regions.length - 1][1] !== PI_2) {
            complemention.regions.push([phaseRegion.regions[phaseRegion.regions.length - 1][1], PI_2]);
        }
        return complemention;
    },

    intersectSingle(rx, ry) {
        if (rx[0] >= ry[1] || ry[0] >= rx[1]) {
            return {
                empty: true,
            };
        }
        let place = [];
        let px = 0, py = 0;
        while (px !== 2 || py !== 2) {
            if (px === 2) {
                place.push(ry[py++]);
                continue;
            } else if (py === 2) {
                place.push(rx[px++]);
                continue;
            }
            if (rx[px] < ry[py]) {
                place.push(rx[px++]);
            } else {
                place.push(ry[py++]);
            }
        }
        return [place[1], place[2]];
    },

    intersect(rx, ry) {
        if (rx.empty) {
            return {
                empty: true,
            };
        }
        if (rx.full) {
            return ry;
        }
        if (ry.empty) {
            return {
                empty: true,
            };
        }
        if (ry.full) {
            return rx;
        }

        let intersection = {
            regions: [],
        };
        let px = 0;
        let py = 0;
        let last = true;
        while (px !== rx.regions.length * 2 - 1 && py !== ry.regions.length * 2 - 1) {
            if (last) {
                let region = [Math.max(this.getSerialized(rx, px), this.getSerialized(ry, py)), 0];
                if (this.getSerialized(rx, px + 1) < this.getSerialized(ry, py + 1)) {
                    region[1] = this.getSerialized(rx, ++px);
                } else {
                    region[1] = this.getSerialized(ry, ++py);
                }
                last = false;
                if (region[0] < region[1]) {
                    intersection.regions.push(region);
                }
                continue;
            }

            if (this.getSerialized(rx, px + 1) < this.getSerialized(ry, py + 1)) {
                ++px;
            } else {
                ++py;
            }
            if (px % 2 === 0 && py % 2 === 0) {
                last = true;
            }
        }

        if (intersection.regions.length === 0) {
            return {
                empty: true,
            };
        }
        return intersection;
    },

    strape(rx, ry) {
        let result = {
            regions: [],
        };
        rx.regions.forEach(region => {
            result.regions.push(region);
        });
        ry.regions.forEach(region => {
            result.regions.push(region);
        });
        return result;
    },

    getSerialized(region, index) {
        return region.regions[Math.floor(index / 2)][index % 2];
    }
};