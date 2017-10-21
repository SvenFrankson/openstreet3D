class BNode {
    public position: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public links: BNode[] = [];
    public color: BABYLON.Color3;

    constructor(position: BABYLON.Vector2) {
        this.position.copyFrom(position);
        this.color = BABYLON.Color3.White();
    }

    public linkTo(n: BNode): void {
        if (this.links.indexOf(n) === -1) {
            if (n.links.indexOf(this) === -1) {
                this.links.push(n);
                n.links.push(this);
            }
        }
    }

    public unlinkFrom(n: BNode): void {
        let indexN: number = this.links.indexOf(n);
        let indexThis: number = n.links.indexOf(this);
        if (indexN !== -1) {
            if (indexThis !== -1) {
                this.links.splice(indexN, 1);
                n.links.splice(indexThis, 1);
            }
        }
    }

    public split(a: BNode, b: BNode): void {
        a.unlinkFrom(b);
        this.linkTo(a);
        this.linkTo(b);
    }

    public static areLinked(a: BNode, b: BNode): boolean {
        let indexB: number = a.links.indexOf(b);
        let indexA: number = b.links.indexOf(a);
        if (indexA !== -1) {
            if (indexB !== -1) {
                return true;
            }
        }
        return false;
    }

    private static _oi: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private static _ia: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private static _ib: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public static intersect(
        origin: BABYLON.Vector2,
        direction: BABYLON.Vector2,
        a: BNode,
        b: BNode,
    ): BABYLON.Vector2 {
        let x1: number = a.position.x;
        let y1: number = a.position.y;
        let x2: number = b.position.x;
        let y2: number = b.position.y;
        let x3: number = origin.x;
        let y3: number = origin.y;
        let x4: number = x3 + direction.x;
        let y4: number = y3 + direction.y;

        let det: number = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (det === 0) {
            return undefined;
        }

        let x: number = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
        x = x / det;
        let y: number = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
        y = y / det;

        let intersection: BABYLON.Vector2 = new BABYLON.Vector2(x, y);

        BNode._oi.copyFrom(intersection);
        BNode._oi.subtractInPlace(origin);
        BNode._ia.copyFrom(a.position);
        BNode._ia.subtractInPlace(intersection);
        BNode._ib.copyFrom(b.position);
        BNode._ib.subtractInPlace(intersection);

        if (BABYLON.Vector2.Dot(BNode._oi, direction) < 0) {
            return undefined;
        }
        if (BABYLON.Vector2.Dot(BNode._ia, BNode._ib) > 0) {
            return undefined;
        }

        return new BABYLON.Vector2(x, y);
    }
}

class IntersectionInfo {
    constructor(
        public a: BNode,
        public b: BNode,
        public position: BABYLON.Vector2
    ) {

    }
}

class Graph {

    public nodes: BNode[] = [];

    public intersect(origin: BABYLON.Vector2, direction: BABYLON.Vector2): IntersectionInfo {
        let sqrDist: number = Infinity;
        let intersectionInfo: IntersectionInfo = undefined;
        for (let i: number = 0; i < this.nodes.length; i++) {
            let a: BNode = this.nodes[i];
            for (let j: number = i + 1; j < this.nodes.length; j++) {
                let b: BNode = this.nodes[j];
                if (BNode.areLinked(a, b)) {
                    let intersection: BABYLON.Vector2 = BNode.intersect(origin, direction, a, b);
                    if (intersection) {
                        let dist: number = BABYLON.Vector2.DistanceSquared(intersection, origin);
                        if (dist > 0.25 && dist < sqrDist) {
                            intersectionInfo = new IntersectionInfo(a, b, intersection);
                        }
                    }
                }
            }
        }
        return intersectionInfo;
    }

    public display(scene: BABYLON.Scene): void {
        for (let i: number = 0; i < this.nodes.length; i++) {
            let a: BNode = this.nodes[i];
            let nodeMesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateBox("Node", {size: 0.2}, scene);
            nodeMesh.position.copyFromFloats(a.position.x, 0, a.position.y);
            let nodeMeshMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("NodeMaterial", scene);
            nodeMeshMaterial.diffuseColor.copyFrom(a.color);
            nodeMesh.material = nodeMeshMaterial;
            for (let j: number = i + 1; j < this.nodes.length; j++) {
                let b: BNode = this.nodes[j];
                if (BNode.areLinked(a, b)) {
                    let linkMesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateTube(
                        "Link",
                        {
                            path: [
                                new BABYLON.Vector3(a.position.x, 0, a.position.y),
                                new BABYLON.Vector3(b.position.x, 0, b.position.y)
                            ],
                            radius: 0.05
                        },
                        scene
                    );
                }
            }
        }
    }
}