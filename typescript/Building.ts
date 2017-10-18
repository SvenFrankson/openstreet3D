class Building extends BABYLON.Mesh {

    public static instances: Building[] = [];
    public coordinates: BABYLON.Vector2;

    constructor(scene: BABYLON.Scene) {
        super("Building", scene);
        Building.instances.push(this);
        this.material = Main.okMaterial;
    }

    public Dispose(): void {
        let index: number = Building.instances.indexOf(this);
        if (index !== -1) {
            Building.instances.splice(index, 1);
        }
        this.dispose();
    }

    public static Clear(): void {
        while (Building.instances.length > 0) {
            Building.instances[0].Dispose();
        }
    }

    public static center: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public static radius: number = 10;
    public static UpdateCenterAndRadius(): void {
        if (Building.instances.length === 0) {
            return;
        }
        let minX: number = Infinity;
        let maxX: number = -Infinity;
        let minZ: number = Infinity;
        let maxZ: number = -Infinity;

        Building.instances.forEach(
            (b: Building) => {
                minX = Math.min(minX, b.coordinates.x);
                minZ = Math.min(minZ, b.coordinates.y);
                maxX = Math.max(maxX, b.coordinates.x);
                maxZ = Math.max(maxZ, b.coordinates.y);
            }
        )

        Building.center.x = (minX + maxX) / 2;
        Building.center.z = (minZ + maxZ) / 2;
        Building.radius = Math.max(maxZ - minZ, maxX - minX);

        let lon: number = Tools.XToLon(Building.center.x);
        let lat: number = Tools.ZToLat(Building.center.z);

        Main.instance.groundManager.localGround.position.copyFrom(Building.center);
        Main.instance.groundManager.localGround.scaling.copyFromFloats(Building.radius, Building.radius, Building.radius);
        
    }
}