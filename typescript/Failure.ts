class Failure {
    public static instances: Failure[] = [];

    public origin: BABYLON.Vector2;
    public sqrRange: number;
    public model: PowerStation;

    constructor(origin: BABYLON.Vector2, range: number) {
        Failure.instances.push(this);
        this.origin = origin.clone();
        this.sqrRange = range * range;
        this.model = new PowerStation(true, Main.instance.scene);
        this.model.position.x = origin.x;
        this.model.position.z = origin.y;
    }

    public Dispose(): void {
        let index: number = Failure.instances.indexOf(this);
        if (index !== -1) {
            Failure.instances.splice(index, 1);
        }
        this.model.Dispose();
    }

    public static update(): void {
        Building.instances.forEach(
            (b: Building) => {
                b.material = Main.okMaterial;
                Failure.instances.forEach(
                    (f: Failure) => {
                        if (BABYLON.Vector2.DistanceSquared(b.coordinates, f.origin) < f.sqrRange) {
                            b.material = Main.nokMaterial;
                        }
                    }
                )
            }
        )

    }
}