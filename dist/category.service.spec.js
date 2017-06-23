"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@angular/core/testing");
const category_service_1 = require("./category.service");
describe('CategoryService', () => {
    beforeEach(() => {
        testing_1.TestBed.configureTestingModule({
            providers: [category_service_1.CategoryService]
        });
    });
    it('should ...', testing_1.inject([category_service_1.CategoryService], (service) => {
        expect(service).toBeTruthy();
    }));
});
//# sourceMappingURL=category.service.spec.js.map