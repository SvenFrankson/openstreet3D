class Main {

    public static instance: Main;
    public canvas: HTMLCanvasElement;
    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
    public light: BABYLON.Light;
    public camera: BABYLON.ArcRotateCamera;
    public cameraManager: CameraManager;
    public ui: UI;
    public groundManager: GroundManager;
    public buildingMaker: BuildingMaker;

    public static okMaterial: BABYLON.StandardMaterial;
    public static nokMaterial: BABYLON.StandardMaterial;
    public static failureMaterial: BABYLON.StandardMaterial;
    public static greenMaterial: BABYLON.StandardMaterial;

    public static medLon: number = 6.16563;
    public static medLat: number = 49.1246969;

    public static medX: number = 0;
    public static medZ: number = 0;

    constructor(canvasElement: string) {
        Main.instance = this;
        Main.medX = Tools.LonToX(Main.medLon);
        Main.medZ = Tools.LatToZ(Main.medLat);
        console.log("MedX " + Main.medX);
        console.log("MedZ " + Main.medZ);
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        BABYLON.Engine.ShadersRepository = "./shaders/";
    }

    createScene(): void {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor.copyFromFloats(0, 0, 0, 1);
        this.resize();

        this.buildingMaker = new BuildingMaker();

        let hemisphericLight: BABYLON.HemisphericLight = new BABYLON.HemisphericLight("Light", BABYLON.Vector3.Up(), this.scene);
        this.light = hemisphericLight;

        this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 1, BABYLON.Vector3.Zero(), this.scene);
        this.camera.attachControl(this.canvas);
        this.camera.setPosition(
            new BABYLON.Vector3(
                -50, 50, -50
            )
        );

        Main.okMaterial = new BABYLON.StandardMaterial("Random", this.scene);
        Main.okMaterial.diffuseColor = BABYLON.Color3.FromHexString("#ffffff");
        Main.okMaterial.backFaceCulling = false;

        let ground: BABYLON.Mesh = BABYLON.Mesh.CreateDisc("Ground", 40, 64, this.scene);
        ground.rotation.x = Math.PI / 2;

        let groundMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("Ground", this.scene);
        groundMaterial.diffuseColor.copyFromFloats(0.5, 0.5, 0.5);
        groundMaterial.specularColor.copyFromFloats(0, 0, 0);

        ground.material = groundMaterial;

        let poc: Poc = new Poc();

        let lon: number = Tools.XToLon(0);
        let lat: number = Tools.ZToLat(0);
        Building.Clear();
        poc.getDataAt(
            lon,
            lat,
            () => {
                
            }
        );

    }

    public animate(): void {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener("resize", () => {
            this.resize();
        });
    }

    public resize(): void {
        this.engine.resize();
    }
}

function myMethod(node1: ITweet) {
    let position: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    position.x = Tools.LonToX(node1.Longitude);
    position.z = -Tools.LatToZ(node1.Latitude);
    new Twittalert(
        position,
        node1.Text,
        " today",
        node1.Name,
        node1.URLPicture,
        Main.instance.scene
    );
}

window.addEventListener("DOMContentLoaded", () => {
    let game: Main = new Main("render-canvas");
    game.createScene();
    game.animate();
});
