//https://stackoverflow.com/questions/29758765/json-to-typescript-class-instance/29759472#29759472
import {Injectable} from "@angular/core";
import {Http} from "@angular/http";

@Injectable()
export class SerializationService {
   constructor() {}

    toInstance<T>(obj: T, json: string) : T {
        var jsonObj = JSON.parse(json);

        if (typeof obj["fromJSON"] === "function") {
            obj["fromJSON"](jsonObj);
        }
        else {
            for (var propName in jsonObj) {
                obj[propName] = jsonObj[propName]
            }
        }

        return obj;
    }
}
