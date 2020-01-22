
export class Config {
  constructor() {
    this.shared = {};
    this.isAvailable = false;
  }
  public isAvailable: boolean;
  public shared: any;

  public API_SERVER: string;
  public API_VERSION: string;

  public LOG_LEVEL: string;

  public AUTH_SUCCESS_REDIRECT_URL: string;
  public AUTH_ERROR_REDIRECT_URL: string;

  public user: any;
  public loader: string[];

  public loginPath: string[];
  public readonlyPath: string[];
  public avoidShopUIIn: string[];

  //
  // Compute the next potential shipping day.
  // It depends on the hours needed to harvest/prepare a placed order
  public potentialShippingDay(): Date {
    const now = new Date();
    const potential = new Date(now.getTime() + 3600000 * (this.shared.order.timelimit));

    //
    // timelimitH is hour limit to place an order
    if (potential.getHours() >= this.shared.order.timelimitH) {
      //
      // set shipping time to fix the printed countdown (eg. 'dans un jour') 16:00 vs. 12:00
      potential.setHours(this.shared.order.timelimitH, 0, 0, 0);
      return potential.plusDays(1);
    }

    //
    // set shipping time to fix the printed countdown (eg. 'dans un jour') 16:00 vs. 12:00
    potential.setHours(this.shared.order.timelimitH, 0, 0, 0);

    // next date depends on the hours needed to prepare a placed order
    return potential;

  }

  //
  // Compute the next potential shipping days in one week.
  public potentialShippingWeek() {
    const potential = this.potentialShippingDay();
    return potential.dayToDates(
      config.shared.order.weekdays
    );
  }

  public getShippingWeek() {
    const oneWeek = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

    //
    // all the week is off!
    if (!this.shared.order) {
      return oneWeek.map((day, i) => ({label: day, state: 'disabled'}));
    }
    //
    // TODO makes the available days sync with noshipping dates

    // this.shared.noshipping.forEach((schedule) => {
    //   let from=new Date(schedule.from);
    //   let to=new Date(schedule.to);
    // });

    return oneWeek.map((day, i) => {

      return (this.shared.order.weekdays.indexOf(i) > -1) ?
        {label: day, state: ''} : {label: day, state: 'disabled'};
    });
  }

  //
  // map potential shipping week
  // with reason of closed
  public noShippingMessage() {
    return this.potentialShippingWeek().map((shipping) => {
      const find = this.shared.noshipping.find((noshipping) => {
        return shipping.in(noshipping.from, noshipping.to);
      });
      if (find) {
        shipping.message = find.reason;
      }
      return shipping;
    });

  }

  public getShippingDays(): Date[] {
    return this.shared.shippingweek || [];
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
