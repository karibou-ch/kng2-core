import {
  EnumCancelReason,
  EnumFinancialStatus,
  EnumFulfillments,
  EnumOrderIssue,
  EnumShippingMode
} from './order.enum';

//
// load es5 hooks
import '../es5';

import { Utils } from '../util';

//
// get global configuration
import { config } from '../config';

import { User } from '../user.service';


//
// Define an item of this order
export interface OrderItem {
  sku: number;
  title: string;
  hub: string;
  category: string;
  bundle: boolean|"true"|"false";

  //
  // for subscription
  frequency?: string;

  //
  // customer quantity
  quantity: number;

  //
  // given price
  price: number;
  part: string;

  //
  // thumbnail
  thumb?: string;

  //
  // real price, maximum +/- 10% of given price
  finalprice: number;

  //
  // customer note
  note?: string;
  audio?: string;
  audioType?:string;

  //
  // product variation is not yet implemented
  variant?: {
    title: string;
  };

  /* where is the product now? */
  fulfillment: {
    refunded?: boolean|"true"|"false";
    request: string; // string|EnumOrderIssue;
    issue: string; // string|EnumOrderIssue;
    status: string; // string|EnumFulfillments;
    shipping: string; // string|EnumShippingMode;
    note?: string;
    //
    // date/time for the first activity is saved
    timestamp: Date;
  };
  vendor: string;
}

export interface Customer {
    id:number;
    displayName?: string;
    phone: string;
    email: string;
    plan: string;
    orders: number;
    errors: number;
    latestErrors: number;
    rating: number;
    profile: string;
}

export interface OrderAddress{
  type:'order'|string,
  parent: number,
  when: Date,
  hours: number,
  name: string,
  note?: string,
  streetAdress: string,
  floor: string,
  postalCode: string,
  region: string,
  geo?: { // geo is not mandatory
    lat: number,
    lng: number
  },
  shipped?: boolean|"true"|"false",
  shopper?: string,
  shopper_time?: string,
  priority?: number,
  position?: number,
  deposit?: boolean|"true"|"false",
  bags?: number,
  estimated?: number
}

export class Order {

  /** HUB identifier */
  hub: string;

  /** order identifier */
  oid: number;

  /* compute a rank for the set of orders to be shipped together */
  rank: number;

  created: Date;
  closed?: Date;

  /* customer evaluation */
  score: number;

  /* full customer details */
  customer: any|Customer;
  /* DEPRECTATED customer email */
  //email?: string;

  /* order canceled reason and dates */
  cancel?: {
    reason: string; // string|EnumCancelReason;
    when: Date;
  };

  /* discount_code:{type: String}, */
  /* cart_token:{type: String}, */

  payment: {
    alias: string;
    number: string;
    expiry: string;
    issuer: string;
    status: string; // string|EnumFinancialStatus;
    handle?: string;
    provider?: string;
    subscription?: string;
    logs: string[],
    customer_credit:number; // paid from customer.balance
    fees: {
      charge: number;
      shipping: number;
    },

    /* for security reason transaction data are encrypted */
    transaction?: string;
  };


  fulfillments: {
    status: string; // string|EnumFulfillments;
  };

  items: OrderItem[];

  vendors: [{
    //
    // only displayed for owner and admin
    fees?: number,
    slug: string,
    name: string,
    fullName: string;
    address: string,
    address2: string,
    geo: {
      lat: number,
      lng: number
    },
    collected: boolean|"true"|"false",
    collected_timestamp: Date,
    gift_timestamp:Date,

    //
    // you can see values only when uid is order.owner, shop.owner, or admin
    // amount & threshold & finalAmount & are saved for security reason
    discount: {
      amount: number,
      threshold: number,
      finalAmount: number
    }
  }];

  shipping: OrderAddress;

  //
  // errors[] => [] for items
  // errors.missingIntent => for SCA
  errors?: any[] | any;

  constructor(json?: any) {
    Order.fromJSON(this, json);
  }

  static fromJSON(dest:Order, json: any) {
    /* default values */
    const defaultOrder = {
      customer: {},
      payment: {},
      fulfillments: {},
      cancel: {},
      items: [],
      vendors: [],
      shipping: {}
    };

    Object.assign(dest, defaultOrder, json || {});
    if(!json) return;

    //
    // case of Order errors
    if (dest.errors) {
      return;
    }
    const phoneNumber = dest.customer.phoneNumbers || [];
    dest.customer.phone = dest.customer.phone|| phoneNumber[0]?.number||'';
    if(!dest.customer.email) {
      dest.customer.email = json.email;
    }

    dest.shipping.when = new Date(dest.shipping.when);
    dest.created = new Date(dest.created);
    dest.closed = dest.closed?new Date(dest.closed):undefined;

    // boolean stuffs
    dest.shipping.deposit = (String(dest.shipping.deposit) == 'true');
    dest.shipping.shipped = (String(dest.shipping.shipped) == 'true');


    dest.vendors.forEach((vendor) => {
      vendor.collected = (String(vendor.collected) == 'true');
    });

    dest.items.forEach((item) => {
      item.bundle = (String(item.bundle) == 'true');
      item.fulfillment.refunded = (String(item.fulfillment.refunded) == 'true');
      item.frequency = (String(item.frequency) == 'false') ? undefined : item.frequency;
    });


    //
    // Normalized HUB
    dest.hub = dest.hub['_id'] || dest.hub;

    //
    // default order position
    dest.shipping.position = dest.shipping.position || parseInt(dest.shipping.postalCode, 10) * 10;
    return dest;
  }



  //
  // the current shipping day is short date for the placed orders
  static currentShippingDay() {
    return (new Date()).dayToDates(config.shared.hub.weekdays)[0];
  }

  //
  // the next shipping day
  static nextShippingDay(user?: User, hub?:any) {
    const potential = config.potentialShippingDay(hub);
    const currentHub   = (hub)? hub:config.shared.hub;
    const next = potential.dayToDates(
      currentHub.weekdays
    );

    //
    // remove complete shipping days for the current HUB
    // its a weak constraint
    const currentRanks = config.shared.currentRanks[currentHub.slug] || {};
    const premiumLimit = (user && user.isPremium()) ? (config.shared.order.premiumLimit || 0) : 0;
    const currentLimit = (config.shared.hub.currentLimit || 1000) + premiumLimit;

    for (let i = next.length - 1; i >= 0; i--) {
      if (currentRanks[next[i].getDay()] >= currentLimit) {
        next.splice(i, 1);
      }
    }

    //
    // no closed date
    // FIXME remove main hub constraint
    if (!currentHub.noshipping || !currentHub.noshipping.length) {
      return next[0];
    }

    // there is cloased dates
    // next contains the potentials shipping days,
    // we must return the first date available for shipping
    for (var j = 0; j < next.length; j++) {
      for (var i = 0; i < currentHub.noshipping.length; i++) {
        const noshipping = currentHub.noshipping[i];
        if (!next[j].in(noshipping.from, noshipping.to)) return next[j];
      }
    }

    // else
    // after 7 days we cant order anyway!
    return;
  }

  //
  // a full week of available shipping days
  // limit to nb days (default is <7)
  static fullWeekShippingDays(hub?:any) {
    const currentHub  = (hub)? hub:config.shared.hub;

    let next = config.potentialShippingWeek(hub),
        lst:any[] = [],
        today = new Date();

    //
    // default date limit is defined by
    let limit = currentHub.uncapturedTimeLimit || 7;

    limit = today.plusDays(limit + 0).getTime();

    function format(lst) {
      //
      // sorting dates
      lst = lst.sort(function (a, b) {
        return a.getTime() - b.getTime();
      });

      //
      // limit length of a week
      return lst.filter(function (date) {
        return (!limit || date.getTime() < limit);
      });

    }


    //
    // no closed date
    if (!currentHub.noshipping || !currentHub.noshipping.length) {
      return format(next);
    }

    // there is cloased dates
    // next contains the potentials shipping days,
    // we must return the first date available for shipping
    next.forEach(function (shippingday) {
      let find = currentHub.noshipping.find(noshipping => shippingday.in(noshipping.from, noshipping.to))
      if (!find) lst.push(shippingday)
    });




    return format(lst);
  }




  //
  // get amount of discount for this order
  getTotalDiscount() {
    let amount = 0;


    this.vendors.forEach(function(vendor) {
      amount += (vendor.discount && vendor.discount.finalAmount || 0);
    });

    return amount;
  }


  getSubTotal(options?) {
    options = options || {};
    let total = 0.0;
    if (this.items) {
      this.items.forEach((item) => {
        //
        // item should not be failure (fulfillment)
        if (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) {
          total += item.finalprice;
        }
      });
    }

    //
    // add karibou fees
    if (!options.withoutCharge) {
      total += this.payment.fees.charge * total;
    }

    return Utils.roundAmount(total);
  }


  //
  // stotal = items + shipping - total discount
  //  total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places
  getTotalPrice(factor?: number) {
    let total = this.getSubTotal();

    // before the payment fees!
    // add shipping fees
    total += this.getShippingPrice();

    //
    // remove discout offer by shop
    total -= this.getTotalDiscount();

    // add mul factor
    if (factor) { total *= factor; }

    return Utils.roundAmount(total);
  }

  getTotalPriceForBill() {
    return this.getTotalPrice() - (this.payment.customer_credit||0);
  }

  getShippingPrice() {

    // check if value exist, (after creation)
    if (this.payment.fees &&
      this.payment.fees.shipping >=0) {
      return this.payment.fees.shipping;
    }

    //
    // this should be always true, if fulfillment exist then shipping is stored
    // assert(!this.fulfillment)
    throw new Error('Not implemented');
    // return cart.shipping();

  }

  getOriginPrice(addFees?: boolean) {
    let total = 0.0;
    if (this.items) {
      this.items.forEach((item) => {
        //
        // item should not be failure (fulfillment)
        if (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) {
          total += (item.price * item.quantity);
        }
      });
    }
    if (addFees) {
      // before the payment fees!
      // add shipping fees (10CHF)
      total += this.getShippingPrice();

      //
      // add gateway fees
      total += this.payment.fees.charge * total;
    }

    return Utils.roundAmount(total);
  }


  getPriceDistance(item) {
    let original = 0.0, validated = 0.0;
    if (!item && this.items) {
      this.items.forEach(function(item) {
        //
        // item should not be failure (fulfillment)
        if (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) {
          original += (item.price * item.quantity);
          validated += (item.finalprice);
        }
      });
    } else if (item) {
      original = (item.price * item.quantity);
      validated = parseFloat(item.finalprice);
    }

    return ((validated / original * 100) - 100);
  }


  getShippingLabels() {
    throw new Error('Not implemented');
    //  var when=new Date(this.shipping.when);
    //  var time=cart.shippingTimeLabel(this.shipping.hours);
    //  var date=moment(when).format('dddd DD MMM YYYY', 'fr');

    //  return {date:date,time:time};
  }

  getProgress() {
    //
    // end == 100%
    let end = this.items.length;
    let progress = 0;
    //
    // failure, create, partial, fulfilled
    if ([EnumFulfillments[EnumFulfillments.fulfilled], EnumFulfillments[EnumFulfillments.failure]].indexOf(this.fulfillments.status) !== -1) {
      return 100.00;
    }

    //
    // pending, paid, voided, refunded
    if (this.payment.status === EnumFinancialStatus[EnumFinancialStatus.pending]) {
      return (progress / end * 100.00);
    }
    //
    // progress order items
    for (let i in this.items) {
      if ([EnumFulfillments[EnumFulfillments.fulfilled], EnumFulfillments[EnumFulfillments.failure]].indexOf(this.items[i].fulfillment.status) !== -1) {
        progress++;
      }
    }
    return (progress / end * 100.00);
  }

  getFulfilledIssue() {
    const issue = [];
    this.items.forEach((item: OrderItem) => {
      if (item.fulfillment.issue &&
        item.fulfillment.issue !== EnumOrderIssue[EnumOrderIssue.issue_no_issue]) {
          issue.push(item);
      }
    });
    return issue;
  }

  getFulfilledFailure() {
    let failure = 0;
    for (let i in this.items) {
      if ([EnumFulfillments[EnumFulfillments.failure]].indexOf(this.items[i].fulfillment.status) !== -1) {
        failure++;
      }
    }
    // count failure on initial order
    return failure;
  }

  getFulfilledStats() {
    let failure = this.getFulfilledStats();
    // count failure on initial order
    return failure + '/' + (this.items.length);

  }
  getFulfilledProgress() {
    let progress = 0;
    for (let i in this.items) {
      if ([EnumFulfillments[EnumFulfillments.failure], EnumFulfillments[EnumFulfillments.fulfilled]].indexOf(this.items[i].fulfillment.status) !== -1) {
        progress++;
      }
    }
    return progress;

  }

  // getTitle(){

  //   //
  //   // failure,
  //   if(this.fulfillments.status===EnumFulfillments.failure){
  //     return "Commande annulée";
  //   }

  //   //
  //   // pending, paid, voided, refunded
  //   if(this.payment.status===EnumFinancialStatus.pending){
  //     return "Commande en attente de paiement";
  //   }

  //   //
  //   // partial
  //   if(this.fulfillments.status===EnumFulfillments.partial){
  //     return "La commande est en attente de traitement";
  //   }
  //   var labels=this.getShippingLabels();
  //   return "Livrée le "+labels.date +' entre '+labels.time;

  // }

}
