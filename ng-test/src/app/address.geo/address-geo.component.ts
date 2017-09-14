import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { LoaderService, UserAddress, ShopAddress } from '../../../../dist';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-address-geo',
  templateUrl: './address-geo.component.html',
  styleUrls: ['./address-geo.component.scss']
})
export class AddressGeoComponent implements OnInit {

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {}

  @Input() address: ShopAddress;
  @Output() onAddressReady = new EventEmitter<any>();

  checkAdd() {

    if (this.address.streetAdress && this.address.postalCode) {
      if (!this.address.region)
        this.address.region = "Suisse";
      var fulladdress = this.address.streetAdress + "," + this.address.postalCode + ", " + this.address.region;
      var url = "//maps.googleapis.com/maps/api/geocode/json?address=" + fulladdress + "&sensor=false";
      this.http.get(url, { withCredentials: false }).subscribe((res: any) => {
        if (res.status == "OK") {
          this.address.geo.lat = res.results[0].geometry.location.lat;
          this.address.geo.lng = res.results[0].geometry.location.lng;
          let lenghtTab: number = res.results[0].address_components.length - 1;
          if (this.address.postalCode == res.results[0].address_components[lenghtTab].long_name) {
             this.onAddressReady.emit(true);
          } else {
            this.onAddressReady.emit(false);
            console.log("Pls add a correct address")
          }
        } else {
          this.onAddressReady.emit(false);
          console.log("Pls add a correct address")
        }
      });

    } else {
      this.onAddressReady.emit(false);
      console.log("Pls file the streetAdress and the postalCode")
    }
  }


}
