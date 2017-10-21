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

class RNode {
    
    public position: BABYLON.Vector2;
    public edges: REdge[] = [];
    public intersections: number[] = [];

    constructor(position: BABYLON.Vector2) {
        this.position = position;
    }

    public linkTo(n: RNode): void {
        if (!this.isLinkedTo(n)) {
            let edge: REdge = new REdge(this, n);
            this.edges.push(edge);
            n.edges.push(edge);
        }
    }

    public isLinkedTo(n: RNode): boolean {
        for (let i: number = 0; i < this.edges.length; i++) {
            if (this.edges[i].a === n) {
                return true;
            }
            if (this.edges[i].b === n) {
                return true;
            }
        }
        return false;
    }

    private _x: BABYLON.Vector2 = new BABYLON.Vector2(1, 0);
    private _a: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _b: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public sortEdges(): void {
        this.edges.sort(
            (a, b) => {
                this._a.copyFrom(a.other(this).position);
                this._a.subtractInPlace(this.position);
                this._a.normalize();
                this._b.copyFrom(b.other(this).position);
                this._b.subtractInPlace(this.position);
                this._b.normalize();
                return Tools.AngleFromTo(this._x, this._a) - Tools.AngleFromTo(this._x, this._b);
            }
        );
    }
}

class REdge {

    public a: RNode;
    public b: RNode;
    public intersections: number[] = [];

    constructor(
        a: RNode,
        b: RNode
    ) {
        this.a = a;
        this.b = b;
    }

    public other(n: RNode): RNode {
        if (this.a === n) {
            return this.b;
        }
        if (this.b === n) {
            return this.a;
        }
        console.warn("Request edge 'other node' giving unrelated node.");
        return undefined;
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
        let nodesMap: Map<BABYLON.Vector2, RNode> = new Map<BABYLON.Vector2, RNode>();

        let positions: number[] = [];
        let indices: number[] = [];

        this.toDoList.forEach(
            (road: RoadData) => {
                for (let i: number = 0; i < road.nodes.length - 1; i++) {
                    let aPosition: BABYLON.Vector2 = road.nodes[i];
                    let bPosition: BABYLON.Vector2 = road.nodes[i + 1];

                    let aRNode: RNode = nodesMap.get(aPosition);
                    if (!aRNode) {
                        aRNode = new RNode(aPosition);
                        nodesMap.set(aPosition, aRNode);
                    }
                    let bRNode: RNode = nodesMap.get(bPosition);
                    if (!bRNode) {
                        bRNode = new RNode(bPosition);
                        nodesMap.set(bPosition, bRNode);
                    }
                    aRNode.linkTo(bRNode);
                }
            }
        );

        nodesMap.forEach(
            (rNode: RNode) => {
                
                rNode.sortEdges();

                let intersections: number[] = [];
                for (let i: number = 0; i < rNode.edges.length; i++) {
                    this._a.copyFrom(rNode.edges[i].other(rNode).position);
                    this._a.subtractInPlace(rNode.position);
                    this._a.normalize();
                    if (rNode.edges[i + 1]) {
                        this._b.copyFrom(rNode.edges[i + 1].other(rNode).position);
                    } else {
                        this._b.copyFrom(rNode.edges[0].other(rNode).position);
                    }
                    this._b.subtractInPlace(rNode.position);
                    this._b.normalize();

                    Tools.RotateToRef(this._a, Math.PI / 2, this._na);
                    Tools.RotateToRef(this._b, - Math.PI / 2, this._nb);

                    let x1: number = rNode.position.x + this._na.x;
                    let y1: number = rNode.position.y + this._na.y;
                    let x2: number = x1 + this._a.x;
                    let y2: number = y1 + this._a.y;
                    let x3: number = rNode.position.x + this._nb.x;
                    let y3: number = rNode.position.y + this._nb.y;
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