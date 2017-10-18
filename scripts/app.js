class Building extends BABYLON.Mesh {
    constructor(scene) {
        super("Building", scene);
        Building.instances.push(this);
        this.material = Main.okMaterial;
    }
    Dispose() {
        let index = Building.instances.indexOf(this);
        if (index !== -1) {
            Building.instances.splice(index, 1);
        }
        this.dispose();
    }
    static Clear() {
        while (Building.instances.length > 0) {
            Building.instances[0].Dispose();
        }
    }
    static UpdateCenterAndRadius() {
        if (Building.instances.length === 0) {
            return;
        }
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;
        Building.instances.forEach((b) => {
            minX = Math.min(minX, b.coordinates.x);
            minZ = Math.min(minZ, b.coordinates.y);
            maxX = Math.max(maxX, b.coordinates.x);
            maxZ = Math.max(maxZ, b.coordinates.y);
        });
        Building.center.x = (minX + maxX) / 2;
        Building.center.z = (minZ + maxZ) / 2;
        Building.radius = Math.max(maxZ - minZ, maxX - minX);
        let lon = Tools.XToLon(Building.center.x);
        let lat = Tools.ZToLat(Building.center.z);
        Main.instance.groundManager.localGround.position.copyFrom(Building.center);
        Main.instance.groundManager.localGround.scaling.copyFromFloats(Building.radius, Building.radius, Building.radius);
    }
}
Building.instances = [];
Building.center = BABYLON.Vector3.Zero();
Building.radius = 10;
class BuildingData {
    constructor() {
        this.shape = [];
        this.level = 1;
    }
    pushNode(node) {
        this.shape.push(node);
    }
    instantiate(scene) {
        let building = new Building(scene);
        let rawData = BuildingData.extrudeToSolidRaw(this.shape, this.level * 0.2);
        BuildingData.vertexDataFromRawData(rawData).applyToMesh(building);
        building.position.x = rawData.position.x;
        building.position.z = rawData.position.y;
        building.freezeWorldMatrix();
        return building;
    }
    static extrudeToSolidRaw(points, height) {
        let positions = [];
        let indices = [];
        let colors = [];
        let position = BABYLON.Vector2.Zero();
        let radius = 0;
        for (let i = 0; i < points.length; i++) {
            position.addInPlace(points[i]);
        }
        position.scaleInPlace(1 / points.length);
        for (let i = 0; i < points.length; i++) {
            positions.push(points[i].x - position.x, height, points[i].y - position.y);
            colors.push(1, 1, 1, 1);
        }
        for (let i = 0; i < points.length; i++) {
            positions.push(points[i].x - position.x, 0, points[i].y - position.y);
            colors.push(0.3, 0.3, 0.3, 1);
        }
        for (let i = 0; i < points.length; i++) {
            let a = i + points.length;
            let b = i + points.length + 1;
            if (i === points.length - 1) {
                b = points.length;
            }
            let c = i + 1;
            if (i === points.length - 1) {
                c = 0;
            }
            let d = i;
            indices.push(a, b, c);
            indices.push(a, c, d);
        }
        let topPoints = [];
        for (let i = 0; i < points.length; i++) {
            topPoints.push(points[i].x, points[i].y);
        }
        indices.push(...Earcut.earcut(topPoints, [], 2));
        return {
            positions: positions,
            indices: indices,
            colors: colors,
            position: position,
            radius: 1
        };
    }
    static vertexDataFromRawData(rawData) {
        let data = new BABYLON.VertexData();
        data.positions = rawData.positions;
        data.indices = rawData.indices;
        data.colors = rawData.colors;
        return data;
    }
    static extrudeToSolid(points, height) {
        let data = new BABYLON.VertexData();
        let rawData = BuildingData.extrudeToSolidRaw(points, height);
        data.positions = rawData.positions;
        data.indices = rawData.indices;
        data.colors = rawData.colors;
        return data;
    }
}
BuildingData.instances = [];
class BuildingMaker {
    constructor() {
        this.stepInstantiate = () => {
            let t0 = (new Date()).getTime();
            let t1 = t0;
            let work = false;
            if (this.toDoList.length > 0) {
                work = true;
            }
            while (this.toDoList.length > 0 && (t1 - t0) < 10) {
                let data = this.toDoList.pop();
                data.instantiate(Main.instance.scene);
                t1 = (new Date()).getTime();
            }
            if (work && this.toDoList.length === 0) {
                Failure.update();
            }
        };
        this.toDoList = [];
        Main.instance.scene.registerBeforeRender(this.stepInstantiate);
    }
}
var CameraState;
(function (CameraState) {
    CameraState[CameraState["global"] = 0] = "global";
    CameraState[CameraState["ready"] = 1] = "ready";
    CameraState[CameraState["transition"] = 2] = "transition";
    CameraState[CameraState["local"] = 3] = "local";
})(CameraState || (CameraState = {}));
class CameraManager {
    constructor() {
        this.state = CameraState.global;
        this.k = 0;
        this.duration = 120;
        this.fromPosition = BABYLON.Vector3.Zero();
        this.toPosition = BABYLON.Vector3.Zero();
        this.fromTarget = BABYLON.Vector3.Zero();
        this.toTarget = BABYLON.Vector3.Zero();
        this.tmpPosition = BABYLON.Vector3.Zero();
        this.tmpTarget = BABYLON.Vector3.Zero();
        this.transitionStep = () => {
            this.k++;
            this.tmpPosition.x = this.fromPosition.x * (1 - this.k / this.duration) + this.toPosition.x * this.k / this.duration;
            this.tmpPosition.y = this.fromPosition.y * (1 - this.k / this.duration) + this.toPosition.y * this.k / this.duration;
            this.tmpPosition.z = this.fromPosition.z * (1 - this.k / this.duration) + this.toPosition.z * this.k / this.duration;
            this.tmpTarget.x = this.fromTarget.x * (1 - this.k / this.duration) + this.toTarget.x * this.k / this.duration;
            this.tmpTarget.y = this.fromTarget.y * (1 - this.k / this.duration) + this.toTarget.y * this.k / this.duration;
            this.tmpTarget.z = this.fromTarget.z * (1 - this.k / this.duration) + this.toTarget.z * this.k / this.duration;
            Main.instance.camera.setPosition(this.tmpPosition);
            Main.instance.camera.setTarget(this.tmpTarget);
            if (this.k >= this.duration) {
                Main.instance.scene.unregisterBeforeRender(this.transitionStep);
                if (this.onTransitionDone) {
                    this.onTransitionDone();
                }
            }
        };
    }
    goToLocal(target) {
        if (this.state !== CameraState.ready) {
            return;
        }
        this.state = CameraState.transition;
        this.fromPosition.copyFrom(Main.instance.camera.position);
        this.toPosition.copyFrom(target);
        let direction = new BABYLON.Vector3(-3, 5, -4);
        direction.normalize();
        direction.scaleInPlace(20);
        this.toPosition.addInPlace(direction);
        this.fromTarget.copyFrom(Main.instance.camera.target);
        this.toTarget.copyFrom(target);
        this.onTransitionDone = () => {
            this.state = CameraState.local;
            Main.instance.camera.useAutoRotationBehavior = false;
            //Main.instance.camera.autoRotationBehavior.idleRotationWaitTime = 500;
            //Main.instance.camera.autoRotationBehavior.idleRotationSpinupTime = 2000;
        };
        this.k = 0;
        Main.instance.scene.registerBeforeRender(this.transitionStep);
    }
    goToGlobal() {
        if (this.state !== CameraState.local) {
            return;
        }
        this.state = CameraState.transition;
        this.fromPosition.copyFrom(Main.instance.camera.position);
        this.toPosition.copyFrom(new BABYLON.Vector3(-500, 500, -500));
        this.fromTarget.copyFrom(Main.instance.camera.target);
        this.toTarget.copyFromFloats(0, 0, 0);
        this.onTransitionDone = () => {
            this.state = CameraState.global;
            Main.instance.camera.useAutoRotationBehavior = false;
        };
        this.k = 0;
        Main.instance.scene.registerBeforeRender(this.transitionStep);
    }
}
class Failure {
    constructor(origin, range) {
        Failure.instances.push(this);
        this.origin = origin.clone();
        this.sqrRange = range * range;
        this.model = new PowerStation(true, Main.instance.scene);
        this.model.position.x = origin.x;
        this.model.position.z = origin.y;
    }
    Dispose() {
        let index = Failure.instances.indexOf(this);
        if (index !== -1) {
            Failure.instances.splice(index, 1);
        }
        this.model.Dispose();
    }
    static update() {
        Building.instances.forEach((b) => {
            b.material = Main.okMaterial;
            Failure.instances.forEach((f) => {
                if (BABYLON.Vector2.DistanceSquared(b.coordinates, f.origin) < f.sqrRange) {
                    b.material = Main.nokMaterial;
                }
            });
        });
    }
}
Failure.instances = [];
class GroundManager {
    constructor(w, h) {
        this.k = 0;
        this.duration = 120;
        this.transitionStepToGlobal = () => {
            this.k++;
            this.localGround.visibility = (1 - this.k / this.duration);
            this.globalGround.visibility = this.k / this.duration;
            Main.failureMaterial.alpha = this.k / this.duration;
            if (this.k >= this.duration) {
                Main.instance.scene.unregisterBeforeRender(this.transitionStepToGlobal);
            }
        };
        this.transitionStepToLocal = () => {
            this.k++;
            this.localGround.visibility = this.k / this.duration;
            this.globalGround.visibility = 1 - this.k / this.duration;
            Main.failureMaterial.alpha = 1 - this.k / this.duration;
            if (this.k >= this.duration) {
                Main.instance.scene.unregisterBeforeRender(this.transitionStepToLocal);
            }
        };
        this.globalGround = BABYLON.MeshBuilder.CreateGround("GlobalGround", { width: w, height: h }, Main.instance.scene);
        this.globalGround.position.y = -0.2;
        let groundMaterial = new BABYLON.StandardMaterial("GroundMaterial", Main.instance.scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("./Content/alsace.png", Main.instance.scene);
        groundMaterial.specularColor.copyFromFloats(0.2, 0.2, 0.2);
        this.globalGround.material = groundMaterial;
        this.localGround = BABYLON.MeshBuilder.CreateDisc("LocalGround", { radius: 1, sideOrientation: 1 }, Main.instance.scene);
        this.localGround.rotation.x = -Math.PI / 2;
        let s = 141.51682965;
        this.localGround.scaling.copyFromFloats(s, s, s);
        let localGroundMaterial = new BABYLON.StandardMaterial("LocalGroundMaterial", Main.instance.scene);
        localGroundMaterial.diffuseTexture = new BABYLON.Texture("./Content/strasbourg.png", Main.instance.scene);
        localGroundMaterial.specularColor.copyFromFloats(0.2, 0.2, 0.2);
        this.localGround.material = localGroundMaterial;
    }
    toLocalGround(target) {
        this.k = 0;
        // this.localGround.position.x = target.x;
        // this.localGround.position.z = target.z;
        Main.instance.scene.registerBeforeRender(this.transitionStepToLocal);
    }
    toGlobalGround() {
        this.k = 0;
        Main.instance.scene.registerBeforeRender(this.transitionStepToGlobal);
    }
}
class Main {
    constructor(canvasElement) {
        Main.instance = this;
        Main.medX = Tools.LonToX(Main.medLon);
        Main.medZ = Tools.LatToZ(Main.medLat);
        console.log("MedX " + Main.medX);
        console.log("MedZ " + Main.medZ);
        this.canvas = document.getElementById(canvasElement);
        this.engine = new BABYLON.Engine(this.canvas, true);
        BABYLON.Engine.ShadersRepository = "./shaders/";
    }
    createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor.copyFromFloats(0, 0, 0, 1);
        this.resize();
        this.buildingMaker = new BuildingMaker();
        let hemisphericLight = new BABYLON.HemisphericLight("Light", BABYLON.Vector3.Up(), this.scene);
        this.light = hemisphericLight;
        this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 1, BABYLON.Vector3.Zero(), this.scene);
        this.camera.attachControl(this.canvas);
        this.camera.setPosition(new BABYLON.Vector3(-50, 50, -50));
        Main.okMaterial = new BABYLON.StandardMaterial("Random", this.scene);
        Main.okMaterial.diffuseColor = BABYLON.Color3.FromHexString("#ffffff");
        Main.okMaterial.backFaceCulling = false;
        let ground = BABYLON.Mesh.CreateDisc("Ground", 40, 64, this.scene);
        ground.rotation.x = Math.PI / 2;
        let groundMaterial = new BABYLON.StandardMaterial("Ground", this.scene);
        groundMaterial.diffuseColor.copyFromFloats(0.5, 0.5, 0.5);
        groundMaterial.specularColor.copyFromFloats(0, 0, 0);
        ground.material = groundMaterial;
        let poc = new Poc();
        let lon = Tools.XToLon(0);
        let lat = Tools.ZToLat(0);
        Building.Clear();
        poc.getDataAt(lon, lat, () => {
        });
    }
    animate() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        window.addEventListener("resize", () => {
            this.resize();
        });
    }
    resize() {
        this.engine.resize();
    }
}
Main.medLon = 6.16563;
Main.medLat = 49.1246969;
Main.medX = 0;
Main.medZ = 0;
function myMethod(node1) {
    let position = BABYLON.Vector3.Zero();
    position.x = Tools.LonToX(node1.Longitude);
    position.z = -Tools.LatToZ(node1.Latitude);
    new Twittalert(position, node1.Text, " today", node1.Name, node1.URLPicture, Main.instance.scene);
}
window.addEventListener("DOMContentLoaded", () => {
    let game = new Main("render-canvas");
    game.createScene();
    game.animate();
});
class Poc {
    constructor() {
        this.tileSize = 0.007;
    }
    getDataAt(long, lat, callback) {
        let box = (long - this.tileSize).toFixed(7) + "," + (lat - this.tileSize).toFixed(7) + "," + (long + this.tileSize).toFixed(7) + "," + (lat + this.tileSize).toFixed(7);
        let url = "http://api.openstreetmap.org/api/0.6/map?bbox=" + box;
        console.log(url);
        $.ajax({
            url: url,
            success: (data) => {
                let mapNodes = new Map();
                let root = data.firstElementChild;
                let nodes = root.children;
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].tagName === "node") {
                        let id = parseInt(nodes[i].id);
                        let lLat = parseFloat(nodes[i].getAttribute("lat"));
                        let lLong = parseFloat(nodes[i].getAttribute("lon"));
                        let coordinates = new BABYLON.Vector2(lLong, lLat);
                        coordinates.x = Tools.LonToX(lLong);
                        coordinates.y = -Tools.LatToZ(lLat);
                        mapNodes.set(id, coordinates);
                    }
                    if (nodes[i].tagName === "way") {
                        let itsBuilding = false;
                        let level = 1;
                        let nodeIChildren = nodes[i].children;
                        for (let j = 0; j < nodeIChildren.length; j++) {
                            if (nodeIChildren[j].tagName === "tag") {
                                if (nodeIChildren[j].hasAttribute("k")) {
                                    if (nodeIChildren[j].getAttribute("k") === "building") {
                                        itsBuilding = true;
                                    }
                                    if (nodeIChildren[j].getAttribute("k") === "building:levels") {
                                        level = parseInt(nodeIChildren[j].getAttribute("v"));
                                    }
                                }
                            }
                        }
                        if (itsBuilding) {
                            let newBuilding = new BuildingData();
                            newBuilding.level = level;
                            for (let j = 0; j < nodeIChildren.length; j++) {
                                if (nodeIChildren[j].tagName === "nd") {
                                    let nodeRef = parseInt(nodeIChildren[j].getAttribute("ref"));
                                    let node = mapNodes.get(nodeRef);
                                    newBuilding.pushNode(node);
                                }
                            }
                            Main.instance.buildingMaker.toDoList.push(newBuilding);
                            BuildingData.instances.push(newBuilding);
                        }
                    }
                }
                if (callback) {
                    callback();
                }
            },
            error: () => {
                console.log("Error");
            }
        });
    }
}
class PowerStation extends BABYLON.Mesh {
    constructor(failure, scene) {
        super("PowerStation", scene);
        this.update = () => {
            this.rotation.y += 0.02;
            let s = BABYLON.Vector3.Distance(this.position, Main.instance.scene.activeCamera.position) / 20;
            this.scaling.copyFromFloats(s, s, s);
        };
        PowerStation.instances.push(this);
        BABYLON.SceneLoader.ImportMesh("", "./Content/elec-logo.babylon", "", scene, (meshes) => {
            this.model = meshes[0];
            meshes[0].parent = this;
            if (failure) {
                meshes[0].material = Main.nokMaterial;
            }
            else {
                meshes[0].material = Main.greenMaterial;
            }
            this.getScene().registerBeforeRender(this.update);
        });
    }
    static LogPosition() {
        let v3 = [];
        PowerStation.instances.forEach((p) => {
            v3.push(p.position);
        });
        console.log(v3);
    }
    Dispose() {
        let index = PowerStation.instances.indexOf(this);
        if (index !== -1) {
            PowerStation.instances.splice(index, 1);
        }
        this.model.dispose();
        this.dispose();
    }
}
PowerStation.instances = [];
var RAD2DEG = 180 / Math.PI;
var PI_4 = Math.PI / 4;
var zoom = 20;
class Tools {
    static LonToX(lon) {
        return (lon + 180) / 360 * Math.pow(2, zoom) - Main.medX;
    }
    static LatToZ(lat) {
        let res = Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180));
        return (1 - res / Math.PI) * Math.pow(2, zoom - 1) - Main.medZ;
    }
    static XToLon(x) {
        return (x + Main.medX) / Math.pow(2, zoom) * 360 - 180;
    }
    static ZToLat(z) {
        return Math.atan(Math.sinh(Math.PI - (z + Main.medZ) / Math.pow(2, zoom) * 2 * Math.PI)) * 180 / Math.PI;
    }
}
/*
class Tools {
    public static LonToX(lon: number): number {
        return lon * 1250 - Main.medX;
    }

    public static LatToZ(lat: number): number {
        return Math.log(Math.tan((lat / 90 + 1) * PI_4 )) * RAD2DEG * 1250 - Main.medZ;
    }

    public static XToLon(x: number): number {
        return (x + Main.medX) / 1250;
    }
    
    public static ZToLat(z: number): number {
        return (Math.atan(Math.exp((z + Main.medZ) / 1250 / RAD2DEG)) / PI_4 - 1) * 90;
    }
}

class Tools {
    public static LonToX(lon: number): number {
        return (lon - Main.medLon) * 2000;
    }

    public static LatToZ(lat: number): number {
        return (lat - Main.medLat) * 2000;
    }


    public static XToLon(x: number): number {
        return x / 2000 + Main.medLon;
    }
    
    public static ZToLat(z: number): number {
        return z / 2000 + Main.medLat;
    }
}
*/ 
class Twittalert extends BABYLON.Mesh {
    constructor(position, content, date, author, pictureUrl, scene) {
        super("TwittAlert", scene);
        this.lifeSpan = 10000;
        this.minDist = 20;
        this.maxDist = 80;
        this.timeout = 0;
        this.popIn = () => {
            console.log("PopIn");
            this.container.alpha += 0.02;
            if (this.container.alpha >= this.computeAlpha()) {
                this.container.alpha = 1;
                this.getScene().unregisterBeforeRender(this.popIn);
                this.getScene().registerBeforeRender(this.update);
            }
        };
        this.update = () => {
            console.log("Update");
            this.container.alpha = this.computeAlpha();
        };
        this.kill = () => {
            console.log("Kill");
            this.container.alpha -= 0.01;
            if (this.container.alpha <= 0) {
                this.getScene().unregisterBeforeRender(this.kill);
                this.container.linkWithMesh(undefined);
                this.container.dispose();
                this.texture.dispose();
                this.dispose();
            }
        };
        this.position.copyFrom(position);
        this.texture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("tmp");
        this.container = new BABYLON.GUI.Container("container");
        this.container.width = "480px";
        this.container.height = "80px";
        this.texture.addControl(this.container);
        let rectangle = new BABYLON.GUI.Rectangle("rectangle");
        rectangle.background = "white";
        rectangle.thickness = 1;
        rectangle.color = "black";
        this.container.addControl(rectangle);
        let avatar = new BABYLON.GUI.Image("avatar", pictureUrl);
        avatar.width = "60px";
        avatar.height = "60px";
        avatar.top = "0px";
        avatar.left = "-200px";
        this.container.addControl(avatar);
        let authorBox = new BABYLON.GUI.TextBlock("author", author);
        authorBox.color = "black";
        authorBox.fontStyle = "bold";
        authorBox.fontSize = 18;
        authorBox.fontFamily = "Helvetica Neue";
        authorBox.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        authorBox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        authorBox.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        authorBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        authorBox.top = "5px";
        authorBox.left = "90px";
        this.container.addControl(authorBox);
        let metaBox = new BABYLON.GUI.TextBlock("date", " - " + date);
        metaBox.color = "grey";
        metaBox.fontSize = 16;
        metaBox.fontFamily = "Helvetica Neue";
        metaBox.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        metaBox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        metaBox.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        metaBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        metaBox.top = "10px";
        metaBox.left = "250px";
        this.container.addControl(metaBox);
        let textBox = new BABYLON.GUI.TextBlock("content", content);
        textBox.color = "black";
        textBox.fontSize = 14;
        textBox.fontFamily = "Helvetica Neue";
        textBox.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBox.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        textBox.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        textBox.textWrapping = true;
        textBox.top = "35px";
        textBox.left = "90px";
        textBox.width = "380px";
        this.container.addControl(textBox);
        this.container.linkWithMesh(this);
        this.container.linkOffsetX = "120px";
        this.container.linkOffsetY = "-80px";
        this.container.alpha = 0;
        scene.registerBeforeRender(this.popIn);
        setTimeout(() => {
            scene.unregisterBeforeRender(this.popIn);
            scene.unregisterBeforeRender(this.update);
            scene.registerBeforeRender(this.kill);
        }, this.lifeSpan);
    }
    computeAlpha() {
        let alpha = 0;
        let dist = BABYLON.Vector3.Distance(Main.instance.scene.activeCamera.position, this.position);
        if (dist > this.maxDist) {
            alpha = 0;
        }
        else if (dist < this.minDist) {
            alpha = 1;
        }
        else {
            let delta = dist - this.minDist;
            alpha = -delta / (this.maxDist - this.minDist) + 1;
        }
        return alpha;
    }
}
class UI {
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
        this.back.onPointerUpObservable.add(() => {
            if (Main.instance.cameraManager.state === CameraState.local) {
                Main.instance.cameraManager.goToGlobal();
                Main.instance.groundManager.toGlobalGround();
            }
        });
        this.texture.addControl(this.back);
    }
}
