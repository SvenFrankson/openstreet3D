class UI {

    public texture: BABYLON.GUI.AdvancedDynamicTexture;
    public back: BABYLON.GUI.Button;

    constructor() {
        this.texture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.back = BABYLON.GUI.Button.CreateSimpleButton("Back", "Back");
        this.back.left = -0.95;
        this.back.top = -0.95;
        this.back.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.back.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.back.width = 0.1;
        this.back.height = 0.1;
        this.back.background = "black";
        this.back.color = "white";
        this.back.onPointerUpObservable.add(
            () => {
                if (Main.instance.cameraManager.state === CameraState.local) {
                    Main.instance.cameraManager.goToGlobal();
                    Main.instance.groundManager.toGlobalGround();
                }
            }
        )

        this.texture.addControl(this.back);
    }
}