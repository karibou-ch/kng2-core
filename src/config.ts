import { Hub } from "./hub.service";

export const configCors = () => {
  return (window.location.host.indexOf('localhost') == 0);
}


export class Config {
  constructor(cfg?) {
    this.shared = {};
    if(cfg) {
      Object.assign(this,cfg);
    }
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

  preloadOrders;

  /**
   * @deprecated Utiliser CalendarService.potentialShippingDay() à la place.
   * Cette méthode a un bug de timezone (getHours/setHours au lieu de getUTCHours/setUTCHours).
   * La logique correcte et testée se trouve dans CalendarService.
   */
  potentialShippingDay(hub:Hub): Date {
    console.warn('Config.potentialShippingDay() est déprécié. Utiliser CalendarService.potentialShippingDay()');
    const currentHub = hub || this.shared.hub;
    const now = new Date();
    const potential = new Date(now.getTime() + 3600000 * currentHub.timelimit);

    // ⚠️ BUG TIMEZONE : utilise getHours() au lieu de getUTCHours()
    // FIXME: Migrer vers CalendarService qui utilise UTC correctement
    if (potential.getHours() >= currentHub.timelimitH) {
      potential.setHours(currentHub.timelimitH, 0, 0, 0);
      return potential.plusDays(1);
    }

    potential.setHours(currentHub.timelimitH, 0, 0, 0);
    return potential;
  }

  /**
   * @deprecated Utiliser CalendarService.timeleftBeforeCollect() à la place.
   * Cette méthode a un bug de timezone (setHours au lieu de setUTCHours).
   * La logique correcte, testée et documentée se trouve dans CalendarService.
   */
  timeleftBeforeCollect(hub, customTimelimit?:number,when?:Date):number{
    console.warn('Config.timeleftBeforeCollect() est déprécié. Utiliser CalendarService.timeleftBeforeCollect()');
    hub = hub || this.shared.hub;

    const preparationHours = (typeof customTimelimit === 'number' && customTimelimit > 0) ? customTimelimit : hub.timelimit;
    const collectHour = hub.timelimitH;
    const tempHubForCalc = { ...hub, timelimit: preparationHours };
    const chosenShippingDate = when || this.potentialShippingDay(tempHubForCalc);

    if (!chosenShippingDate) {
      return -1;
    }

    // ⚠️ BUG TIMEZONE : utilise setHours() au lieu de setUTCHours()
    // FIXME: Migrer vers CalendarService qui utilise UTC correctement
    const collectDateTime = new Date(chosenShippingDate);
    collectDateTime.setHours(collectHour, 0, 0, 0);

    const deadlineMilliseconds = collectDateTime.getTime() - (preparationHours * 3600000);
    const cutoffDateTime = new Date(deadlineMilliseconds);
    const now = Date.now();
    const timeLeftInHours = (cutoffDateTime.getTime() - now) / 3600000;

    return timeLeftInHours;
  }

  /**
   * @deprecated Utiliser CalendarService.potentialShippingWeek() à la place.
   * Cette méthode dépend de potentialShippingDay() qui a un bug de timezone.
   * La logique correcte se trouve dans CalendarService.
   */
  potentialShippingWeek(hub: Hub) {
    console.warn('Config.potentialShippingWeek() est déprécié. Utiliser CalendarService.potentialShippingWeek()');
    const currentHub = hub || this.shared.hub;
    const potential = this.potentialShippingDay(currentHub);
    return potential.dayToDates(
      currentHub.weekdays
    );
  }

  /**
   * @deprecated Utiliser CalendarService.noShippingMessage() à la place.
   * Cette méthode dépend de potentialShippingWeek() qui a un bug de timezone.
   * La logique correcte se trouve dans CalendarService.
   */
  noShippingMessage(hub: Hub) {
    console.warn('Config.noShippingMessage() est déprécié. Utiliser CalendarService.noShippingMessage()');
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
