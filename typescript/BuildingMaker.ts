class BuildingMaker {

    public toDoList: BuildingData[];

    constructor() {
        this.toDoList = [];
        Main.instance.scene.registerBeforeRender(this.stepInstantiate);
    }

    public stepInstantiate = () => {
        let t0: number = (new Date()).getTime();
        let t1: number = t0;
        let work: boolean = false;
        if (this.toDoList.length > 0) {
            work = true;
        }
        while (this.toDoList.length > 0 && (t1 - t0) < 10) {
            let data: BuildingData = this.toDoList.pop();
            data.instantiate(Main.instance.scene);
            t1 = (new Date()).getTime();
        }
        if (work && this.toDoList.length === 0) {
            Failure.update();
        }
    }
}

class RoadMaker {

    public toDoList: RoadData[];

    constructor() {
        this.toDoList = [];
        Main.instance.scene.registerBeforeRender(this.stepInstantiate);
    }

    public stepInstantiate = () => {
        let t0: number = (new Date()).getTime();
        let t1: number = t0;
        let work: boolean = false;
        if (this.toDoList.length > 0) {
            work = true;
        }
        while (this.toDoList.length > 0 && (t1 - t0) < 10) {
            let data: RoadData = this.toDoList.pop();
            data.instantiate(Main.instance.scene);
            t1 = (new Date()).getTime();
        }
        if (work && this.toDoList.length === 0) {
            Failure.update();
        }
    }

    private _x: BABYLON.Vector2 = new BABYLON.Vector2(1, 0);
    private _a: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _b: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _na: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _nb: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public instantiateNetwork(scene: BABYLON.Scene): BABYLON.Mesh {
        let nodesMap: Map<BABYLON.Vector2, BABYLON.Vector2[]> = new Map<BABYLON.Vector2, BABYLON.Vector2[]>();

        let positions: number[] = [];
        let indices: number[] = [];

        this.toDoList.forEach(
            (road: RoadData) => {
                for (let i: number = 0; i < road.nodes.length - 1; i++) {
                    let a: BABYLON.Vector2 = road.nodes[i];
                    let b: BABYLON.Vector2 = road.nodes[i + 1];

                    let aLinks: BABYLON.Vector2[] = nodesMap.get(a);
                    if (!aLinks) {
                        aLinks = [];
                        nodesMap.set(a, aLinks);
                    }
                    let bLinks: BABYLON.Vector2[] = nodesMap.get(b);
                    if (!bLinks) {
                        bLinks = [];
                        nodesMap.set(b, bLinks);
                    }
                    if (aLinks.indexOf(b) === -1) {
                        aLinks.push(b);
                    }
                    if (bLinks.indexOf(a) === -1) {
                        bLinks.push(a);
                    }
                }
            }
        );

        nodesMap.forEach(
            (links: BABYLON.Vector2[], node: BABYLON.Vector2) => {
                this._a.copyFrom(links[0]);
                this._a.subtractInPlace(node);
                this._a.normalize();

                links.sort(
                    (a, b) => {
                        this._a.copyFrom(a);
                        this._a.subtractInPlace(node);
                        this._a.normalize();
                        this._b.copyFrom(b);
                        this._b.subtractInPlace(node);
                        this._b.normalize();
                        return Tools.AngleFromTo(this._x, this._a) - Tools.AngleFromTo(this._x, this._b);
                    }
                );

                let intersections: number[] = [];
                for (let i: number = 0; i < links.length; i++) {
                    this._a.copyFrom(links[i]);
                    this._a.subtractInPlace(node);
                    this._a.normalize();
                    if (links[i + 1]) {
                        this._b.copyFrom(links[i + 1]);
                    } else {
                        this._b.copyFrom(links[0]);
                    }
                    this._b.subtractInPlace(node);
                    this._b.normalize();

                    Tools.RotateToRef(this._a, Math.PI / 2, this._na);
                    Tools.RotateToRef(this._b, - Math.PI / 2, this._nb);

                    let x1: number = node.x + this._na.x;
                    let y1: number = node.y + this._na.y;
                    let x2: number = x1 + this._a.x;
                    let y2: number = y1 + this._a.y;
                    let x3: number = node.x + this._nb.x;
                    let y3: number = node.y + this._nb.y;
                    let x4: number = x3 + this._b.x;
                    let y4: number = y3 + this._b.y;

                    let det: number = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

                    if (det === 0) {
                        intersections.push(x1, y1);
                    } else {
                        let x: number = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
                        x = x / det;
                        let y: number = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
                        y = y / det;
                        
                        intersections.push(x, y);
                    }
                }
                if (intersections.length > 2) {
                    let nodeIndices = Earcut.earcut(intersections, [], 2);
                    for (let i: number = 0; i < nodeIndices.length; i++) {
                        nodeIndices[i] += positions.length / 3;
                    }
                    indices.push(...nodeIndices);
                    for (let i: number = 0; i < intersections.length / 2; i++) {
                        positions.push(
                            intersections[2 * i],
                            0.5,
                            intersections[2 * i + 1]
                        );
                    }
                }
                if (intersections.length > 8) {
                    console.log("-----");
                    intersections.forEach(
                        (n) => {
                            console.log(n);
                        }
                    )
                }
            }
        );

        let data: BABYLON.VertexData = new BABYLON.VertexData();
        data.positions = positions;
        data.indices = indices;
        console.log(data);

        let mesh: BABYLON.Mesh = new BABYLON.Mesh("RoadNetwork", scene);
        data.applyToMesh(mesh);

        return mesh;
    }
}