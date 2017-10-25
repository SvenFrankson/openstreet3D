interface IRawData {
    positions: number[];
    indices: number[];
    colors: number[];
    position: BABYLON.Vector2;
    radius: number;
}

class BuildingData {
    public static instances: BuildingData[] = [];
    public shape: BABYLON.Vector2[];
    public level: number;
    public doorIndex: number = -1;

    constructor() {
        BuildingData.instances.push(this);
        this.shape = [];
        this.level = 1;
    }

    public pushNode(node: BABYLON.Vector2): void {
        this.shape.push(node);
    }

    public instantiate(graph: RGraph, scene: BABYLON.Scene): Building {
        let building: Building = new Building(scene);
        let rawData: IRawData = this.extrudeToSolidRaw(graph, this.shape, this.level);
        BuildingData.vertexDataFromRawData(rawData).applyToMesh(building);
        building.position.x = rawData.position.x;
        building.position.z = rawData.position.y;
        building.freezeWorldMatrix();

        return building;
    }

    private _origin: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _direction: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public computeDoorIndex(graph: RGraph): void {
        let best: RIntersectionInfo = new RIntersectionInfo();
        for (let i: number = 0; i < this.shape.length; i++) {
            let iP: number = (i + 1) % this.shape.length;
            this._origin.copyFrom(this.shape[i]);
            this._origin.addInPlace(this.shape[iP]);
            this._origin.scaleInPlace(0.5);
            
            this._direction.copyFrom(this.shape[iP]);
            this._direction.subtractInPlace(this.shape[i]);
            Tools.RotateToRef(this._direction, - Math.PI / 2, this._direction);
            this._direction.normalize();

            let intersection: RIntersectionInfo = graph.intersect(this._origin, this._direction);
            if (intersection.intersects) {
                if (!best.intersects || intersection.sqrDistance < best.sqrDistance) {
                    best = intersection;
                    this.doorIndex = i;
                }
            }
        }
    }

    public extrudeToSolidRaw(
        graph: RGraph, points: BABYLON.Vector2[], level: number
    ): IRawData {
        this.computeDoorIndex(graph);

        let positions: number[] = [];
        let indices: number[] = [];
        let colors: number[] = [];
        let position: BABYLON.Vector2 = BABYLON.Vector2.Zero();
        let radius: number = 0;

        let color1: BABYLON.Color3 = BABYLON.Color3.FromHexString(Config.color1);
        let color2: BABYLON.Color3 = BABYLON.Color3.FromHexString(Config.backgroundColor);

        for (let i: number = 0; i < points.length; i++) {
            position.addInPlace(points[i]);
        }
        position.scaleInPlace(1 / points.length);

        for (let i: number = 0; i < points.length; i++) {
            positions.push(points[i].x - position.x, level * 2.5, points[i].y - position.y);
            colors.push(color1.r, color1.g, color1.b, 1);
        }
        for (let i: number = 0; i < points.length; i++) {
            positions.push(points[i].x - position.x, 0, points[i].y - position.y);
            colors.push(color2.r, color2.g, color2.b, 1);
        }

        for (let i: number = 0; i < points.length; i++) {
            let a: number = i + points.length;
            let b: number = i + points.length + 1;
            if (i === points.length - 1) {
                b = points.length;
            }
            let c: number = i + 1;
            if (i === points.length - 1) {
                c = 0;
            }
            let d: number = i;

            indices.push(a, b, c);
            indices.push(a, c, d);
        }

        let topPoints: number[] = [];
        for (let i: number = 0; i < points.length; i++) {
            topPoints.push(points[i].x, points[i].y);
        }
        indices.push(...Earcut.earcut(topPoints, [], 2));

        for (let i: number = 0; i < points.length; i++) {
            let iP: number = i + 1;
            if (iP >= points.length) {
                iP = 0;
            }
            let a: BABYLON.Vector2 = points[i];
            let b: BABYLON.Vector2 = points[iP];
            if (!b) {
                b = points[0];
            }
            let l: number = BABYLON.Vector2.Distance(a, b);
            for (let d: number = 1; d < l - 2; d += 2) {
                for (let y: number = 0; y < level; y++) {
                    let offset: number = 0.8;
                    let h: number = 1;
                    if (y === 0) {
                        if (i === this.doorIndex) {
                            if (d === 1) {
                                h = 2;
                                offset = 0;
                            }
                        }
                    }
                    BuildingData.pushWindow(
                        points[i].x - position.x,
                        points[i].y - position.y,
                        points[iP].x - position.x,
                        points[iP].y - position.y,
                        d, 
                        offset + y * 2.5,
                        h,
                        positions,
                        indices,
                        colors
                    );
                }
            }
        }

        return {
            positions: positions,
            indices: indices,
            colors: colors,
            position: position,
            radius: 1
        };
    }

    public static _dir: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public static _norm: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public static pushWindow(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x: number,
        y: number,
        h: number,
        positions: number[],
        indices: number[],
        colors: number[]
    ): void {
        let color: BABYLON.Color3 = BABYLON.Color3.FromHexString(Config.color2);
        BuildingData._dir.copyFromFloats(
            x2 - x1,
            y2 - y1
        );
        BuildingData._dir.normalize();
        Tools.RotateToRef(BuildingData._dir, - Math.PI / 2, BuildingData._norm);

        let p0: BABYLON.Vector2 = new BABYLON.Vector2(x1, y1);
        p0.addInPlace(BuildingData._dir.scale(x));
        p0.addInPlace(BuildingData._norm.scale(0.1));
        let p1: BABYLON.Vector2 = p0.clone();
        p1.addInPlace(BuildingData._dir);

        let i: number = positions.length / 3;

        positions.push(p0.x, y, p0.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p1.x, y, p1.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p1.x, y + h, p1.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p0.x, y + h, p0.y);
        colors.push(color.r, color.g, color.b, 1);

        indices.push(i, i + 1, i + 2);
        indices.push(i, i + 2, i + 3);
    }

    public static vertexDataFromRawData(rawData: IRawData): BABYLON.VertexData {
        let data: BABYLON.VertexData = new BABYLON.VertexData();

        data.positions = rawData.positions;
        data.indices = rawData.indices;
        data.colors = rawData.colors;

        return data;
    }
}