"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_enum_1 = require("./order.enum");
require("../util");
class Order {
    potentialShippingDay() {
        var now = new Date(), potential = new Date(now.getTime() + 3600000 * (Order.config.shared.order.timelimit));
        if (potential.getHours() >= Order.config.shared.order.timelimitH) {
            potential.setHours(Order.config.shared.order.timelimitH, 0, 0, 0);
            return potential.plusDays(1);
        }
        potential.setHours(Order.config.shared.order.timelimitH, 0, 0, 0);
        return potential;
    }
    ;
    potentialShippingWeek() {
        let potential = this.potentialShippingDay();
        return potential.dayToDates(Order.config.shared.order.weekdays);
    }
    ;
    currentShippingDay() {
        return (new Date()).dayToDates(Order.config.shared.order.weekdays)[0];
    }
    ;
    nextShippingDay() {
        let potential = this.potentialShippingDay();
        let noshipping;
        let next = potential.dayToDates(Order.config.shared.order.weekdays);
        if (!Order.config.shared.noshipping || !Order.config.shared.noshipping.length) {
            return next[0];
        }
        for (var j = 0; j < next.length; j++) {
            for (var i = 0; i < Order.config.shared.noshipping.length; i++) {
                noshipping = Order.config.shared.noshipping[i];
                if (!next[j].in(noshipping.from, noshipping.to))
                    return next[j];
            }
        }
        return;
    }
    fullWeekShippingDays(limit) {
        var next = this.potentialShippingWeek(), lst = [], find = false, today = new Date();
        limit = limit || Order.config.shared.order.uncapturedTimeLimit;
        limit = limit && today.plusDays(limit + 0);
        function format(lst) {
            lst = lst.sort(function (a, b) {
                return a.getTime() - b.getTime();
            });
            return lst.filter(function (date) {
                return (!limit || date < limit);
            });
        }
        if (!Order.config.shared.noshipping || !Order.config.shared.noshipping.length) {
            return format(next);
        }
        next.forEach(function (shippingday) {
            let find = Order.config.shared.noshipping.find(noshipping => shippingday.in(noshipping.from, noshipping.to));
            if (!find)
                lst.push(shippingday);
        });
        return format(lst);
    }
    findPastWeekOfShippingDay(when) {
        var next = new Date(when.getTime() - (when.getDay() * 86400000)), all = [], nextDate, nextDay;
        next = new Date(next.getTime() - 86400000 * 7);
        Order.config.shared.order.weekdays.forEach(function (day) {
            nextDay = (day >= next.getDay()) ? (day - next.getDay()) : (7 - next.getDay() + day);
            nextDate = new Date(nextDay * 86400000 + next.getTime());
            if (Order.config.shared.order.weekdays.indexOf(nextDate.getDay()) != -1) {
                all.push(nextDate);
            }
        });
        all = all.sort((a, b) => b.getTime() - a.getTime());
        return all;
    }
    ;
    findNextShippingDay() {
        return this.nextShippingDay();
    }
    ;
    findCurrentShippingDay() {
        return this.currentShippingDay();
    }
    ;
    getExtraDiscount() {
        var total = this.getTotalPrice();
        var subtotal = this.getSubTotal();
        return subtotal - total;
    }
    ;
    getTotalDiscount() {
        var amount = 0;
        this.vendors.forEach(function (vendor) {
            amount += (vendor.discount && vendor.discount.finalAmount || 0);
        });
        return amount;
    }
    ;
    getFees(amount) {
        var order = this;
        return parseFloat((this.payment.fees.charge * amount).toFixed(2));
    }
    ;
    getSubTotal() {
        var total = 0.0;
        if (this.items) {
            this.items.forEach(function (item) {
                if (item.fulfillment.status !== order_enum_1.EnumFulfillments.failure) {
                    total += item.finalprice;
                }
            });
        }
        return parseFloat((Math.round(total * 20) / 20).toFixed(2));
    }
    ;
    getTotalPrice(factor) {
        var total = 0.0;
        if (this.items) {
            this.items.forEach(function (item) {
                if (item.fulfillment.status !== order_enum_1.EnumFulfillments.failure) {
                    total += item.finalprice;
                }
            });
        }
        total += this.getShippingPrice();
        total -= this.getTotalDiscount();
        total += this.payment.fees.charge * total;
        if (factor) {
            total *= factor;
        }
        return parseFloat((Math.round(total * 20) / 20).toFixed(2));
    }
    ;
    getShippingPrice() {
        if (this.payment.fees &&
            this.payment.fees.shipping !== null) {
            return this.payment.fees.shipping;
        }
        throw new Error("Not implemented");
    }
    ;
    getOriginPrice(factor) {
        var total = 0.0;
        if (this.items) {
            this.items.forEach(function (item) {
                if (item.fulfillment.status !== order_enum_1.EnumFulfillments.failure) {
                    total += (item.price * item.quantity);
                }
            });
        }
        total += this.getShippingPrice();
        total += this.payment.fees.charge * total;
        if (factor) {
            total *= factor;
        }
        return parseFloat((Math.round(total * 20) / 20).toFixed(2));
    }
    ;
    getPriceDistance(item) {
        var original = 0.0, validated = 0.0;
        if (!item && this.items) {
            this.items.forEach(function (item) {
                if (item.fulfillment.status !== order_enum_1.EnumFulfillments.failure) {
                    original += (item.price * item.quantity);
                    validated += (item.finalprice);
                }
            });
        }
        else if (item) {
            original = (item.price * item.quantity);
            validated = parseFloat(item.finalprice);
        }
        return ((validated / original * 100) - 100);
    }
    ;
    getShippingLabels() {
        throw new Error("Not implemented");
    }
    ;
    getProgress() {
        var end = this.items.length;
        var progress = 0;
        if ([order_enum_1.EnumFulfillments.fulfilled, order_enum_1.EnumFulfillments.failure].indexOf(this.fulfillments.status) !== -1) {
            return 100.00;
        }
        if (this.payment.status === order_enum_1.EnumFinancialStatus.pending) {
            return (progress / end * 100.00);
        }
        for (var i in this.items) {
            if ([order_enum_1.EnumFulfillments.fulfilled, order_enum_1.EnumFulfillments.failure].indexOf(this.items[i].fulfillment.status) !== -1) {
                progress++;
            }
        }
        return (progress / end * 100.00);
    }
    ;
    getFulfilledStats() {
        var failure = 0;
        for (var i in this.items) {
            if ([order_enum_1.EnumFulfillments.failure].indexOf(this.items[i].fulfillment.status) !== -1) {
                failure++;
            }
        }
        return failure + '/' + (this.items.length);
    }
    ;
}
exports.Order = Order;
//# sourceMappingURL=order.js.map