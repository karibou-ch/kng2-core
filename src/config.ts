import { Hub } from "./hub.service";



export class Config {
  constructor() {
    this.shared = {};
    this.isAvailable = false;
  }
  isAvailable: boolean;
  shared: any;

  API_SERVER: string;
  API_VERSION: string;

  LOG_LEVEL: string;

  AUTH_SUCCESS_REDIRECT_URL: string;
  AUTH_ERROR_REDIRECT_URL: string;

  user: any;
  loader: string[];

  loginPath: string[];
  readonlyPath: string[];
  avoidShopUIIn: string[];

  //
  // Compute the next potential shipping day.
  // It depends on the hours needed to harvest/prepare a placed order
  potentialShippingDay(hub:Hub): Date {
    const currentHub = hub || this.shared.hub;
    const now = new Date(),
        potential = new Date(now.getTime() + 3600000 * (currentHub.timelimit));

    //
    // timelimitH is hour limit to place an order
    if (potential.getHours() >= currentHub.timelimitH) {
      //
      // set shipping time to fix the printed countdown (eg. 'dans un jour') 16:00 vs. 12:00
      potential.setHours(currentHub.timelimitH, 0, 0, 0);
      return potential.plusDays(1);
    }

    //
    // set shipping time to fix the printed countdown (eg. 'dans un jour') 16:00 vs. 12:00
    potential.setHours(currentHub.timelimitH, 0, 0, 0);

    // next date depends on the hours needed to prepare a placed order
    return potential;

  }

  //
  // Compute the next potential shipping days in one week.
  potentialShippingWeek(hub: Hub) {
    const currentHub = hub || this.shared.hub;
    const potential = this.potentialShippingDay(currentHub);
    return potential.dayToDates(
      currentHub.weekdays
    );
  }


  //
  // map potential shipping week
  // with reason of closed
  noShippingMessage(hub: Hub) {
    const $hub = hub || this.shared.hub;
    return this.potentialShippingWeek($hub).map(shipping => {
      const find = $hub.noshipping.find(noshipping => {
        return shipping.in(noshipping.from, noshipping.to);
      });
      if (find) {
        shipping.message = find.reason;
      }
      return shipping;
    });

  }


  getDefaultTimeByDay(day:Date): number {
    // get default value before shared config is loaded (FIXME remove => (day.getDay()==6)?12:16)    
    if(!this.shared.shipping ||!this.shared.shipping.defaultTimeByDay) {
      return (day.getDay()==6)?12:16;
    }
    return this.shared.shipping.defaultTimeByDay[day.getDay()];
  }

  getShippingDistrict(postalCode) {
    const districts = Object.keys(this.shared.shipping.district);
    const district = districts.find( district => {
      return this.shared.shipping.district[district] &&
             this.shared.shipping.district[district].indexOf(postalCode) !== -1;
    });
    // FIXME hypercenter should not be default
    return district || 'hypercenter';
  }

}


export interface ConfigMenu {
  name: {
    en: string;
    fr: string;
    de: string;
  };
  url: string;
  weight: number;
  group: string;
  active: boolean;
}

/**
 * shared:{
 *  keys:{
 *    pubUpcare:string
 *    pubMap:string
 *  }
 * }
 */

export enum ConfigKeyStoreEnum {
  KIO2_LOGIN_REMEMBER   = 0,
  KIO2_SERVER           = 1
}
export let config: Config = new Config();
