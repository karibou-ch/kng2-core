import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '../../module/config.service';

@Component({
    selector: 'my-config',
    template: `
        <h2>Affichage de la config serveur</h2>
        <div *ngIf="configObject">
            <table>
                <tr>
                    <th>Menu</th>
                </tr>
                <tr *ngFor="let sub of configObject.menu">
                    <td>{{sub.name.fr}} </td>
                </tr>
            </table> <br>
            <table>
                <tr>
                    <th>Market places</th>
                    <th>lat/lng</th>
                </tr>
                
                <tr *ngFor="let sub of configObject.marketplace.list">
                    <td>{{sub.name}} </td>
                    <td>{{sub.lat}}/{{sub.lng}}</td>
                </tr>
            </table><br>
            <table>
                <tr>
                    <th>Shipping Week</th>
                </tr>
                <tr *ngFor="let sub of configObject.shippingweek">
                    <td>{{sub | date:'medium'}} </td>
                </tr>
            </table>
        </div>
        `,
    styles: [`
        table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
        }
`]
})
export class ConfigComponent {

    private configObject;

    constructor(private config: ConfigService) { }

    ngOnInit() { this.getConfig(); }

    getConfig() {
        this.config.getConfig()
            .subscribe(
            res => {
                console.log(res);
                this.configObject = res;
            }
            );
    }

}