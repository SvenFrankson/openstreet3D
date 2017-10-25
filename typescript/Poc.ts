class Poc {

    public tileSize: number = 0.005;

    public getDataAt(long: number, lat: number, callback: () => void): void {
        let box: string = (long - this.tileSize).toFixed(7) + "," + (lat - this.tileSize).toFixed(7) + "," + (long + this.tileSize).toFixed(7) + "," + (lat + this.tileSize).toFixed(7);
        let url: string = "./map.xml";
        console.log(url);
        $.ajax(
            {
                url: url,
                success: (data: XMLDocument) => {
                    let mapNodes = new Map<number, BABYLON.Vector2>();
                    let root = data.firstElementChild;
                    let nodes = root.children;
                    for (let i: number = 0; i < nodes.length; i++) {
                        if (nodes[i].tagName === "node") {
                            let id: number = parseInt(nodes[i].id);
                            let lLat: number = parseFloat(nodes[i].getAttribute("lat"));
                            let lLong: number = parseFloat(nodes[i].getAttribute("lon"));
                            let coordinates: BABYLON.Vector2 = new BABYLON.Vector2(lLong, lLat);
                            coordinates.x = Tools.LonToX(lLong);
                            coordinates.y = -Tools.LatToZ(lLat);
                            mapNodes.set(id, coordinates);
                        }
                        if (nodes[i].tagName === "way") {
                            let itsBuilding: boolean = false;
                            let itsRoad: boolean = false;
                            let itsWater: boolean = false;
                            let level: number = Math.floor(Math.random() * 3 + 1);
                            let nodeIChildren = nodes[i].children;
                            for (let j: number = 0; j < nodeIChildren.length; j++) {
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
                                            break;
                                        }
                                        if (nodeIChildren[j].getAttribute("k") === "waterway") {
                                            itsWater = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (itsBuilding) {
                                let newBuilding: BuildingData = new BuildingData();
                                newBuilding.level = level;
                                for (let j: number = 0; j < nodeIChildren.length; j++) {
                                    if (nodeIChildren[j].tagName === "nd") {
                                        let nodeRef: number = parseInt(nodeIChildren[j].getAttribute("ref"));
                                        let node: BABYLON.Vector2 = mapNodes.get(nodeRef);
                                        if (node) {
                                            newBuilding.pushNode(node);
                                        }
                                    }
                                }
                                if (newBuilding.shape.length > 0) {
                                    Main.instance.buildingMaker.toDoList.push(newBuilding);
                                }
                            } else if (itsRoad) {
                                let newRoad: RoadData = new RoadData();
                                for (let j: number = 0; j < nodeIChildren.length; j++) {
                                    if (nodeIChildren[j].tagName === "nd") {
                                        let nodeRef: number = parseInt(nodeIChildren[j].getAttribute("ref"));
                                        let node: BABYLON.Vector2 = mapNodes.get(nodeRef);
                                        newRoad.pushNode(node);
                                    }
                                }
                                Main.instance.roadMaker.toDoList.push(newRoad);
                            } else if (itsWater) {
                                console.log("Water Way");
                                let waterMaterial = new BABYLON.StandardMaterial("Test", Main.instance.scene);
                                waterMaterial.diffuseColor.copyFromFloats(
                                    Math.random(),
                                    Math.random(),
                                    Math.random()
                                );
                                for (let j: number = 0; j < nodeIChildren.length; j++) {
                                    if (nodeIChildren[j].tagName === "nd") {
                                        let nodeRef: number = parseInt(nodeIChildren[j].getAttribute("ref"));
                                        let node: BABYLON.Vector2 = mapNodes.get(nodeRef);
                                        let cube = BABYLON.MeshBuilder.CreateBox("River", {size: 2}, Main.instance.scene);
                                        cube.material = waterMaterial;
                                        cube.position.x = node.x;
                                        cube.position.z = node.y;
                                    }
                                }
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
            }
        )
    }
}