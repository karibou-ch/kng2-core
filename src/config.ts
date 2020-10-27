


export class Config{
  constructor(){
    this.shared={};
    this.isAvailable=false;
  }
  isAvailable:boolean;
  shared:any;

  API_SERVER:string;
  API_VERSION:string;

  LOG_LEVEL:string;

  AUTH_SUCCESS_REDIRECT_URL:string;
  AUTH_ERROR_REDIRECT_URL:string;

  user:any;
  loader:string[];

  loginPath:string[];
  readonlyPath:string[];
  avoidShopUIIn:string[];

  //
  // Compute the next potential shipping day.
  // It depends on the hours needed to harvest/prepare a placed order
  potentialShippingDay(): Date {
    let now = new Date(),
        potential = new Date(now.getTime() + 3600000 * (this.shared.hub.timelimit));

    //
    // timelimitH is hour limit to place an order
    if (potential.getHours() >= this.shared.hub.timelimitH) {
      //
      // set shipping time to fix the printed countdown (eg. 'dans un jour') 16:00 vs. 12:00
      potential.setHours(this.shared.hub.timelimitH, 0, 0, 0);
      return potential.plusDays(1);
    }

    //
    // set shipping time to fix the printed countdown (eg. 'dans un jour') 16:00 vs. 12:00
    potential.setHours(this.shared.hub.timelimitH, 0, 0, 0);

    // next date depends on the hours needed to prepare a placed order
    return potential;

  }

  //
  // Compute the next potential shipping days in one week.
  potentialShippingWeek() {
    let potential = this.potentialShippingDay();
    return potential.dayToDates(
      config.shared.hub.weekdays
    );
  }

  getShippingWeek() {
    let oneWeek=['Di','Lu','Ma','Me','Je','Ve','Sa'], today=new Date();

    //
    // all the week is off!
    if(!this.shared.order){
      return oneWeek.map((day,i)=>{return {label:day,state:'disabled'}});
    }

    return oneWeek.map((day,i) => {
      return (this.shared.hub.weekdays.indexOf(i) > -1) ?
        {label: day, state: ''} : { label: day, state: 'disabled'};
    });
  }

  //
  // map potential shipping week
  // with reason of closed
  noShippingMessage() {
    return this.potentialShippingWeek().map(shipping => {
      const find = this.shared.hub.noshipping.find(noshipping => {
        return shipping.in(noshipping.from, noshipping.to);
      });
      if (find) {
        shipping.message = find.reason;
      }
      return shipping;
    });

  }

  getShippingDays():Date[]{
    return this.shared.shippingweek||[];
  }
}


export interface ConfigMenu{
  name:{
    en:string;
    fr:string;
    de:string;
  };
  url:string;
  weight:number;
  group:string;
  active:boolean
}

/**
 * shared:{
 *  keys:{
 *    pubUpcare:string
 *    pubMap:string
 *  }
 * }
 */

export enum ConfigKeyStoreEnum{
  KIO2_LOGIN_REMEMBER   = 0,
  KIO2_SERVER           = 1
}
export var config:Config = new Config();
