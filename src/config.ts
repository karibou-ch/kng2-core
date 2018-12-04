import { Order } from "./order/order";



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

  getShippingWeek(){    
    let oneWeek=['Di','Lu','Ma','Me','Je','Ve','Sa'], today=new Date();

    //
    // all the week is off!
    if(!this.shared.order){
      return oneWeek.map((day,i)=>{return {label:day,state:'disabled'}});
    }
    //
    // TODO makes the available days sync with noshipping dates
    
    // this.shared.noshipping.forEach((schedule) => {      
    //   let from=new Date(schedule.from);
    //   let to=new Date(schedule.to);      
    // });

    return oneWeek.map((day,i)=>{

      return (this.shared.order.weekdays.indexOf(i)>-1)?
        {label:day,state:''}:{label:day,state:'disabled'};
    });
  }

  //
  // map potential shipping week 
  // with reason of closed 
  noShippingMessage(){
    return Order.potentialShippingWeek().map(shipping=>{
      let find=this.shared.noshipping.find(noshipping=>{
        return shipping.in(noshipping.from,noshipping.to);
      });
      if(find){
        shipping.message=find.reason;
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
