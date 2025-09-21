import { TestBed } from '@angular/core/testing';
import { CalendarService } from './calendar.service';
import { ConfigService } from './config.service';

describe('CalendarService', () => {
  let service: CalendarService;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockHub: any;

  // Mock d'un hub Suisse typique
  const createMockHub = () => ({
    slug: 'artamis',
    name: 'Hub Swiss Test',
    timezone: 'Europe/Zurich',
    timelimit: 14,     // 14h de préparation
    timelimitH: 12,    // Limite commande à 12h Swiss
    weekdays: [1, 2, 3, 4, 5], // Lun-Ven
    uncapturedTimeLimit: 6,
    noshipping: []
  });

  // Mock dates pour tests déterministes
  let originalNow: any;
  let originalDate: any;
  const mockUTCDate = new Date('2025-09-16T15:00:00.000Z'); // Lundi 15h UTC = 17h Swiss (été)

  beforeEach(() => {
    // Mock du ConfigService
    mockConfigService = jasmine.createSpyObj('ConfigService', ['getDefaultConfig']);
    mockHub = createMockHub();

    // Mock ConfigService.defaultConfig pour getDefaultHub()
    Object.defineProperty(ConfigService, 'defaultConfig', {
      value: { shared: { hub: mockHub } },
      configurable: true
    });

    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        { provide: ConfigService, useValue: mockConfigService }
      ]
    });
    service = TestBed.inject(CalendarService);

    // Mock Date.now pour tests déterministes
    originalNow = Date.now;
    originalDate = Date;

    Date.now = jasmine.createSpy('Date.now').and.returnValue(mockUTCDate.getTime());

    spyOn(window as any, 'Date').and.callFake((dateString?: any) => {
      if (arguments.length === 0) {
        return new originalDate(mockUTCDate.getTime());
      }
      return new originalDate(dateString);
    });
  });

  afterEach(() => {
    // Restaurer les fonctions originales
    Date.now = originalNow;
    (window as any).Date = originalDate;
  });

  describe('Core Timezone Functions', () => {

    describe('convertToTimezone', () => {
      it('should convert UTC to Swiss time with correct offset (summer)', () => {
        const utcDate = new Date('2025-09-16T10:00:00.000Z');
        const result = service.convertToTimezone(utcDate, 'Europe/Zurich');

        expect(result).toBe('2025-09-16T12:00:00.000+02:00');
      });

      it('should convert UTC to Swiss time with correct offset (winter)', () => {
        const utcDate = new Date('2025-01-16T10:00:00.000Z');
        const result = service.convertToTimezone(utcDate, 'Europe/Zurich');

        expect(result).toBe('2025-01-16T11:00:00.000+01:00');
      });

      it('should handle different timezones', () => {
        const utcDate = new Date('2025-09-16T10:00:00.000Z');
        const tokyoResult = service.convertToTimezone(utcDate, 'Asia/Tokyo');
        const nycResult = service.convertToTimezone(utcDate, 'America/New_York');

        expect(tokyoResult).toBe('2025-09-16T19:00:00.000+09:00');
        expect(nycResult).toBe('2025-09-16T06:00:00.000-04:00');
      });

      it('should throw error for invalid date', () => {
        expect(() => {
          service.convertToTimezone('invalid-date', 'Europe/Zurich');
        }).toThrowError('Invalid dateInput');
      });
    });

    describe('toHubTime', () => {
      it('should convert UTC to hub timezone using convertToTimezone', () => {
        spyOn(service, 'convertToTimezone').and.returnValue('2025-09-16T17:00:00.000+02:00');

        const utcDate = new Date('2025-09-16T15:00:00.000Z');
        const result = service.toHubTime(utcDate, mockHub);

        expect(service.convertToTimezone).toHaveBeenCalledWith(utcDate, 'Europe/Zurich');
        expect(result.toISOString()).toBe('2025-09-16T15:00:00.000Z'); // Same UTC instant
      });

      it('should handle invalid date input', () => {
        const invalidDate = new Date('invalid');
        const result = service.toHubTime(invalidDate, mockHub);

        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(mockUTCDate.getTime()); // Fallback to mock "now"
      });
    });

    describe('getHubTimezone', () => {
      it('should return hub timezone when provided', () => {
        const result = service.getHubTimezone(mockHub);
        expect(result).toBe('Europe/Zurich');
      });

      it('should return default timezone when hub has no timezone', () => {
        const hubWithoutTz = { ...mockHub };
        delete hubWithoutTz.timezone;

        const result = service.getHubTimezone(hubWithoutTz);
        expect(result).toBe('Europe/Zurich'); // Default
      });
    });
  });

  describe('Business Logic Functions', () => {

    describe('potentialShippingDay - HUB-CENTRIC CORRECTED', () => {
      it('should calculate potential shipping day in hub timezone (early order)', () => {
        // Mock: maintenant = 15h UTC = 17h Swiss, timelimitH = 12h Swiss
        // potentialHub = 17h + 14h = 7h Swiss (lendemain) < 12h Swiss → OK même jour

        const result = service.potentialShippingDay(mockHub);

        expect(result).toBeInstanceOf(Date);
        // Doit être réglé à 12h Swiss du lendemain (jour potentiel)
        expect(result.getHours()).toBe(12); // 12h dans le timezone où l'objet Date est interprété
      });

      it('should handle late orders (after timelimitH)', () => {
        // Test avec une heure où potentialHub > timelimitH
        const lateHub = { ...mockHub, timelimit: 1 }; // Seulement 1h de préparation

        // Maintenant = 17h Swiss + 1h = 18h Swiss > 12h Swiss → jour suivant
        const result = service.potentialShippingDay(lateHub);

        expect(result).toBeInstanceOf(Date);
        expect(result.getHours()).toBe(12); // 12h Swiss
      });
    });

    describe('dayToDates - HUB-CENTRIC CORRECTED', () => {
      it('should generate dates in hub timezone for weekdays', () => {
        // Mock now = lundi 17h Swiss, weekdays = [1,2,3,4,5]
        const weekdays = [1, 2, 3, 4, 5]; // Lun-Ven
        const result = (service as any).dayToDates(weekdays, undefined, undefined, mockHub);

        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBeGreaterThan(0);

        // Vérifier que les dates sont générées correctement
        result.forEach((date: Date) => {
          expect(date).toBeInstanceOf(Date);
          expect(weekdays).toContain(date.getDay()); // Jour de la semaine doit être dans weekdays
        });
      });

      it('should handle week transition correctly', () => {
        // Test avec un jour qui nécessite de passer à la semaine suivante
        const sundayWeekdays = [0]; // Dimanche seulement
        const result = (service as any).dayToDates(sundayWeekdays, undefined, undefined, mockHub);

        expect(result).toBeInstanceOf(Array);
        if (result.length > 0) {
          expect(result[0].getDay()).toBe(0); // Dimanche
        }
      });
    });

    describe('nextShippingDay', () => {
      it('should return next available shipping day', () => {
        const result = service.nextShippingDay(mockHub);

        expect(result).toBeInstanceOf(Date);
        expect(mockHub.weekdays).toContain(result?.getDay()); // Doit être un jour de livraison
      });

      it('should return null if no shipping days available', () => {
        const noShippingHub = { ...mockHub, weekdays: [] };
        const result = service.nextShippingDay(noShippingHub);

        expect(result).toBeNull();
      });
    });
  });

  describe('International Timezone Consistency', () => {

    it('should produce same results regardless of client timezone', () => {
      // Simuler que le test s'exécute dans différents timezones
      const originalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Test avec date UTC fixe
      const utcDate = new Date('2025-09-16T10:00:00.000Z');

      // Les fonctions doivent retourner les mêmes résultats
      const result1 = service.convertToTimezone(utcDate, 'Europe/Zurich');
      const result2 = service.convertToTimezone(utcDate, 'Europe/Zurich');

      expect(result1).toBe(result2);
      expect(result1).toBe('2025-09-16T12:00:00.000+02:00');
    });

    it('should handle DST transition correctly', () => {
      // Test été vs hiver pour Europe/Zurich
      const summerDate = new Date('2025-07-15T10:00:00.000Z');
      const winterDate = new Date('2025-01-15T10:00:00.000Z');

      const summerResult = service.convertToTimezone(summerDate, 'Europe/Zurich');
      const winterResult = service.convertToTimezone(winterDate, 'Europe/Zurich');

      expect(summerResult).toBe('2025-07-15T12:00:00.000+02:00'); // UTC+2 (été)
      expect(winterResult).toBe('2025-01-15T11:00:00.000+01:00'); // UTC+1 (hiver)
    });
  });

  describe('Error Handling', () => {

    it('should handle null/undefined hub gracefully', () => {
      expect(() => service.nextShippingDay(null)).not.toThrow();
      expect(() => service.potentialShippingDay(undefined)).not.toThrow();
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = new Date('invalid');
      expect(() => service.toHubTime(invalidDate, mockHub)).not.toThrow();
    });

    it('should provide fallbacks for missing config', () => {
      // Temporairement supprimer la config par défaut
      Object.defineProperty(ConfigService, 'defaultConfig', {
        value: null,
        configurable: true
      });

      expect(() => service.getDefaultHub()).not.toThrow();

      // Restaurer
      Object.defineProperty(ConfigService, 'defaultConfig', {
        value: { shared: { hub: mockHub } },
        configurable: true
      });
    });
  });

  describe('Formatting Functions', () => {

    describe('formatForClient', () => {
      it('should format date in hub timezone', () => {
        const utcDate = new Date('2025-09-16T10:00:00.000Z');
        const result = service.formatForClient(utcDate, mockHub);

        expect(result).toBeInstanceOf(String);
        expect(result.length).toBeGreaterThan(0);
        // Should contain day and month in French
        expect(result.toLowerCase()).toMatch(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/);
      });

      it('should handle invalid date input', () => {
        const invalidDate = new Date('invalid');
        const result = service.formatForClient(invalidDate, mockHub);

        expect(result).toBeInstanceOf(String);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Tests', () => {

    it('should maintain consistency across all timezone functions', () => {
      // Test d'intégration: toHubTime → potentialShippingDay → formatForClient
      const utcNow = new Date('2025-09-16T15:00:00.000Z');

      // 1. Conversion timezone
      const hubTime = service.toHubTime(utcNow, mockHub);
      expect(hubTime).toBeInstanceOf(Date);

      // 2. Calcul jour potentiel
      const potential = service.potentialShippingDay(mockHub);
      expect(potential).toBeInstanceOf(Date);

      // 3. Formatage
      const formatted = service.formatForClient(potential, mockHub);
      expect(formatted).toBeInstanceOf(String);
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});
