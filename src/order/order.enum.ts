
// TODO Enum are build from available Data on config!!??
// var EnumFinancialStatus=config.shared.order.financialstatus;
export enum EnumFinancialStatus {
  pending, authorized, partially_paid, invoice, paid, partially_refunded, refunded, voided
}

// var EnumOrderStatus    =config.shared.order.status;
export enum EnumFulfillments {
  failure, created, reserved, partial, fulfilled
}

// var EnumOrderIssue     =config.shared.issue.code;
export enum EnumOrderIssue {
  issue_no_issue,
  issue_logistic,
  issue_missing_client_id,
  issue_missing_product,
  issue_wrong_product_quality,
  issue_wrong_packing
}

// var EnumCancelReason   =config.shared.order.cancelreason;
export enum EnumCancelReason {
  customer, fraud, inventory, system, timeout, other
}

export enum EnumShippingMode {
  grouped
}
