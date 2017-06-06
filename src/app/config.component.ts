import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ConfigService } from '../../module/config.service';
import { UserService } from '../../module/user.service';


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

    private config={};

    constructor(
        private configSrv: ConfigService,
        private userSrv:UserService
    ) { }

    ngOnInit() { 
        this.getConfig(); 
    }

    getConfig() {
        this.configSrv.getConfig()
            .subscribe(config => {
                this.config=config
            });
        // this.config=this.configSrv.getConfig();
    }



}