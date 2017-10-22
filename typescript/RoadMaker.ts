class RIntersectionInfo {
    
    public intersects: boolean = false;
    public position: BABYLON.Vector2;
    public sqrDistance: number;
}

class RGraph {

    public nodes: Map<BABYLON.Vector2, RNode> = new Map<BABYLON.Vector2, RNode>();
    public edges: REdge[] = [];

    public intersect(origin: BABYLON.Vector2, direction: BABYLON.Vector2): RIntersectionInfo {
        let result: RIntersectionInfo = new RIntersectionInfo();
        
        this.edges.forEach(
            (e: REdge) => {
                let currentResult: RIntersectionInfo = e.intersect(origin, direction);
                if (currentResult.intersects) {
                    if (!result.intersects || currentResult.sqrDistance < result.sqrDistance) {
                        result = currentResult;
                    }
                }
            }
        );

        return result;
    }
}

class RNode {
    
    public graph: RGraph;
    public position: BABYLON.Vector2;
    public edges: REdge[] = [];
    public intersections: number[] = [];

    constructor(position: BABYLON.Vector2, graph: RGraph) {
        this.position = position;
        graph.nodes.set(position, this);
        this.graph = graph;
    }

    public linkTo(n: RNode, width: number): void {
        if (!this.isLinkedTo(n)) {
            let edge: REdge = new REdge(this, n, width, this.graph);
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
    public width: number;
    public intersections: BABYLON.Vector2[] = [];

    constructor(
        a: RNode,
        b: RNode,
        width: number,
        graph: RGraph
    ) {
        this.a = a;
        this.b = b;
        this.width = width;
        graph.edges.push(this);
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

    private static _oi: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private static _ia: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private static _ib: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public intersect(origin: BABYLON.Vector2, direction: BABYLON.Vector2): RIntersectionInfo {
        let result: RIntersectionInfo = new RIntersectionInfo();
        let x1: number = this.a.position.x;
        let y1: number = this.a.position.y;
        let x2: number = this.b.position.x;
        let y2: number = this.b.position.y;
        let x3: number = origin.x;
        let y3: number = origin.y;
        let x4: number = x3 + direction.x;
        let y4: number = y3 + direction.y;

        let det: number = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (det === 0) {
            return result;
        }

        let x: number = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
        x = x / det;
        let y: number = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
        y = y / det;

        let intersection: BABYLON.Vector2 = new BABYLON.Vector2(x, y);

        REdge._oi.copyFrom(intersection);
        REdge._oi.subtractInPlace(origin);
        REdge._ia.copyFrom(this.a.position);
        REdge._ia.subtractInPlace(intersection);
        REdge._ib.copyFrom(this.b.position);
        REdge._ib.subtractInPlace(intersection);

        if (BABYLON.Vector2.Dot(REdge._oi, direction) < 0) {
            return result;
        }
        if (BABYLON.Vector2.Dot(REdge._ia, REdge._ib) > 0) {
            return result;
        }

        result.intersects = true;
        result.position = new BABYLON.Vector2(x, y);
        result.sqrDistance = BABYLON.Vector2.DistanceSquared(result.position, origin);

        return result;
    }

    private _c: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _x: BABYLON.Vector2 = new BABYLON.Vector2(1, 0);
    private _a: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private _b: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public sortIntersections(): void {
        if (this.intersections.length === 4) {
            this._c.copyFromFloats(0, 0);
            for (let i: number = 0; i < this.intersections.length; i++) {
                this._c.addInPlace(this.intersections[i]);
            }
            this._c.scaleInPlace(0.25);
            this.intersections.sort(
                (a, b) => {
                    this._a.copyFrom(a);
                    this._a.subtractInPlace(this._c);
                    this._a.normalize();
                    this._b.copyFrom(b);
                    this._b.subtractInPlace(this._c);
                    this._b.normalize();
                    return Tools.AngleFromTo(this._x, this._a) - Tools.AngleFromTo(this._x, this._b);
                }
            );
        } else {
            console.warn("Request edge 'sort intersections' but 4 points cannot be found.");
        }
    }
}

class RoadMaker {

    public toDoList: RoadData[];
    public graph: RGraph;

    constructor() {
        this.toDoList = [];
        // Main.instance.scene.registerBeforeRender(this.stepInstantiate);
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
        this.graph = new RGraph();

        let positions: number[] = [];
        let indices: number[] = [];

        this.toDoList.forEach(
            (road: RoadData) => {
                for (let i: number = 0; i < road.nodes.length - 1; i++) {
                    let aPosition: BABYLON.Vector2 = road.nodes[i];
                    let bPosition: BABYLON.Vector2 = road.nodes[i + 1];

                    let aRNode: RNode = this.graph.nodes.get(aPosition);
                    if (!aRNode) {
                        aRNode = new RNode(aPosition, this.graph);
                        this.graph.nodes.set(aPosition, aRNode);
                    }
                    let bRNode: RNode = this.graph.nodes.get(bPosition);
                    if (!bRNode) {
                        bRNode = new RNode(bPosition, this.graph);
                        this.graph.nodes.set(bPosition, bRNode);
                    }
                    aRNode.linkTo(bRNode, road.width);
                }
            }
        );

        this.graph.nodes.forEach(
            (rNode: RNode) => {
                
                rNode.sortEdges();

                let intersections: number[] = [];
                for (let i: number = 0; i < rNode.edges.length; i++) {
                    let e0: REdge = rNode.edges[i];
                    let e1: REdge = rNode.edges[i + 1];
                    if (!e1) {
                        e1 = rNode.edges[0];
                    }
                    this._a.copyFrom(e0.other(rNode).position);
                    this._a.subtractInPlace(rNode.position);
                    this._a.normalize();
                    this._b.copyFrom(e1.other(rNode).position);
                    this._b.subtractInPlace(rNode.position);
                    this._b.normalize();

                    Tools.RotateToRef(this._a, Math.PI / 2, this._na);
                    this._na.scaleInPlace(e0.width / 2);
                    Tools.RotateToRef(this._b, - Math.PI / 2, this._nb);
                    this._nb.scaleInPlace(e1.width / 2);

                    let x1: number = rNode.position.x + this._na.x;
                    let y1: number = rNode.position.y + this._na.y;
                    let x2: number = x1 + this._a.x;
                    let y2: number = y1 + this._a.y;
                    let x3: number = rNode.position.x + this._nb.x;
                    let y3: number = rNode.position.y + this._nb.y;
                    let x4: number = x3 + this._b.x;
                    let y4: number = y3 + this._b.y;

                    let det: number = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

                    if (Math.abs(det) < 0.0001) {
                        if (rNode.edges.length === 1) {
                            intersections.push(x1, y1);
                            e0.intersections.push(new BABYLON.Vector2(x1, y1));
                            e1.intersections.push(new BABYLON.Vector2(x3, y3));
                        } else {
                            intersections.push(x1, y1);
                            e0.intersections.push(new BABYLON.Vector2(x1, y1));
                            e1.intersections.push(new BABYLON.Vector2(x1, y1));
                        }
                    } else {
                        let x: number = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
                        x = x / det;
                        let y: number = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
                        y = y / det;
                        
                        intersections.push(x, y);
                        e0.intersections.push(new BABYLON.Vector2(x, y));
                        e1.intersections.push(new BABYLON.Vector2(x, y));
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

        this.graph.edges.forEach(
            (e: REdge) => {
                if (e.intersections.length === 4) {
                    e.sortIntersections();
                    let index: number = positions.length / 3;
                    for (let i: number = 0; i < e.intersections.length; i++) {
                        positions.push(
                            e.intersections[i].x,
                            0.5,
                            e.intersections[i].y
                        );
                    }
                    indices.push(index, index + 1, index + 2);
                    indices.push(index, index + 2, index + 3);
                } else {
                    console.warn("Request edge mesh construction but 4 points cannot be found.");
                }
            }
        );

        let data: BABYLON.VertexData = new BABYLON.VertexData();
        data.positions = positions;
        data.indices = indices;

        let mesh: BABYLON.Mesh = new BABYLON.Mesh("RoadNetwork", scene);
        data.applyToMesh(mesh);

        let roadMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("Road", scene);
        roadMaterial.diffuseColor = BABYLON.Color3.FromHexString(Config.color2);
        mesh.material = roadMaterial;

        return mesh;
    }
}