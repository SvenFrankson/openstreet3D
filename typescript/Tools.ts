var RAD2DEG = 180 / Math.PI;
var PI_4 = Math.PI / 4;
var zoom: number = 25;

class Tools {
    public static LonToX(lon: number): number {
        return (lon + 180) / 360 * Math.pow(2, zoom) - Main.medX;
    }

    public static LatToZ(lat: number): number {
        let res: number = Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180));
        return (1 - res / Math.PI) * Math.pow(2, zoom - 1)  - Main.medZ;
    }

    public static XToLon(x: number): number {
        return (x + Main.medX) / Math.pow(2, zoom) * 360 - 180;
    }
    
    public static ZToLat(z: number): number {
        return Math.atan(Math.sinh(Math.PI - (z + Main.medZ) / Math.pow(2, zoom) * 2 * Math.PI)) * 180 / Math.PI;
    }

    public static RotateToRef(v: BABYLON.Vector2, alpha: number, ref: BABYLON.Vector2): void {
        ref.x = Math.cos(alpha) * v.x - Math.sin(alpha) * v.y;
        ref.y = Math.sin(alpha) * v.x + Math.cos(alpha) * v.y;
    }

    public static AngleFromTo(a: BABYLON.Vector2, b: BABYLON.Vector2): number {
        let angle: number = Math.acos(
            BABYLON.Vector2.Dot(
                a,
                b
            )
        )
        let cross = a.x * b.y - b.x * a.y;
        if (cross < 0) {
            angle = -angle;
        }
        return angle;
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