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

    constructor() {
        BuildingData.instances.push(this);
        this.shape = [];
        this.level = 1;
    }

    public pushNode(node: BABYLON.Vector2): void {
        this.shape.push(node);
    }

    public instantiate(scene: BABYLON.Scene): Building {
        let building: Building = new Building(scene);
        let rawData: IRawData = BuildingData.extrudeToSolidRaw(this.shape, this.level);
        BuildingData.vertexDataFromRawData(rawData).applyToMesh(building);
        building.position.x = rawData.position.x;
        building.position.z = rawData.position.y;
        building.freezeWorldMatrix();

        return building;
    }

    public static extrudeToSolidRaw(
        points: BABYLON.Vector2[], level: number
    ): IRawData {
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
            let a: BABYLON.Vector2 = points[i];
            let b: BABYLON.Vector2 = points[i + 1];
            if (!b) {
                b = points[0];
            }
            let l: number = BABYLON.Vector2.Distance(a, b);
            for (let d: number = 1; d < l - 2; d += 2) {
                for (let h: number = 0; h < level; h++) {
                    BuildingData.pushWindow(
                        points[i].x - position.x,
                        points[i].y - position.y,
                        points[i + 1].x - position.x,
                        points[i + 1].y - position.y,
                        d, 
                        0.8 + h * 2.5,
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

        positions.push(p0.x, h, p0.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p1.x, h, p1.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p1.x, h + 1, p1.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p0.x, h + 1, p0.y);
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

    public static extrudeToSolid(points: BABYLON.Vector2[], height: number): BABYLON.VertexData {
        let data: BABYLON.VertexData = new BABYLON.VertexData();

        let rawData = BuildingData.extrudeToSolidRaw(points, height);

        data.positions = rawData.positions;
        data.indices = rawData.indices;
        data.colors = rawData.colors;

        return data;
    }
}