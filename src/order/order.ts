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

import { UserAddress } from '../user.service';

//
// Define order shipping
export class OrderShipping extends UserAddress {
  public when: Date;
  public hours: number;

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

  //
  // the current shipping day is short date for the placed orders
  public static currentShippingDay() {
    return (new Date()).dayToDates(config.shared.order.weekdays)[0];
  }

  //
  // the next shipping day
  public static nextShippingDay() {
    const potential = config.potentialShippingDay();
    let noshipping;
    const next = potential.dayToDates(
      config.shared.order.weekdays
    );

    //
    // no closed date
    if (!config.shared.noshipping || !config.shared.noshipping.length) {
      return next[0];
    }

    // there is cloased dates
    // next contains the potentials shipping days,
    // we must return the first date available for shipping
    for (let j = 0; j < next.length; j++) {
      for (let i = 0; i < config.shared.noshipping.length; i++) {
    // TODO TSLINT
    // Expected a 'for-of' loop instead of a 'for' loop with this simple iteration (prefer-for-of)
        noshipping = config.shared.noshipping[i];
        if (!next[j].in(noshipping.from, noshipping.to)) { return next[j]; }
      }
    }

    // else
    // after 7 days we cant order anyway!
    return;
  }

  //
  // a full week of available shipping days
  // limit to nb days (default is <7)
  public static fullWeekShippingDays(limit?) {
    const next = config.potentialShippingWeek();
    const lst: any[] = [];
    // const find = false,
    const today = new Date();

    //
    // default date limit is defined by
    limit = limit || config.shared.order.uncapturedTimeLimit;
    limit = limit && today.plusDays(limit + 0);

    function format(lst) {
      //
      // sorting dates
      // TOCHECK TSLINT
      lst = lst.sort((a, b) => {
        return a.getTime() - b.getTime();
      });

      //
      // limit lenght of a week
      // TOCHECK TSLINT
      return lst.filter((date) => {
        return (!limit || date < limit);
      });

    }

    //
    // no closed date
    if (!config.shared.noshipping || !config.shared.noshipping.length) {
      return format(next);
    }

    // there is cloased dates
    // next contains the potentials shipping days,
    // we must return the first date available for shipping
    // TOCHECK TSLINT
    next.forEach((shippingday) => {
      const find = config.shared.noshipping.find((noshipping) => shippingday.in(noshipping.from, noshipping.to));
      if (!find) { lst.push(shippingday); }
    });

    return format(lst);
  }

  public static findPastWeekOfShippingDay(when) {
    // init the date at begin of the week
    let next = new Date(when.getTime() - (when.getDay() * 86400000));
    let all: any[] = [];
    let nextDate;
    let nextDay;

    // jump one week past
    next = new Date(next.getTime() - 86400000 * 7);
    // TOCHECK TSLINT
    config.shared.order.weekdays.forEach((day) => {
      nextDay = (day >= next.getDay()) ? (day - next.getDay()) : (7 - next.getDay() + day);
      nextDate = new Date(nextDay * 86400000 + next.getTime());
      if (config.shared.order.weekdays.indexOf(nextDate.getDay()) !== -1) { all.push(nextDate); }

    });

    // sorting dates
    all = all.sort((a, b) => b.getTime() - a.getTime());
    return all;
  }

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

  /** order identifier */
  public oid: number;

  /* compute a rank for the set of orders to be shipped together */
  public rank: number;

  /* customer email */
  public email: string;
  public created: Date;
  public closed?: Date;

  /* customer evaluation */
  public score: number;

  /* full customer details */
  public customer: any;

  /* order canceled reason and dates */
  public cancel?: {
    reason: string; // string|EnumCancelReason;
    when: Date;
  };

  /* discount_code:{type: String}, */
  /* cart_token:{type: String}, */

  public payment: {
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

  public fulfillments: {
    status: string; // string|EnumFulfillments;
  };

  public items: OrderItem[];

  public vendors: [{
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

  public shipping: {
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
    priority?: number,
    position?: number,
    bags?: number,
    estimated?: number
  };

  public errors?: any[];

  constructor(json?: any) {
    Object.assign(this, this.defaultOrder, json || {});

    this.shipping.when = new Date(this.shipping.when);
    this.created = new Date(this.created);
    this.closed = new Date(this.closed);

    //
    // default order position
    // TODO TSLINT
    // Missing radix parameter (radix)
    this.shipping.position = this.shipping.position || parseInt(this.shipping.postalCode) * 10;
  }

  //
  // return the next shipping day available for customers
  public findNextShippingDay() {
    return Order.nextShippingDay();
  }

  //
  // return the next shipping day available for Logistic
  public findCurrentShippingDay() {
    return Order.currentShippingDay();
  }

  //
  // get amount after (shipping+fees) deductions
  public getExtraDiscount() {
    const total = this.getTotalPrice();
    const subtotal = this.getSubTotal();
    return subtotal - total;
  }

  //
  // get amount of discount for this order
  public getTotalDiscount() {
    let amount = 0;
    // TOCHECK TSLINT
    this.vendors.forEach((vendor) => {
      amount += (vendor.discount && vendor.discount.finalAmount || 0);
    });

    return amount;
  }

  public getFees(amount) {
    const order = this;
    return parseFloat((this.payment.fees.charge * amount).toFixed(2));
  }

  public getSubTotal() {
    let total = 0.0;
    if (this.items) {
      // TOCHECK TSLINT
      this.items.forEach((item) =>  {
        //
        // item should not be failure (fulfillment)
        if (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) {
          total += item.finalprice;
        }
      });
    }

    return Utils.roundAmount(total);
  }

  //
  // stotal = items + shipping - total discount
  //  total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places
  public getTotalPrice(factor?: number) {
    let total = 0.0;
    if (this.items) {
      // TOCHECK TSLINT
      this.items.forEach((item) => {
        //
        // item should not be failure (fulfillment)
        if (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) {
          total += item.finalprice;
        }
      });
    }
    // before the payment fees!
    // add shipping fees
    total += this.getShippingPrice();

    //
    // remove discout offer by shop
    total -= this.getTotalDiscount();

    //
    // add gateway fees
    total += this.payment.fees.charge * total;

    // add mul factor
    if (factor) { total *= factor; }

    return Utils.roundAmount(total);
  }

  public getShippingPrice() {

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

  public getOriginPrice(factor) {
    let total = 0.0;
    if (this.items) {
      // TOCHECK TSLINT
      this.items.forEach((item) =>  {
        //
        // item should not be failure (fulfillment)
        if (item.fulfillment.status !== EnumFulfillments[EnumFulfillments.failure]) {
          total += (item.price * item.quantity);
        }
      });
    }

    // before the payment fees!
    // add shipping fees (10CHF)
    total += this.getShippingPrice();

    //
    // add gateway fees
    total += this.payment.fees.charge * total;

    // add mul factor
    if (factor) { total *= factor; }

    return Utils.roundAmount(total);
  }

  public getPriceDistance(item) {
    let original = 0.0;
    let validated = 0.0;
    if (!item && this.items) {
      // TOCHECK TSLINT
      this.items.forEach((item) =>  {
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

  public getShippingLabels() {
    throw new Error('Not implemented');
    //  var when=new Date(this.shipping.when);
    //  var time=cart.shippingTimeLabel(this.shipping.hours);
    //  var date=moment(when).format('dddd DD MMM YYYY', 'fr');

    //  return {date:date,time:time};
  }

  public getProgress() {
    //
    // end == 100%
    const end = this.items.length;
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
    for (const i in this.items) {
      if ([EnumFulfillments[EnumFulfillments.fulfilled], EnumFulfillments[EnumFulfillments.failure]].indexOf(this.items[i].fulfillment.status) !== -1) {
        progress++;
      }
    }
    return (progress / end * 100.00);
  }

  public getFulfilledIssue() {
    const issue = [];
    this.items.forEach((item: OrderItem) => {
      if (item.fulfillment.issue &&
        item.fulfillment.issue !== EnumOrderIssue[EnumOrderIssue.issue_no_issue]) {
          issue.push(item);
      }
    });
    return issue;
  }

  public getFulfilledFailure() {
    let failure = 0;
    for (const i in this.items) {
      if ([EnumFulfillments[EnumFulfillments.failure]].indexOf(this.items[i].fulfillment.status) !== -1) {
        failure++;
      }
    }
    // count failure on initial order
    return failure;
  }

  public getFulfilledStats() {
    const failure = this.getFulfilledStats();
    // count failure on initial order
    return failure + '/' + (this.items.length);

  }
  public getFulfilledProgress() {
    let progress = 0;
    for (const i in this.items) {
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
