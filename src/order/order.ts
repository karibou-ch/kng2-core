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
import { config, Config } from '../config';

import { UserAddress, User } from '../user.service';


//
// Define order shipping
export class OrderShipping extends UserAddress {
  when: Date;
  hours: number;

  constructor(address: UserAddress, when: Date, hours: number) {
    super(
      address.name,
      address.streetAdress,
      address.floor,
      address.region,
      address.postalCode,
      address.note,
      address.primary,
      address.geo
    );
    this.when = new Date(when);
    this.hours = hours;
  }

}

//
// Define an item of this order
export interface OrderItem {
  sku: number;
  title: string;
  category: string;

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

  //
  // product variation is not yet implemented
  variant?: {
    title: string;
  };

  /* where is the product now? */
  fulfillment: {
    refunded?: boolean;
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


export class Order {

  /* default values */
  private defaultOrder = {
    customer: {},
    payment: {},
    fulfillments: {},
    cancel: {},
    items: [],
    vendors: [],
    shipping: {}
  };

  /** HUB identifier */
  hub: string;

  /** order identifier */
  oid: number;

  /* compute a rank for the set of orders to be shipped together */
  rank: number;

  /* customer email */
  email: string;
  created: Date;
  closed?: Date;

  /* customer evaluation */
  score: number;

  /* full customer details */
  customer: any;

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
    logs: string[],
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
    collected: boolean,
    collected_timestamp: Date,
    //
    // you can see values only when uid is order.owner, shop.owner, or admin
    // amount & threshold & finalAmount & are saved for security reason
    discount: {
      amount: number,
      threshold: number,
      finalAmount: number
    }
  }];

  shipping: {
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
    shipped?: boolean,
    shopper?: string,
    shopper_time?: string,
    priority?: number,
    position?: number,
    bags?: number,
    estimated?: number
  };

  //
  // errors[] => [] for items
  // errors.missingIntent => for SCA
  errors?: any[] | any;

  constructor(json?: any) {
    Object.assign(this, this.defaultOrder, json || {});

    //
    // case of Order errors
    if (this.errors) {
      return;
    }

    this.shipping.when = new Date(this.shipping.when);
    this.created = new Date(this.created);
    this.closed = new Date(this.closed);

    //
    // Normalized HUB
    this.hub = this.hub['_id'] || this.hub;

    //
    // default order position
    this.shipping.position = this.shipping.position || parseInt(this.shipping.postalCode, 10) * 10;
  }


  //
  // the current shipping day is short date for the placed orders
  static currentShippingDay() {
    return (new Date()).dayToDates(config.shared.hub.weekdays)[0];
  }

  //
  // the next shipping day
  static nextShippingDay(user?: User) {
    const potential = config.potentialShippingDay();
    const next = potential.dayToDates(
      config.shared.hub.weekdays
    );

    //
    // remove complete shipping days for the current HUB
    // its a weak constraint
    const currentHub   = config.shared.hub.slug;
    if (currentHub) {
      const currentRanks = config.shared.currentRanks[currentHub] || {};
      const premiumLimit = (user && user.isPremium()) ? (config.shared.order.premiumLimit || 0) : 0;
      const currentLimit = (config.shared.hub.currentLimit || 1000) + premiumLimit;

      for (let i = next.length - 1; i >= 0; i--) {
        if (currentRanks[next[i].getDay()] >= currentLimit) {
          next.splice(i, 1);
        }
      }
    }

    //
    // no closed date
    if (!config.shared.hub.noshipping || !config.shared.hub.noshipping.length) {
      return next[0];
    }

    // there is cloased dates
    // next contains the potentials shipping days,
    // we must return the first date available for shipping
    for (var j = 0; j < next.length; j++) {
      for (var i = 0; i < config.shared.hub.noshipping.length; i++) {
        const noshipping = config.shared.hub.noshipping[i];
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
  static fullWeekShippingDays(limit?) {
    let next = config.potentialShippingWeek(),
        lst:any[] = [],
        today = new Date();

    //
    // default date limit is defined by
    limit = limit || config.shared.order.uncapturedTimeLimit;
    limit = limit && today.plusDays(limit + 0);

    function format(lst) {
      //
      // sorting dates
      lst = lst.sort(function (a, b) {
        return a.getTime() - b.getTime();
      });

      //
      // limit lenght of a week
      return lst.filter(function (date) {
        return (!limit || date < limit);
      });

    }


    //
    // no closed date
    if (!config.shared.hub.noshipping || !config.shared.hub.noshipping.length) {
      return format(next);
    }

    // there is cloased dates
    // next contains the potentials shipping days,
    // we must return the first date available for shipping
    next.forEach(function (shippingday) {
      let find = config.shared.hub.noshipping.find(noshipping => shippingday.in(noshipping.from, noshipping.to))
      if (!find) lst.push(shippingday)
    });




    return format(lst);
  }


  static findPastWeekOfShippingDay(when) {
    // init the date at begin of the week
    var next = new Date(when.getTime() - (when.getDay() * 86400000)), all:any[] = [], nextDate, nextDay;

    // jump one week past
    next = new Date(next.getTime() - 86400000 * 7);

    config.shared.hub.weekdays.forEach(function (day) {
      nextDay = (day >= next.getDay()) ? (day - next.getDay()) : (7 - next.getDay() + day);
      nextDate = new Date(nextDay * 86400000 + next.getTime());
      if (config.shared.hub.weekdays.indexOf(nextDate.getDay()) !== -1)
      { all.push(nextDate); }

    });

    // sorting dates
    all = all.sort((a, b) => b.getTime() - a.getTime());
    return all;
  }

  //
  // return the next shipping day available for customers
  findNextShippingDay() {
    return Order.nextShippingDay();
  }

  //
  // return the next shipping day available for Logistic
  findCurrentShippingDay() {
    return Order.currentShippingDay();
  }

  //
  // get amount after (shipping+fees) deductions
  getExtraDiscount() {
    let total = this.getTotalPrice();
    let subtotal = this.getSubTotal();
    return subtotal - total;
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

  getFees(amount) {
    let order = this;
    return parseFloat((this.payment.fees.charge * amount).toFixed(2));
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

  getShippingPrice() {

    // check if value exist, (after creation)
    if (this.payment.fees &&
      this.payment.fees.shipping !== null) {
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
