"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EnumFinancialStatus;
(function (EnumFinancialStatus) {
    EnumFinancialStatus[EnumFinancialStatus["pending"] = 0] = "pending";
    EnumFinancialStatus[EnumFinancialStatus["authorized"] = 1] = "authorized";
    EnumFinancialStatus[EnumFinancialStatus["partially_paid"] = 2] = "partially_paid";
    EnumFinancialStatus[EnumFinancialStatus["invoice"] = 3] = "invoice";
    EnumFinancialStatus[EnumFinancialStatus["paid"] = 4] = "paid";
    EnumFinancialStatus[EnumFinancialStatus["partially_refunded"] = 5] = "partially_refunded";
    EnumFinancialStatus[EnumFinancialStatus["refunded"] = 6] = "refunded";
    EnumFinancialStatus[EnumFinancialStatus["voided"] = 7] = "voided";
})(EnumFinancialStatus = exports.EnumFinancialStatus || (exports.EnumFinancialStatus = {}));
;
var EnumFulfillments;
(function (EnumFulfillments) {
    EnumFulfillments[EnumFulfillments["failure"] = 0] = "failure";
    EnumFulfillments[EnumFulfillments["created"] = 1] = "created";
    EnumFulfillments[EnumFulfillments["reserved"] = 2] = "reserved";
    EnumFulfillments[EnumFulfillments["partial"] = 3] = "partial";
    EnumFulfillments[EnumFulfillments["fulfilled"] = 4] = "fulfilled";
})(EnumFulfillments = exports.EnumFulfillments || (exports.EnumFulfillments = {}));
;
var EnumOrderIssue;
(function (EnumOrderIssue) {
    EnumOrderIssue[EnumOrderIssue["issue_no_issue"] = 0] = "issue_no_issue";
    EnumOrderIssue[EnumOrderIssue["issue_missing_client_id"] = 1] = "issue_missing_client_id";
    EnumOrderIssue[EnumOrderIssue["issue_missing_product"] = 2] = "issue_missing_product";
    EnumOrderIssue[EnumOrderIssue["issue_wrong_packing"] = 3] = "issue_wrong_packing";
    EnumOrderIssue[EnumOrderIssue["issue_wrong_product"] = 4] = "issue_wrong_product";
    EnumOrderIssue[EnumOrderIssue["issue_wrong_client_id"] = 5] = "issue_wrong_client_id";
    EnumOrderIssue[EnumOrderIssue["issue_wrong_product_quality"] = 6] = "issue_wrong_product_quality";
})(EnumOrderIssue = exports.EnumOrderIssue || (exports.EnumOrderIssue = {}));
var EnumCancelReason;
(function (EnumCancelReason) {
    EnumCancelReason[EnumCancelReason["customer"] = 0] = "customer";
    EnumCancelReason[EnumCancelReason["fraud"] = 1] = "fraud";
    EnumCancelReason[EnumCancelReason["inventory"] = 2] = "inventory";
    EnumCancelReason[EnumCancelReason["system"] = 3] = "system";
    EnumCancelReason[EnumCancelReason["timeout"] = 4] = "timeout";
    EnumCancelReason[EnumCancelReason["other"] = 5] = "other";
})(EnumCancelReason = exports.EnumCancelReason || (exports.EnumCancelReason = {}));
var EnumShippingMode;
(function (EnumShippingMode) {
    EnumShippingMode[EnumShippingMode["grouped"] = 0] = "grouped";
})(EnumShippingMode = exports.EnumShippingMode || (exports.EnumShippingMode = {}));
//# sourceMappingURL=order.enum.js.map