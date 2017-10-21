class RoadData {

    public nodes: BABYLON.Vector2[];
    public width: number;
    
    constructor() {
        this.nodes = [];
        this.width = 4;
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

        let mesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateTube("Road", {path: path, radius: 0.5}, scene);
        let roadMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("Road", scene);
        roadMaterial.diffuseColor = BABYLON.Color3.FromHexString(Config.color2);
        mesh.material = roadMaterial;

        return mesh;
    }
}