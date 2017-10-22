class RoadData {

    public nodes: BABYLON.Vector2[];
    public width: number;
    
    constructor() {
        this.nodes = [];
        this.width = 6;
    }

    public pushNode(node: BABYLON.Vector2): void {
        this.nodes.push(node);
    }

    public instantiate(scene: BABYLON.Scene): BABYLON.Mesh {
        let path: BABYLON.Vector3[] = [];

        this.nodes.forEach(
            (n: BABYLON.Vector2) => {
                path.push(new BABYLON.Vector3(n.x, 0.1, n.y));
            }
        )

        let mesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateTube("Road", {path: path, radius: 0.25}, scene);
        mesh.position.y = 0.5

        return mesh;
    }
}