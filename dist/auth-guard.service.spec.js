"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const auth_guard_service_1 = require("./auth-guard.service");
describe('AuthGuardService', () => {
    beforeEach(() => {
        testing_1.TestBed.configureTestingModule({
            providers: [auth_guard_service_1.AuthGuardService]
        });
    });
    it('should ...', testing_1.inject([auth_guard_service_1.AuthGuardService], (service) => {
        expect(service).toBeTruthy();
    }));
});
//# sourceMappingURL=auth-guard.service.spec.js.map