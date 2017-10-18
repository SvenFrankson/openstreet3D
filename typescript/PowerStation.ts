class PowerStation extends BABYLON.Mesh {

    public static instances: PowerStation[] = [];
    public model: BABYLON.AbstractMesh;

    public static LogPosition(): void {
        let v3: BABYLON.Vector3[] = [];
        PowerStation.instances.forEach(
            (p: PowerStation) => {
                v3.push(p.position);
            }
        )
        console.log(v3);
    }

    constructor(failure: boolean, scene: BABYLON.Scene) {
        super("PowerStation", scene);
        PowerStation.instances.push(this);

        BABYLON.SceneLoader.ImportMesh(
            "",
            "./Content/elec-logo.babylon",
            "",
            scene,
            (meshes) => {
                this.model = meshes[0];
                meshes[0].parent = this;
                if (failure) {
                    meshes[0].material = Main.nokMaterial;
                } else {
                    meshes[0].material = Main.greenMaterial;
                }
                this.getScene().registerBeforeRender(this.update);
            }
        )
    }

    public Dispose(): void {
        let index: number = PowerStation.instances.indexOf(this);
        if (index !== -1) {
            PowerStation.instances.splice(index, 1);
        }
        this.model.dispose();
        this.dispose();
    }

    public update = () => {
        this.rotation.y += 0.02;
        let s: number = BABYLON.Vector3.Distance(this.position, Main.instance.scene.activeCamera.position) / 20;
        this.scaling.copyFromFloats(s, s, s);
    }
}