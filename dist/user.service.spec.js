"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const user_service_1 = require("./user.service");
describe('UserService', () => {
    beforeEach(() => {
        testing_1.TestBed.configureTestingModule({
            providers: [user_service_1.UserService]
        });
    });
    it('should ...', testing_1.inject([user_service_1.UserService], (service) => {
        expect(service).toBeTruthy();
    }));
});
//# sourceMappingURL=user.service.spec.js.map