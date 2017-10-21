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
        this.shape = [];
        this.level = 1;
    }

    public pushNode(node: BABYLON.Vector2): void {
        this.shape.push(node);
    }

    public instantiate(scene: BABYLON.Scene): Building {
        let building: Building = new Building(scene);
        let rawData: IRawData = BuildingData.extrudeToSolidRaw(this.shape, this.level * 4);
        BuildingData.vertexDataFromRawData(rawData).applyToMesh(building);
        building.position.x = rawData.position.x;
        building.position.z = rawData.position.y;
        building.freezeWorldMatrix();

        return building;
    }

    public static extrudeToSolidRaw(
        points: BABYLON.Vector2[], height: number
    ): IRawData {
        let positions: number[] = [];
        let indices: number[] = [];
        let colors: number[] = [];
        let position: BABYLON.Vector2 = BABYLON.Vector2.Zero();
        let radius: number = 0;

        for (let i: number = 0; i < points.length; i++) {
            position.addInPlace(points[i]);
        }
        position.scaleInPlace(1 / points.length);

        for (let i: number = 0; i < points.length; i++) {
            positions.push(points[i].x - position.x, height, points[i].y - position.y);
            colors.push(1, 1, 1, 1);
        }
        for (let i: number = 0; i < points.length; i++) {
            positions.push(points[i].x - position.x, 0, points[i].y - position.y);
            colors.push(0.3, 0.3, 0.3, 1);
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

        return {
            positions: positions,
            indices: indices,
            colors: colors,
            position: position,
            radius: 1
        };
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