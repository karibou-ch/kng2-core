"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const order_service_1 = require("./order.service");
describe('OrderService', () => {
    beforeEach(() => {
        testing_1.TestBed.configureTestingModule({
            providers: [order_service_1.OrderService]
        });
    });
    it('should ...', testing_1.inject([order_service_1.OrderService], (service) => {
        expect(service).toBeTruthy();
    }));
});
//# sourceMappingURL=order.service.spec.js.map