interface ITweet {
    Name: string;
    Text: string;
    URLPicture: string;
    Longitude: 7.7554;
    Latitude: 48.5844;
}

class Twittalert extends BABYLON.Mesh {

    public lifeSpan: number = 10000;
    public minDist: number = 20;
    public maxDist: number = 80;
    public texture: BABYLON.GUI.AdvancedDynamicTexture;
    public container: BABYLON.GUI.Container;

    constructor(
        position: BABYLON.Vector3,
        content: string,
        date: string,
        author: string,
        pictureUrl: string,
        scene: BABYLON.Scene
    ) {
        super("TwittAlert", scene);
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
        authorBox.fontSize = 18
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
        metaBox.fontSize = 16
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
        textBox.fontSize = 14
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

        setTimeout(
            () => {
                scene.unregisterBeforeRender(this.popIn);
                scene.unregisterBeforeRender(this.update);
                scene.registerBeforeRender(this.kill);
            },
            this.lifeSpan
        );
    }

    public timeout: number = 0;

    public popIn = () => {
        console.log("PopIn");
        this.container.alpha += 0.02;
        if (this.container.alpha >= this.computeAlpha()) {
            this.container.alpha = 1;
            this.getScene().unregisterBeforeRender(this.popIn);
            this.getScene().registerBeforeRender(this.update);
        }
    }

    public computeAlpha(): number {
        let alpha: number = 0;
        let dist: number = BABYLON.Vector3.Distance(Main.instance.scene.activeCamera.position, this.position);
        if (dist > this.maxDist) {
            alpha = 0;
        } else if (dist < this.minDist) {
            alpha = 1;
        } else {
            let delta: number = dist - this.minDist;
            alpha = - delta / (this.maxDist - this.minDist) + 1;
        }
        return alpha;
    }

    public update = () => {
        console.log("Update");
        this.container.alpha = this.computeAlpha();
    }

    public kill = () => {
        console.log("Kill");
        this.container.alpha -= 0.01;
        if (this.container.alpha <= 0) {
            this.getScene().unregisterBeforeRender(this.kill);
            this.container.linkWithMesh(undefined);
            this.container.dispose();
            this.texture.dispose();
            this.dispose();
        }
    }
}