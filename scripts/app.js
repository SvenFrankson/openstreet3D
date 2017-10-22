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
        BuildingData.instances.push(this);
        this.shape = [];
        this.level = 1;
    }
    pushNode(node) {
        this.shape.push(node);
    }
    instantiate(scene) {
        let building = new Building(scene);
        let rawData = BuildingData.extrudeToSolidRaw(this.shape, this.level);
        BuildingData.vertexDataFromRawData(rawData).applyToMesh(building);
        building.position.x = rawData.position.x;
        building.position.z = rawData.position.y;
        building.freezeWorldMatrix();
        return building;
    }
    static extrudeToSolidRaw(points, level) {
        let positions = [];
        let indices = [];
        let colors = [];
        let position = BABYLON.Vector2.Zero();
        let radius = 0;
        let color1 = BABYLON.Color3.FromHexString(Config.color1);
        let color2 = BABYLON.Color3.FromHexString(Config.backgroundColor);
        for (let i = 0; i < points.length; i++) {
            position.addInPlace(points[i]);
        }
        position.scaleInPlace(1 / points.length);
        for (let i = 0; i < points.length; i++) {
            positions.push(points[i].x - position.x, level * 2.5, points[i].y - position.y);
            colors.push(color1.r, color1.g, color1.b, 1);
        }
        for (let i = 0; i < points.length; i++) {
            positions.push(points[i].x - position.x, 0, points[i].y - position.y);
            colors.push(color2.r, color2.g, color2.b, 1);
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
        for (let i = 0; i < points.length; i++) {
            let a = points[i];
            let b = points[i + 1];
            if (!b) {
                b = points[0];
            }
            let l = BABYLON.Vector2.Distance(a, b);
            for (let d = 1; d < l - 2; d += 2) {
                for (let h = 0; h < level; h++) {
                    BuildingData.pushWindow(points[i].x - position.x, points[i].y - position.y, points[i + 1].x - position.x, points[i + 1].y - position.y, d, 0.8 + h * 2.5, positions, indices, colors);
                }
            }
        }
        return {
            positions: positions,
            indices: indices,
            colors: colors,
            position: position,
            radius: 1
        };
    }
    static pushWindow(x1, y1, x2, y2, x, h, positions, indices, colors) {
        let color = BABYLON.Color3.FromHexString(Config.color2);
        BuildingData._dir.copyFromFloats(x2 - x1, y2 - y1);
        BuildingData._dir.normalize();
        Tools.RotateToRef(BuildingData._dir, -Math.PI / 2, BuildingData._norm);
        let p0 = new BABYLON.Vector2(x1, y1);
        p0.addInPlace(BuildingData._dir.scale(x));
        p0.addInPlace(BuildingData._norm.scale(0.1));
        let p1 = p0.clone();
        p1.addInPlace(BuildingData._dir);
        let i = positions.length / 3;
        positions.push(p0.x, h, p0.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p1.x, h, p1.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p1.x, h + 1, p1.y);
        colors.push(color.r, color.g, color.b, 1);
        positions.push(p0.x, h + 1, p0.y);
        colors.push(color.r, color.g, color.b, 1);
        indices.push(i, i + 1, i + 2);
        indices.push(i, i + 2, i + 3);
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
BuildingData._dir = BABYLON.Vector2.Zero();
BuildingData._norm = BABYLON.Vector2.Zero();
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
class Config {
}
Config.backgroundColor = "#2d1f00";
Config.color1 = "#b300ba";
Config.color2 = "#00bab3";
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
class BNode {
    constructor(position) {
        this.position = BABYLON.Vector2.Zero();
        this.links = [];
        this.position.copyFrom(position);
        this.color = BABYLON.Color3.White();
    }
    linkTo(n) {
        if (this.links.indexOf(n) === -1) {
            if (n.links.indexOf(this) === -1) {
                this.links.push(n);
                n.links.push(this);
            }
        }
    }
    unlinkFrom(n) {
        let indexN = this.links.indexOf(n);
        let indexThis = n.links.indexOf(this);
        if (indexN !== -1) {
            if (indexThis !== -1) {
                this.links.splice(indexN, 1);
                n.links.splice(indexThis, 1);
            }
        }
    }
    split(a, b) {
        a.unlinkFrom(b);
        this.linkTo(a);
        this.linkTo(b);
    }
    static areLinked(a, b) {
        let indexB = a.links.indexOf(b);
        let indexA = b.links.indexOf(a);
        if (indexA !== -1) {
            if (indexB !== -1) {
                return true;
            }
        }
        return false;
    }
    static intersect(origin, direction, a, b) {
        let x1 = a.position.x;
        let y1 = a.position.y;
        let x2 = b.position.x;
        let y2 = b.position.y;
        let x3 = origin.x;
        let y3 = origin.y;
        let x4 = x3 + direction.x;
        let y4 = y3 + direction.y;
        let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (det === 0) {
            return undefined;
        }
        let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
        x = x / det;
        let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
        y = y / det;
        let intersection = new BABYLON.Vector2(x, y);
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
BNode._oi = BABYLON.Vector2.Zero();
BNode._ia = BABYLON.Vector2.Zero();
BNode._ib = BABYLON.Vector2.Zero();
class IntersectionInfo {
    constructor(a, b, position) {
        this.a = a;
        this.b = b;
        this.position = position;
    }
}
class Graph {
    constructor() {
        this.nodes = [];
    }
    intersect(origin, direction) {
        let sqrDist = Infinity;
        let intersectionInfo = undefined;
        for (let i = 0; i < this.nodes.length; i++) {
            let a = this.nodes[i];
            for (let j = i + 1; j < this.nodes.length; j++) {
                let b = this.nodes[j];
                if (BNode.areLinked(a, b)) {
                    let intersection = BNode.intersect(origin, direction, a, b);
                    if (intersection) {
                        let dist = BABYLON.Vector2.DistanceSquared(intersection, origin);
                        if (dist > 0.25 && dist < sqrDist) {
                            intersectionInfo = new IntersectionInfo(a, b, intersection);
                        }
                    }
                }
            }
        }
        return intersectionInfo;
    }
    display(scene) {
        for (let i = 0; i < this.nodes.length; i++) {
            let a = this.nodes[i];
            let nodeMesh = BABYLON.MeshBuilder.CreateBox("Node", { size: 0.2 }, scene);
            nodeMesh.position.copyFromFloats(a.position.x, 0, a.position.y);
            let nodeMeshMaterial = new BABYLON.StandardMaterial("NodeMaterial", scene);
            nodeMeshMaterial.diffuseColor.copyFrom(a.color);
            nodeMesh.material = nodeMeshMaterial;
            for (let j = i + 1; j < this.nodes.length; j++) {
                let b = this.nodes[j];
                if (BNode.areLinked(a, b)) {
                    let linkMesh = BABYLON.MeshBuilder.CreateTube("Link", {
                        path: [
                            new BABYLON.Vector3(a.position.x, 0, a.position.y),
                            new BABYLON.Vector3(b.position.x, 0, b.position.y)
                        ],
                        radius: 0.05
                    }, scene);
                }
            }
        }
    }
}
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
        this.roadMaker = new RoadMaker();
        let hemisphericLight = new BABYLON.HemisphericLight("Light", BABYLON.Vector3.Up(), this.scene);
        this.light = hemisphericLight;
        this.camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 1, BABYLON.Vector3.Zero(), this.scene);
        this.camera.attachControl(this.canvas);
        this.camera.setPosition(new BABYLON.Vector3(-200, 200, -200));
        Main.okMaterial = new BABYLON.StandardMaterial("Random", this.scene);
        Main.okMaterial.diffuseColor = BABYLON.Color3.FromHexString("#ffffff");
        Main.okMaterial.backFaceCulling = false;
        let ground = BABYLON.Mesh.CreateDisc("Ground", 500, 64, this.scene);
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
            this.roadMaker.instantiateNetwork(this.scene);
        });
        let p = BABYLON.MeshBuilder.CreateBox("Box", { size: 0.5, width: 0.5, height: 1.8 }, this.scene);
        p.position.y = 0.9;
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
        this.tileSize = 0.005;
    }
    getDataAt(long, lat, callback) {
        let box = (long - this.tileSize).toFixed(7) + "," + (lat - this.tileSize).toFixed(7) + "," + (long + this.tileSize).toFixed(7) + "," + (lat + this.tileSize).toFixed(7);
        let url = "./map.xml";
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
                        let itsRoad = false;
                        let level = Math.floor(Math.random() * 3 + 1);
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
                                    if (nodeIChildren[j].getAttribute("k") === "highway") {
                                        itsRoad = true;
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
                        }
                        else if (itsRoad) {
                            let newRoad = new RoadData();
                            for (let j = 0; j < nodeIChildren.length; j++) {
                                if (nodeIChildren[j].tagName === "nd") {
                                    let nodeRef = parseInt(nodeIChildren[j].getAttribute("ref"));
                                    let node = mapNodes.get(nodeRef);
                                    newRoad.pushNode(node);
                                }
                            }
                            Main.instance.roadMaker.toDoList.push(newRoad);
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
class RoadData {
    constructor() {
        this.nodes = [];
        this.width = 6;
    }
    pushNode(node) {
        this.nodes.push(node);
    }
    instantiate(scene) {
        let path = [];
        this.nodes.forEach((n) => {
            path.push(new BABYLON.Vector3(n.x, 0.1, n.y));
        });
        let mesh = BABYLON.MeshBuilder.CreateTube("Road", { path: path, radius: 0.25 }, scene);
        mesh.position.y = 0.5;
        return mesh;
    }
}
class RGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }
}
class RNode {
    constructor(position, graph) {
        this.edges = [];
        this.intersections = [];
        this._x = new BABYLON.Vector2(1, 0);
        this._a = BABYLON.Vector2.Zero();
        this._b = BABYLON.Vector2.Zero();
        this.position = position;
        graph.nodes.set(position, this);
        this.graph = graph;
    }
    linkTo(n, width) {
        if (!this.isLinkedTo(n)) {
            let edge = new REdge(this, n, width, this.graph);
            this.edges.push(edge);
            n.edges.push(edge);
        }
    }
    isLinkedTo(n) {
        for (let i = 0; i < this.edges.length; i++) {
            if (this.edges[i].a === n) {
                return true;
            }
            if (this.edges[i].b === n) {
                return true;
            }
        }
        return false;
    }
    sortEdges() {
        this.edges.sort((a, b) => {
            this._a.copyFrom(a.other(this).position);
            this._a.subtractInPlace(this.position);
            this._a.normalize();
            this._b.copyFrom(b.other(this).position);
            this._b.subtractInPlace(this.position);
            this._b.normalize();
            return Tools.AngleFromTo(this._x, this._a) - Tools.AngleFromTo(this._x, this._b);
        });
    }
}
class REdge {
    constructor(a, b, width, graph) {
        this.intersections = [];
        this._c = BABYLON.Vector2.Zero();
        this._x = new BABYLON.Vector2(1, 0);
        this._a = BABYLON.Vector2.Zero();
        this._b = BABYLON.Vector2.Zero();
        this.a = a;
        this.b = b;
        this.width = width;
        graph.edges.push(this);
    }
    other(n) {
        if (this.a === n) {
            return this.b;
        }
        if (this.b === n) {
            return this.a;
        }
        console.warn("Request edge 'other node' giving unrelated node.");
        return undefined;
    }
    sortIntersections() {
        if (this.intersections.length === 4) {
            this._c.copyFromFloats(0, 0);
            for (let i = 0; i < this.intersections.length; i++) {
                this._c.addInPlace(this.intersections[i]);
            }
            this._c.scaleInPlace(0.25);
            this.intersections.sort((a, b) => {
                this._a.copyFrom(a);
                this._a.subtractInPlace(this._c);
                this._a.normalize();
                this._b.copyFrom(b);
                this._b.subtractInPlace(this._c);
                this._b.normalize();
                return Tools.AngleFromTo(this._x, this._a) - Tools.AngleFromTo(this._x, this._b);
            });
        }
        else {
            console.warn("Request edge 'sort intersections' but 4 points cannot be found.");
        }
    }
}
class RoadMaker {
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
        this._x = new BABYLON.Vector2(1, 0);
        this._a = BABYLON.Vector2.Zero();
        this._b = BABYLON.Vector2.Zero();
        this._na = BABYLON.Vector2.Zero();
        this._nb = BABYLON.Vector2.Zero();
        this.toDoList = [];
        // Main.instance.scene.registerBeforeRender(this.stepInstantiate);
    }
    instantiateNetwork(scene) {
        let graph = new RGraph();
        let positions = [];
        let indices = [];
        this.toDoList.forEach((road) => {
            for (let i = 0; i < road.nodes.length - 1; i++) {
                let aPosition = road.nodes[i];
                let bPosition = road.nodes[i + 1];
                let aRNode = graph.nodes.get(aPosition);
                if (!aRNode) {
                    aRNode = new RNode(aPosition, graph);
                    graph.nodes.set(aPosition, aRNode);
                }
                let bRNode = graph.nodes.get(bPosition);
                if (!bRNode) {
                    bRNode = new RNode(bPosition, graph);
                    graph.nodes.set(bPosition, bRNode);
                }
                aRNode.linkTo(bRNode, road.width);
            }
        });
        graph.nodes.forEach((rNode) => {
            rNode.sortEdges();
            let intersections = [];
            for (let i = 0; i < rNode.edges.length; i++) {
                let e0 = rNode.edges[i];
                let e1 = rNode.edges[i + 1];
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
                Tools.RotateToRef(this._b, -Math.PI / 2, this._nb);
                this._nb.scaleInPlace(e1.width / 2);
                let x1 = rNode.position.x + this._na.x;
                let y1 = rNode.position.y + this._na.y;
                let x2 = x1 + this._a.x;
                let y2 = y1 + this._a.y;
                let x3 = rNode.position.x + this._nb.x;
                let y3 = rNode.position.y + this._nb.y;
                let x4 = x3 + this._b.x;
                let y4 = y3 + this._b.y;
                let det = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                if (Math.abs(det) < 0.0001) {
                    if (rNode.edges.length === 1) {
                        intersections.push(x1, y1);
                        e0.intersections.push(new BABYLON.Vector2(x1, y1));
                        e1.intersections.push(new BABYLON.Vector2(x3, y3));
                    }
                    else {
                        intersections.push(x1, y1);
                        e0.intersections.push(new BABYLON.Vector2(x1, y1));
                        e1.intersections.push(new BABYLON.Vector2(x1, y1));
                    }
                }
                else {
                    let x = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
                    x = x / det;
                    let y = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
                    y = y / det;
                    intersections.push(x, y);
                    e0.intersections.push(new BABYLON.Vector2(x, y));
                    e1.intersections.push(new BABYLON.Vector2(x, y));
                }
            }
            if (intersections.length > 2) {
                let nodeIndices = Earcut.earcut(intersections, [], 2);
                for (let i = 0; i < nodeIndices.length; i++) {
                    nodeIndices[i] += positions.length / 3;
                }
                indices.push(...nodeIndices);
                for (let i = 0; i < intersections.length / 2; i++) {
                    positions.push(intersections[2 * i], 0.5, intersections[2 * i + 1]);
                }
            }
        });
        graph.edges.forEach((e) => {
            if (e.intersections.length === 4) {
                e.sortIntersections();
                let index = positions.length / 3;
                for (let i = 0; i < e.intersections.length; i++) {
                    positions.push(e.intersections[i].x, 0.5, e.intersections[i].y);
                }
                indices.push(index, index + 1, index + 2);
                indices.push(index, index + 2, index + 3);
            }
            else {
                console.warn("Request edge mesh construction but 4 points cannot be found.");
            }
        });
        let data = new BABYLON.VertexData();
        data.positions = positions;
        data.indices = indices;
        let mesh = new BABYLON.Mesh("RoadNetwork", scene);
        data.applyToMesh(mesh);
        let roadMaterial = new BABYLON.StandardMaterial("Road", scene);
        roadMaterial.diffuseColor = BABYLON.Color3.FromHexString(Config.color2);
        mesh.material = roadMaterial;
        return mesh;
    }
}
var RAD2DEG = 180 / Math.PI;
var PI_4 = Math.PI / 4;
var zoom = 25;
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
    static RotateToRef(v, alpha, ref) {
        Tools.tmp.x = Math.cos(alpha) * v.x - Math.sin(alpha) * v.y;
        Tools.tmp.y = Math.sin(alpha) * v.x + Math.cos(alpha) * v.y;
        ref.copyFrom(Tools.tmp);
    }
    static AngleFromTo(a, b) {
        let angle = Math.acos(BABYLON.Vector2.Dot(a, b));
        let cross = a.x * b.y - b.x * a.y;
        if (cross < 0) {
            angle = -angle;
        }
        return angle;
    }
}
Tools.tmp = BABYLON.Vector2.Zero();
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
