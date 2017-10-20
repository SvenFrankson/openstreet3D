class Poc {

    public tileSize: number = 0.007;

    public getDataAt(long: number, lat: number, callback: () => void): void {
        let box: string = (long - this.tileSize).toFixed(7) + "," + (lat - this.tileSize).toFixed(7) + "," + (long + this.tileSize).toFixed(7) + "," + (lat + this.tileSize).toFixed(7);
        let url: string = "http://api.openstreetmap.org/api/0.6/map?bbox=" + box;
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
            }
        )
    }
}