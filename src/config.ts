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

  /**
   * Calculates the time left in hours before the order cutoff for a specific shipping day.
   * This function calculates the actual customer-facing deadline based on the hub's logistics.
   *
   * --- The Logic Explained ---
   * The final order deadline for a customer is determined by two main factors:
   * 1. The time the products need to be ready for pickup by Karibou (`collectHour`). This is fixed by the hub.
   * 2. The time the vendor needs to prepare the order (`preparationHours`). This can be specific to a product.
   *
   * The formula is: `Deadline = (Collection Time on Delivery Day) - (Preparation Duration)`
   *
   * Example:
   * - A customer wants to be delivered on Wednesday.
   * - The hub collects goods from vendors at 12:00 PM on Wednesday (`hub.timelimitH` = 12).
   * - For a specific product, it might need 24 hours of preparation (`customTimelimit` = 24).
   *   -> Deadline: (Wednesday @ 12:00) - 24 hours = Tuesday @ 12:00 PM (12:00).
   *
   * --- Parameter Roles ---
   * @param hub The hub object for which to calculate the deadline.
   * @param customTimelimit Optional. A specific preparation time in hours for a product, overriding the hub's default `hub.timelimit`.
   * @param when Optional. The specific delivery date the customer has chosen. If not provided, the next potential shipping day is used.
   * @returns The time left in hours. Positive if before the deadline, negative if past the deadline.
   */
  timeleftBeforeCollect(hub, customTimelimit?:number,when?:Date):number{
    hub = hub || this.shared.hub;

    // Step 1: Determine the preparation time. Use the product-specific value if it exists, otherwise fall back to the hub's default.
    const preparationHours = (typeof customTimelimit === 'number' && customTimelimit > 0) ? customTimelimit : hub.timelimit;

    // Step 2: The collection hour is fixed by the hub's schedule.
    const collectHour = hub.timelimitH;

    // Step 3: Determine the delivery date we are calculating against.
    // If a specific date 'when' is not provided, we must calculate the earliest possible one.
    // To do this, we need to pass the correct preparation time to potentialShippingDay.
    const tempHubForCalc = { ...hub, timelimit: preparationHours };
    const chosenShippingDate = when || this.potentialShippingDay(tempHubForCalc);

    if (!chosenShippingDate) {
      // If no shipping day can be determined (e.g., hub closed for a long time), no time is left.
      return -1;
    }

    // Step 4: Calculate the exact collection moment on the chosen shipping day.
    const collectDateTime = new Date(chosenShippingDate);
    collectDateTime.setHours(collectHour, 0, 0, 0);

    // Step 5: Calculate the final order deadline by subtracting the preparation time from the collection time.
    const deadlineMilliseconds = collectDateTime.getTime() - (preparationHours * 3600000); // 3,600,000 ms in an hour
    const cutoffDateTime = new Date(deadlineMilliseconds);

    // Step 6: Calculate the difference in hours between now and the final deadline.
    const now = Date.now();
    const timeLeftInHours = (cutoffDateTime.getTime() - now) / 3600000;

    return timeLeftInHours;
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
