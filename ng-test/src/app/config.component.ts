import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ConfigService, LoaderService, UserService } from '../../../';


@Component({
    selector: 'my-config',
    template: `
        <h2>Affichage de la config serveur</h2>
        <div >
            <table>
                <tr>
                    <th>Menu</th>
                </tr>
                <tr *ngFor="let sub of config.shared?.menu">
                    <td>{{sub.name.fr}} </td>
                </tr>
            </table> <br>
            <table>
                <tr>
                    <th>Market places</th>
                    <th>lat/lng</th>
                </tr>
                
                <tr *ngFor="let sub of config.shared?.marketplace.list">
                    <td>{{sub.name}} </td>
                    <td>{{sub.lat}}/{{sub.lng}}</td>
                </tr>
            </table><br>
            <table>
                <tr>
                    <th>Shipping Week</th>
                </tr>
                <tr *ngFor="let sub of config.shared?.shippingweek">
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

    private config = {};

    constructor(
        private configSrv: ConfigService,
        private userSrv: UserService,
        private loaderSrv: LoaderService
    ) { }

    ngOnInit() {
        this.getConfig();
    }

    getConfig() {
        return this.loaderSrv.ready().subscribe(
            res => {
                if (res) {
                    this.config = res[0];
                    //console.log("config-comp", res);
                }
            }
        );

    }



}