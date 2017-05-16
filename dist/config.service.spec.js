"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const config_service_1 = require("./config.service");
describe('ConfigService', () => {
    beforeEach(() => {
        testing_1.TestBed.configureTestingModule({
            providers: [config_service_1.ConfigService]
        });
    });
    it('should ...', testing_1.inject([config_service_1.ConfigService], (service) => {
        expect(service).toBeTruthy();
    }));
});
//# sourceMappingURL=config.service.spec.js.map