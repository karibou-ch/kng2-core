export declare enum EnumFinancialStatus {
    pending = 0,
    authorized = 1,
    partially_paid = 2,
    invoice = 3,
    paid = 4,
    partially_refunded = 5,
    refunded = 6,
    voided = 7,
}
export declare enum EnumFulfillments {
    failure = 0,
    created = 1,
    reserved = 2,
    partial = 3,
    fulfilled = 4,
}
export declare enum EnumOrderIssue {
    issue_no_issue = 0,
    issue_missing_client_id = 1,
    issue_missing_product = 2,
    issue_wrong_packing = 3,
    issue_wrong_product = 4,
    issue_wrong_client_id = 5,
    issue_wrong_product_quality = 6,
}
export declare enum EnumCancelReason {
    customer = 0,
    fraud = 1,
    inventory = 2,
    system = 3,
    timeout = 4,
    other = 5,
}
export declare enum EnumShippingMode {
    grouped = 0,
}
