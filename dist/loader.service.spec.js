"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const loader_service_1 = require("./loader.service");
describe('LoaderService', () => {
    beforeEach(() => {
        testing_1.TestBed.configureTestingModule({
            providers: [loader_service_1.LoaderService]
        });
    });
    it('should ...', testing_1.inject([loader_service_1.LoaderService], (service) => {
        expect(service).toBeTruthy();
    }));
});
//# sourceMappingURL=loader.service.spec.js.map