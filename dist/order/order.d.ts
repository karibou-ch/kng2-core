import { EnumCancelReason, EnumFinancialStatus, EnumFulfillments, EnumOrderIssue, EnumShippingMode } from './order.enum';
import '../util';
export interface OrderItem {
    sku: number;
    title: string;
    category: string;
    quantity: number;
    price: number;
    part: string;
    finalprice: number;
    note?: number;
    variant?: {
        id: string;
        title: string;
    };
    fulfillment: {
        issue: EnumOrderIssue;
        status: EnumFulfillments;
        shipping: EnumShippingMode;
        note?: string;
        timestamp: Date;
    };
    vendor: string;
}
export declare class Order {
    static config: any;
    oid: number;
    rank: number;
    email: string;
    created: Date;
    closed?: Date;
    customer: any;
    cancel?: {
        reason: EnumCancelReason;
        when: Date;
    };
    payment: {
        alias: string;
        number: string;
        expiry: string;
        issuer: string;
        status: EnumFinancialStatus;
        handle?: string;
        provider?: string;
        logs: string[];
        fees: {
            charge: number;
            shipping: number;
        };
        transaction?: string;
    };
    fulfillments: {
        status: EnumFulfillments;
    };
    items: [OrderItem];
    vendors: [{
        fees?: number;
        slug: string;
        name: string;
        fullName: string;
        address: string;
        address2: string;
        geo: {
            lat: number;
            lng: number;
        };
        collected: boolean;
        collected_timestamp: Date;
        discount: {
            amount: number;
            threshold: number;
            finalAmount: number;
        };
    }];
    shipping: {
        when: Date;
        hours: number;
        name: string;
        note?: string;
        streetAdress: string;
        floor: string;
        postalCode: string;
        region: string;
        geo?: {
            lat: number;
            lng: number;
        };
        shipped?: boolean;
        bags?: number;
    };
    potentialShippingDay(): Date;
    potentialShippingWeek(): Date[];
    currentShippingDay(): Date;
    nextShippingDay(): Date;
    fullWeekShippingDays(limit?: any): any;
    findPastWeekOfShippingDay(when: any): any[];
    findNextShippingDay(): Date;
    findCurrentShippingDay(): Date;
    getExtraDiscount(): number;
    getTotalDiscount(): number;
    getFees(amount: any): number;
    getSubTotal(): number;
    getTotalPrice(factor?: number): number;
    getShippingPrice(): number;
    getOriginPrice(factor: any): number;
    getPriceDistance(item: any): number;
    getShippingLabels(): void;
    getProgress(): number;
    getFulfilledStats(): string;
}
