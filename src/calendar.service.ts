import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Hub } from './hub.service';
import './es5';
import { User } from './user.service';

/**
 * Interface complète pour gérer le timing des commandes produit
 * Centralise toute la logique de countdown, validation et formatage
 */
export interface ProductOrderTiming {
  isOutOfTimeLimit: boolean;          // Trop tard pour commander
  shouldShowCountdown: boolean;       // Afficher le countdown
  hoursLeft: number;                  // Heures restantes (peut être négatif)
  formattedTimeLeft: string;          // "2 h 30 minutes" ou "45 minutes"
  formattedDeadline: string;          // "14h30" (heure de la deadline)
}

/**
 * # CalendarService - Gestion Centralisée des Dates de Livraison
 *
 * ## 🎯 RÔLE ET RESPONSABILITÉS
 *
 * Ce service centralise TOUTE la logique de calcul des dates de livraison.
 * Il est synchronisé avec l'API Calendar backend (calendar.js) testée.
 *
 * **Principe** : Logique pure de business rules, sans état utilisateur.
 * **Input** : Hub configuration + paramètres
 * **Output** : Dates calculées selon les règles métier
 *
 * ## 📋 USE CASES DÉTAILLÉS
 *
 * ### UC1 - Première Visite Utilisateur
 * **Contexte** : Nouvel utilisateur arrive sur le site
 * **Acteurs** : CartService.setContext() → CalendarService
 * **Flow** :
 * 1. ConfigService charge la config du hub
 * 2. CartService appelle CalendarService.nextShippingDay(hub)
 * 3. CalendarService calcule selon hub.weekdays + noshipping + timelimit
 * 4. CartService stocke le résultat comme cache.currentShippingDay
 *
 * ```typescript
 * // Dans CartService.setContext()
 * const nextShippingDay = this.$calendar.nextShippingDay(config.shared.hub);
 * this.cache.currentShippingDay = new Date(nextShippingDay);
 * ```
 *
 * ### UC2 - Commande en Cours (Pending Order)
 * **Contexte** : Utilisateur a une commande authorized/prepaid existante
 * **Acteurs** : CartService.setContext() détecte l'ordre pending
 * **Flow** :
 * 1. CartService trouve order avec status 'authorized'|'prepaid'
 * 2. Extrait order.shipping.when comme date de référence
 * 3. Vérifie via CalendarService.potentialShippingWeek() si toujours valide
 * 4. Si valide : utilise cette date, sinon calcule nextShippingDay()
 *
 * ```typescript
 * // Dans CartService.setContext()
 * if (!this.currentPendingOrder && order) {
 *   const day = new Date(order.shipping.when);
 *   const validDays = this.$calendar.potentialShippingWeek(config.shared.hub);
 *   if (validDays.some(d => d.equalsDate(day))) {
 *     this.cache.currentShippingDay = day; // ✅ Garde la date de l'ordre
 *   } else {
 *     this.cache.currentShippingDay = this.$calendar.nextShippingDay(config.shared.hub);
 *   }
 * }
 * ```
 *
 * ### UC3 - Changement de Date par l'Utilisateur
 * **Contexte** : Utilisateur sélectionne une nouvelle date dans le calendrier
 * **Acteurs** : Component → CartService.setShippingDay() → save()
 * **Flow** :
 * 1. Composant kng-calendar valide la date via CalendarService.isShippingDayAvailable()
 * 2. Si valide : appelle CartService.setShippingDay(newDate, hours)
 * 3. CartService met à jour cache.currentShippingDay + save() automatique
 * 4. Nouvelle préférence persistée côté serveur
 *
 * ```typescript
 * // Dans kng-calendar.component.ts
 * doSetCurrentShippingDay(day: Date) {
 *   if (this.$calendar.isShippingDayAvailable(this.currentHub, day)) {
 *     const hours = this.config.getDefaultTimeByDay(day);
 *     this.$cart.setShippingDay(day, hours); // => save() automatique
 *   }
 * }
 * ```
 *
 * ### UC4 - Validation Temps Restant (Product Page)
 * **Contexte** : Affichage du countdown avant fermeture des commandes
 * **Acteurs** : product.component.ts → CalendarService.timeleftBeforeCollect()
 * **Flow** :
 * 1. Composant récupère currentShippingDay depuis CartService
 * 2. Appelle CalendarService.timeleftBeforeCollect(hub, product.timelimit, shippingDay)
 * 3. CalendarService calcule : (collectTime - preparationHours) - now
 * 4. Composant affiche "Il reste X heures pour commander"
 *
 * ```typescript
 * // Dans product.component.ts
 * updateTimeLeft() {
 *   const shippingDay = this.$cart.getCurrentShippingDay();
 *   const timeLeft = this.$calendar.timeleftBeforeCollect(
 *     this.config.shared.hub,
 *     this.product.attributes.timelimit,
 *     shippingDay
 *   );
 *   this.hoursLeftBeforeOrder = timeLeft;
 * }
 * ```
 *
 * ### UC5 - Affichage Calendrier Semaine
 * **Contexte** : Composant kng-calendar affiche les jours disponibles
 * **Acteurs** : kng-calendar.component.ts → CalendarService.fullWeekShippingDays()
 * **Flow** :
 * 1. Composant appelle CalendarService.fullWeekShippingDays(hub)
 * 2. CalendarService calcule potentialShippingWeek() - noshipping dates
 * 3. Filtre selon uncapturedTimeLimit (6 jours par défaut)
 * 4. Composant affiche la liste des jours sélectionnables
 *
 * ```typescript
 * // Dans kng-calendar.component.ts
 * ngOnInit() {
 *   this.availableDays = this.$calendar.fullWeekShippingDays(this.currentHub);
 *   this.currentWeek = Array.from({length: 7})
 *     .map((id, idx) => (new Date(this.availableDays[0])).plusDays(idx));
 * }
 * ```
 *
 * ### UC6 - Multiple Commandes Même Date (Économie Shipping)
 * **Contexte** : Utilisateur a déjà une commande le même jour
 * **Acteurs** : CartService.hasShippingReductionMultipleOrder() + CalendarService
 * **Flow** :
 * 1. CartService détecte currentPendingOrder.shipping.when == currentShippingDay
 * 2. Vérifie si même adresse de livraison
 * 3. Si OUI : réduction shipping (économie pour le client)
 * 4. Interface affiche "Livraison groupée - Économie réalisée"
 *
 * ```typescript
 * // Dans CartService
 * hasShippingReductionMultipleOrder(address): boolean {
 *   if (this.currentPendingOrder?.shipping) {
 *     const whenDay = this.currentPendingOrder.shipping.when.getDate();
 *     const nextDay = this.cache.currentShippingDay?.getDate();
 *     const sameDay = (whenDay === nextDay);
 *     const sameAddress = UserAddress.isEqual(address, this.currentPendingOrder.shipping);
 *     return sameDay && sameAddress;
 *   }
 *   return false;
 * }
 * ```
 *
 * ### UC7 - Cross-Market Shipping (Multi-Hub)
 * **Contexte** : Produits de différents hubs dans le même panier
 * **Acteurs** : CartService.getShippingDayForMultipleHUBs() + CalendarService
 * **Flow** :
 * 1. CartService détecte items de hubs différents
 * 2. Calcule intersection des jours de livraison via CalendarService
 * 3. Si intersection vide : force séparation des commandes
 * 4. Si intersection OK : même date de livraison pour tous
 *
 * ```typescript
 * // Dans CartService
 * getShippingDayForMultipleHUBs() {
 *   const hubsDate = this.config.shared.hubs.map(hub =>
 *     this.$calendar.fullWeekShippingDays(hub)
 *   );
 *   // Intersection des jours disponibles
 *   return hubsDate[0].filter(date =>
 *     hubsDate[1].some(d2 => d2.equalsDate(date))
 *   );
 * }
 * ```
 *
 * ## 🔒 RÈGLES DE SÉPARATION DES RESPONSABILITÉS
 *
 * ### CalendarService (CE SERVICE) :
 * - ✅ Calculs purs des dates selon business rules
 * - ✅ Validation des jours disponibles
 * - ✅ Logique UTC avec correction timezone
 * - ✅ Synchronisation avec calendar.js backend
 * - ❌ PAS de gestion d'état utilisateur
 * - ❌ PAS de persistance
 * - ❌ PAS d'interface utilisateur
 *
 * ### CartService :
 * - ✅ Gestion de l'état currentShippingDay
 * - ✅ Persistance via save() automatique
 * - ✅ Détection des commandes pending
 * - ✅ Logique de réduction shipping
 * - ❌ PAS de calculs de dates business (délègue à CalendarService)
 *
 * ### Composants :
 * - ✅ Interface utilisateur et interactions
 * - ✅ Validation avant appels CartService
 * - ✅ Affichage des résultats CalendarService
 * - ❌ PAS de logique métier de dates
 * - ❌ PAS de gestion directe de l'état
 */

@Injectable()
export class CalendarService {

  constructor(
    private $http: HttpClient,
    private $config: ConfigService
  ) {}

  // === DÉPENDANCE AU CHARGEMENT CONFIG ===

  /**
   * Vérifier que ConfigService est chargé avant d'utiliser CalendarService
   */
  private ensureConfigLoaded(): boolean {
    try {
      if (!ConfigService.defaultConfig?.shared?.hub) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('CalendarService: erreur lors de la vérification config:', error);
      return false;
    }
  }

  /**
   * Obtenir le hub par défaut depuis ConfigService
   */
  private getDefaultHub(): any {
    if (!this.ensureConfigLoaded()) {
      throw new Error('CalendarService nécessite ConfigService chargé');
    }
    return ConfigService.defaultConfig.shared.hub;
  }

  // === MÉTHODES SYNCHRONISÉES AVEC BACKEND TESTÉ ===

  /**
   * ✅ LOGIQUE EXACTE de calendar.js (testé)
   *
   * Calcule le prochain jour potentiel de livraison selon :
   * - hub.timelimit : heures nécessaires de préparation
   * - hub.timelimitH : heure limite de commande (ex: 16h)
   *
   * @param hub Hub optionnel, utilise le hub par défaut si non fourni
   * @returns Date de livraison potentielle en timezone Hub
   */
  potentialShippingDay(hub?: Hub): Date {
    const targetHub = hub || this.getDefaultHub();

    // ✅ CORRECTION: HUB-CENTRIC comme le backend pour cohérence
    const now = new Date();
    const nowHub = this.toHubTime(now, targetHub); // ✅ Normaliser vers timezone Hub

    const potentialHub = new Date(nowHub.getTime() + 3600000 * targetHub.timelimit);

    // ✅ CORRECT: Compare timezone Hub vs timezone Hub (cohérent)
    if (potentialHub.getHours() >= targetHub.timelimitH) {
      potentialHub.setHours(targetHub.timelimitH, 0, 0, 0);
      potentialHub.setDate(potentialHub.getDate() + 1);
      return potentialHub;
    }

    potentialHub.setHours(16, 0, 0, 0);
    return potentialHub;
  }

  /**
   * @deprecated Use getValidShippingDatesForHub(...)[0] instead - first valid date
   * ✅ DÉLÉGUER vers getValidShippingDatesForHub - fonction principale
   */
  nextShippingDay(hub?: any, user?: any): Date | null {

    const targetHub = hub || this.getDefaultHub();
    const validDates = this.getValidShippingDatesForHub(targetHub, {
      days: targetHub.uncapturedTimeLimit || 6,
      user: user,
      currentRanks: ConfigService.defaultConfig?.shared?.currentRanks,
      config: ConfigService.defaultConfig,
      detailed: false
    });

    return validDates.length > 0 ? validDates[0] : null;
  }

  /**
   * ✅ fonction utilitaire pour avoir la date pour les collaborateurs, vendeurs et la logistique
   */
  currentShippingDay(hub?: Hub): Date {    console.warn('currentShippingDay is deprecated, use getValidShippingDatesForHub with current week instead');

    const targetHub = hub || this.getDefaultHub();
    return this.dayToDates(targetHub.weekdays, undefined, undefined, targetHub)[0];
  }

  /**
   * @deprecated Use getValidShippingDatesForHub with options instead
   * Backward compatibility wrapper for fullWeekShippingDays
   * ✅ SYNC AVEC BACKEND: fullWeekShippingDays est un wrapper deprecated
   *
   * @param hub Hub optionnel, utilise le hub par défaut si non fourni
   * @param limit Limite en jours (défaut: hub.uncapturedTimeLimit || 6)
   * @param user Utilisateur pour limites premium (optionnel)
   * @returns Tableau des dates de livraison disponibles
   */
  fullWeekShippingDays(hub?: any, limit?: number, user?: any): Date[] {

    const targetHub = hub || this.getDefaultHub();

    // ✅ DÉLÉGUER vers getValidShippingDatesForHub comme dans le backend
    return this.getValidShippingDatesForHub(targetHub, {
      days: limit || targetHub.uncapturedTimeLimit || 6,
      user: user,
      currentRanks: ConfigService.defaultConfig?.shared?.currentRanks,
      config: ConfigService.defaultConfig,
      detailed: false
    });
  }

  /**
   * ✅ CALCUL DU TEMPS RESTANT AVANT DEADLINE DE COMMANDE AVEC INTERFACE COMPLÈTE
   *
   * **⚠️ FRONTEND HUB-CENTRIC vs BACKEND UTC-FIRST :**
   * - **Frontend** : Travaille en timezone Hub (Europe/Zurich) pour cohérence utilisateur
   * - **Backend** : Travaille en UTC pur avec conversions Hub seulement pour calculs business
   *
   * --- LOGIQUE MÉTIER CORRECTE ---
   * 1. **`hub.timelimit`** = Heures de préparation nécessaires (ex: 24h)
   * 2. **`hub.timelimitH`** = Heure de collecte quotidienne chez les vendeurs (ex: 16h Swiss)
   * 3. **`product.attributes.timelimit`** = **HEURE LIMITE SPÉCIFIQUE** (remplace hub.timelimitH)
   *
   * --- EXEMPLE CONCRET ---
   * Configuration hub :
   * - `timelimit: 24` (24h de préparation nécessaire)
   * - `timelimitH: 16` (collecte quotidienne à 16h Swiss)
   *
   * **Produit normal (MARDI livraison)** :
   * - Collecte = MARDI 16h00 Swiss
   * - Deadline = MARDI 16h00 - 24h = LUNDI 16h00 Swiss
   *
   * **Produit strict (pain frais avec `product.attributes.timelimit = 12`)** :
   * - Collecte = MARDI 16h00 Swiss
   * - **Limite produit** = LUNDI 16h00 → remplace par 12h00 → **LUNDI 12h00 Swiss**
   * - Le vendeur impose une deadline plus restrictive (12h au lieu de 16h)
   *
   * @param hub Hub optionnel, utilise le hub par défaut si non fourni
   * @param productTimelimit Heure limite spécifique pour ce produit (remplace hub.timelimitH si plus restrictif)
   * @param when Date de livraison spécifique choisie par le client
   * @param options Options { includeInterface?: boolean }
   * @returns Temps restant (number) ou interface ProductOrderTiming si includeInterface=true
   */
  timeleftBeforeCollect(hub?: Hub, productTimelimit?: number, when?: Date, options: { includeInterface?: boolean } = {}): number | ProductOrderTiming {
    const targetHub = hub || this.getDefaultHub();
    const preparationHours = targetHub.timelimit;
    const chosenShippingDate = when || this.potentialShippingDay(targetHub);

    if (!chosenShippingDate) {
      const errorResult = -1;
      if (options.includeInterface) {
        return {
          isOutOfTimeLimit: true,
          shouldShowCountdown: false,
          hoursLeft: errorResult,
          formattedTimeLeft: 'Indisponible',
          formattedDeadline: 'N/A'
        };
      }
      return errorResult;
    }

    // ✅ FRONTEND HUB-CENTRIC : Calculs dans timezone Hub pour cohérence
    const collectDateTime = this.toHubTime(chosenShippingDate, targetHub);
    collectDateTime.setHours(targetHub.timelimitH, 0, 0, 0); // Collecte normale

    // ✅ LOGIQUE CORRECTE : product.attributes.timelimit remplace hub.timelimit (durée de préparation)
    if (productTimelimit && productTimelimit > preparationHours) {
      // ✅ EXEMPLE : Pain frais avec timelimit=24h au lieu de hub.timelimit=12h
      // Hub normal: collecte demain 10h - préparation 12h = deadline aujourd'hui 22h
      // Pain frais: collecte demain 10h - préparation 24h = deadline aujourd'hui 10h (plus restrictif!)

      // ✅ CRITICAL FIX : Utiliser productTimelimit comme durée de préparation
      const deadlineMs = collectDateTime.getTime() - (productTimelimit * 3600000);
      const hoursLeft = (deadlineMs - Date.now()) / 3600000;

      if (options.includeInterface) {
        return this.buildProductOrderTimingInterface(hoursLeft, productTimelimit > 0);
      }
      return hoursLeft;
    }

    // Logique normale : collecte - préparation
    const deadlineMs = collectDateTime.getTime() - (preparationHours * 3600000);
    const cutoffDateTime = new Date(deadlineMs);
    const hoursLeft = (cutoffDateTime.getTime() - Date.now()) / 3600000;

    if (options.includeInterface) {
      return this.buildProductOrderTimingInterface(hoursLeft, productTimelimit > 0);
    }
    return hoursLeft;
  }

  /**
   * Use getValidShippingDatesForHub with potentialShippingDay instead
   * ✅ DÉLÉGUER vers dayToDates - fonction utilitaire
   */
  potentialShippingWeek(hub?: Hub): Date[] {

    const targetHub = hub || this.getDefaultHub();
    const potential = this.potentialShippingDay(targetHub);

    return this.dayToDates(targetHub.weekdays, potential, undefined, targetHub);
  }

  /**
   * Vérifier si un jour spécifique est disponible pour la livraison
   * ✅ OPTION LASTMINUTE : Ajoute validation heure limite
   *
   * @param hub Hub de livraison
   * @param date Date à vérifier
   * @param options { lastMinute?: boolean, now?: Date }
   * @returns true si le jour est disponible
   */
  isShippingDayAvailable(hub: Hub, date: Date, options: { lastMinute?: boolean; now?: Date } = {}): boolean {
    if (!hub || !date || isNaN(date.getTime())) {
      return false;
    }

    const { lastMinute = false, now = new Date() } = options;

    // Vérifier si le jour est dans les weekdays du hub
    // ✅ FRONTEND HUB-CENTRIC: date est déjà en timezone Hub
    if (hub.weekdays?.indexOf(date.getDay()) === -1) {
      return false;
    }

    // Vérifier si la date n'est pas dans les périodes de fermeture
    if (hub.noshipping?.length) {
      for (const noshipping of hub.noshipping) {
        if (date.in && date.in(noshipping.from, noshipping.to)) {
          return false;
        }
      }
    }

    // ✅ VALIDATION LASTMINUTE : Vérifier heure limite
    if (lastMinute) {
      // Hub doit activer
      if (!hub.acceptLastMinuteOrder || hub.acceptLastMinuteOrder <= 0) {
        return false;
      }

      // Heure actuelle < limite
      const nowHub = this.toHubTime(now, hub);
      if (nowHub.getHours() >= hub.acceptLastMinuteOrder) {
        return false;
      }

      // Date doit être aujourd'hui (utilise toYYYYMMDD)
      if (date.toYYYYMMDD && now.toYYYYMMDD) {
        if (date.toYYYYMMDD() !== now.toYYYYMMDD()) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Mapper la semaine de livraison potentielle avec les raisons de fermeture
   *
   * @param hub Hub optionnel, utilise le hub par défaut si non fourni
   * @returns Dates avec messages de fermeture si applicable
   */
  noShippingMessage(hub?: Hub): any[] {
    const targetHub = hub || this.getDefaultHub();
    return this.potentialShippingWeek(targetHub).map(shipping => {
      const find = targetHub.noshipping?.find(noshipping => {
        return shipping.in(noshipping.from, noshipping.to);
      });
      if (find) {
        shipping.message = find.reason;
      }
      return shipping;
    });
  }

  // === CONVERSIONS TIMEZONE (UTC ↔ HUB) ===

  /**
   * Obtenir le timezone du hub (défaut: Europe/Zurich)
   *
   * @param hub Hub optionnel
   * @returns Timezone string (ex: 'Europe/Zurich')
   */
  getHubTimezone(hub?: any): string {
    return hub?.timezone || 'Europe/Zurich';
  }

  /**
   * Convertir UTC vers timezone du hub pour calculs business
   * PRINCIPE: UTC normalisé → Hub timezone pour comparaisons → retour UTC
   *
   * @param utcDate Date en UTC
   * @param hub Hub pour timezone (défaut: Europe/Zurich)
   * @returns Date dans timezone du hub
   */
  toHubTime(utcDate: Date, hub?: any): Date {
    if (!utcDate || isNaN(utcDate.getTime())) {
      console.error('toHubTime: date invalide fournie:', utcDate);
      return new Date(); // Fallback: maintenant
    }

    const timezone = this.getHubTimezone(hub);

    // ✅ SOLUTION ROBUSTE : Utiliser convertToTimezone pour éviter bugs timezone client
    // convertToTimezone retourne ISO avec offset que new Date() parse correctement partout
    try {
      const hubDateWithOffset = this.convertToTimezone(utcDate, timezone);
      return new Date(hubDateWithOffset);
    } catch (error) {
      console.error('toHubTime: erreur conversion timezone:', error.message);
      return new Date(utcDate); // Fallback: UTC inchangé
    }
  }

  /**
   * Convertir timezone hub vers UTC pour stockage
   * PRINCIPE: Reconversion Hub → UTC pour normalisation
   *
   * @param hubDate Date dans timezone du hub
   * @param hub Hub pour timezone (défaut: Europe/Zurich)
   * @returns Date en UTC
   */
  toUTC(hubDate: Date, hub?: any): Date {
    const timezone = this.getHubTimezone(hub);

    // Interpréter hubDate comme étant dans le timezone du hub
    // et la convertir vers UTC
    const offsetMs = hubDate.getTimezoneOffset() * 60000;
    return new Date(hubDate.getTime() - offsetMs);
  }

  // === VALIDATION ET UTILITÉS ===

    /**
   * Validation complète si un jour est disponible (availableDays + currentRanks + limites premium)
   * Prend en compte les contraintes de capacité par jour et les privilèges premium
   *
   * @param day Date UTC à vérifier
   * @param availableDays Liste des dates disponibles (timezone marché)
   * @param options Options { user?: User, hub?: Hub } - utilise config.shared par défaut
   * @returns true si le jour est disponible selon toutes les contraintes
   */
  isDayAvailable(day: Date, availableDays: Date[], options: { user?: User, hub?: Hub } = {}): boolean {
    if (!day ||!availableDays) {
      return false;
    }

    const { user, hub } = options;

    // 1. Vérification de base: le jour doit être dans la liste disponible
    // ✅ AMÉLIORATION: Si availableDays est vide [], on teste seulement currentRanks
    if (availableDays.length > 0) {
      let isInAvailableDays = false;
      for (const date of availableDays) {
        if (date.equalsDate && date.equalsDate(day)) {
          isInAvailableDays = true;
          break;
        }
        if (date.toDateString() === day.toDateString()) {
          isInAvailableDays = true;
          break;
        }
      }

      if (!isInAvailableDays) {
        return false;
      }
    }

    // 2. Vérification currentRanks (contraintes de capacité) - Valeurs par défaut depuis config.shared
    const config = ConfigService.defaultConfig?.shared;
    if (!config) {
      return true; // Si pas de config, accepter
    }

    const currentRanks = config.currentRanks;
    if (currentRanks) {
      const targetHub = hub || this.getDefaultHub();
      const hubRanks = currentRanks[targetHub.slug] || {};

      // Limite de base du hub
      const currentLimit = targetHub.currentLimit || 1000;

      // Limite premium supplémentaire si l'utilisateur est premium - depuis config.shared
      const premiumLimit = (user && user.isPremium && user.isPremium()) ?
        (config.order?.premiumLimit || 0) : 0;

      const maxLimit = currentLimit + premiumLimit;

      // Vérifier si le nombre de commandes pour ce jour dépasse la limite
      // ✅ FRONTEND HUB-CENTRIC: day est déjà en timezone Hub, currentRanks indexé par jour Hub
      const dayRank = hubRanks[day.getDay()] || 0;
      if (dayRank > maxLimit) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validation simplifiée si un jour est dans la liste des jours disponibles (sans currentRanks)
   * Utilisée quand availableDays contient déjà les contraintes filtrées
   *
   * @param day Date UTC à vérifier
   * @param availableDays Liste des dates disponibles (timezone marché)
   * @returns true si le jour est dans la liste disponible
   */
  isInAvailableDays(day: Date, availableDays: Date[]): boolean {
    if (!day) {
      return false;
    }

    // Validation simple: vérifier si le jour est dans la liste disponible
    for (const date of availableDays) {
      if (date.equalsDate && date.equalsDate(day)) {
        return true;
      }
      if (date.toDateString() === day.toDateString()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retourne l'heure par défaut selon jour (16h normalement, 12h samedi)
   * day est en UTC, mais doit être comparé avec config hub Swiss
   *
   * @param day Date UTC
   * @param hub Hub pour configuration timezone
   * @returns Heure par défaut (ex: 16 pour 16h)
   */
  getDefaultTimeByDay(day: Date, hub?: Hub): number {
    const targetHub = hub || this.getDefaultHub();
    if (!targetHub) {
      return 16;
    }

    // ✅ VALIDATION: Vérifier que day est valide
    if (!day || isNaN(day.getTime())) {
      return 16; // Fallback safe
    }

    // day est UTC, mais doit être comparé avec config hub Swiss
    const dayHub = this.toHubTime(day, targetHub);

    // Samedi Swiss = 12h, autres jours = 16h (ou config hub)
    if (!targetHub.shippingtimes) {
      return (dayHub.getDay() === 6) ? 12 : 16;
    }
    return targetHub.shippingtimes[dayHub.getDay()] || 16;
  }

  /**
   * Vérifie si la commande last-minute est disponible (version simplifiée)
   * ✅ SYNCHRONISÉ avec backend calendar.js
   * Délègue à isShippingDayAvailable avec option lastMinute
   *
   * @param hub Hub optionnel
   * @param options { now?: Date }
   * @returns {{ available: boolean, when?: Date, hours?: number }}
   */
  isLastMinuteAvailable(hub?: Hub, options: { now?: Date } = {}): { available: boolean; when?: Date; hours?: number } {
    const targetHub = hub || this.getDefaultHub();
    const now = options.now || new Date();

    // Normaliser date à midi UTC
    const when = new Date(now);
    when.setUTCHours(12, 0, 0, 0);

    // ✅ Déléguer validation à isShippingDayAvailable
    const available = this.isShippingDayAvailable(targetHub, when, { lastMinute: true, now });

    if (!available) {
      return { available: false };
    }

    // Retour simple
    const hours = this.getDefaultTimeByDay(when, targetHub);
    return { available: true, when, hours };
  }

  /**
   * ✅ FONCTION PRINCIPALE: API flexible avec contraintes de capacité et règles business
   * Synchronisée avec calendar.js backend (fonction source)
   *
   * @param hub Hub optionnel
   * @param options Options: { days, user, currentRanks, config, detailed, limitToWeekdays }
   * @returns Dates de livraison selon options et contraintes
   */
  getValidShippingDatesForHub(hub?: any, options: any = {}): Date[] | any[] {
    const targetHub = hub || this.getDefaultHub();

    if (!targetHub || !targetHub.weekdays) {
      return [];
    }

    const {
      days = (targetHub.uncapturedTimeLimit || 6),
      user = null,
      currentRanks = null,
      config = null,
      detailed = false,
      limitToWeekdays = true  // ✅ COMPAT: Par défaut compatible avec ancienne logique
    } = options;

    // ✅ COMPAT: Handle null days like the old function
    const effectiveDays = days;

    const result = [];

    // ✅ LOGIQUE CORRECTE: Utiliser la semaine de livraison depuis potentialShippingDay
    const candidateDates = limitToWeekdays ?
      this.potentialShippingWeek(targetHub) :  // TOUS les weekdays de la semaine de livraison
      this.dayToDates(targetHub.weekdays, new Date(), new Date().plusDays(effectiveDays), targetHub);

    // ✅ LOGIQUE CORRECTE: Pas de dateLimit arbitraire !
    // Les dates de potentialShippingWeek sont déjà dans la fenêtre de livraison valide
    // Seuls les filtres business (currentRanks, noshipping) s'appliquent
    let validCandidates = candidateDates;

    // Apply capacity constraints first (if provided) - EXACTEMENT comme backend
    if (currentRanks && config) {
      const hubRanks = currentRanks[targetHub.slug] || {};
      const premiumLimit = (user && user.isPremium && user.isPremium()) ?
        (config.shared?.order?.premiumLimit || 0) : 0;
      const currentLimit = (targetHub.currentLimit || 1000) + premiumLimit;

      validCandidates = validCandidates.filter(day => {
        // ✅ FRONTEND HUB-CENTRIC: day est déjà en timezone Hub, currentRanks indexé par jour Hub
        const dayRank = hubRanks[day.getDay()] || 0;
        return dayRank < currentLimit;
      });
    }

    // ✅ COMPAT: Gérer noshipping exactement comme backend
    if (!targetHub.noshipping || !targetHub.noshipping.length) {
      // No closed dates - return all valid candidates
      if (detailed) {
        return validCandidates.map(date => ({
          utc: date.toISOString(),
          swiss: this.formatForClient(date, targetHub),
          day: date.getDay(), // ✅ FRONTEND HUB-CENTRIC: getDay() car date en timezone Hub
          available: true,
          reason: null
        }));
      }
      return validCandidates.sort((a, b) => a.getTime() - b.getTime());
    }

    // ✅ COMPAT: there is closed dates - filter comme backend
    validCandidates.forEach(shippingday => {
      const find = targetHub.noshipping.find(noshipping => {
        return shippingday.in && shippingday.in(noshipping.from, noshipping.to);
      });
      if (!find) {
        if (detailed) {
          result.push({
            utc: shippingday.toISOString(),
            swiss: this.formatForClient(shippingday, targetHub),
            day: shippingday.getDay(), // ✅ FRONTEND HUB-CENTRIC: getDay() car date en timezone Hub
            available: true,
            reason: null
          });
        } else {
          result.push(shippingday);
        }
      } else if (detailed) {
        result.push({
          utc: shippingday.toISOString(),
          swiss: this.formatForClient(shippingday, targetHub),
          day: shippingday.getDay(), // ✅ FRONTEND HUB-CENTRIC: getDay() car date en timezone Hub
          available: false,
          reason: find.reason || 'Période de fermeture'
        });
      }
    });

    // ✅ COMPAT: sorting dates comme backend
    if (detailed) {
      return result; // result contient des objets, pas besoin de sort
    } else {
      // result contient des dates, on peut les trier
      const dateResults = result.filter(item => item instanceof Date);
      return dateResults.sort((a, b) => a.getTime() - b.getTime());
    }
  }

  // === FORMATAGE ET AFFICHAGE SWISS ===

  /**
   * ✅ SOLUTION INTERNATIONALE : Convertit un instant UTC vers ISO avec offset timezone
   * Force le frontend à travailler dans le timezone du marché (Europe/Zurich)
   *
   * @param dateInput Date UTC ou string ISO
   * @param timeZone Timezone IANA (défaut: Europe/Zurich)
   * @param withMillis Inclure millisecondes (défaut: true)
   * @returns String ISO avec offset (ex: "2025-09-16T12:00:00.000+02:00")
   */
  convertToTimezone(dateInput: string | number | Date, timeZone = 'Europe/Zurich', withMillis = true): string {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) throw new Error('Invalid dateInput');

    // 1) Obtenir l'horloge locale du fuseau via Intl
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = Object.fromEntries(
      dtf.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value])
    );

    const Y = +parts.year;
    const M = +parts.month;
    const D = +parts.day;
    const H = +parts.hour;
    const m = +parts.minute;
    const s = +parts.second;
    const ms = date.getUTCMilliseconds();

    // 2) Recomposer cet "horaire" comme si c'était de l'UTC => calcule l'offset
    const asUTC = Date.UTC(Y, M - 1, D, H, m, s, ms);
    const offsetMs = asUTC - date.getTime(); // positif à l'est de l'UTC

    const sign = offsetMs >= 0 ? '+' : '-';
    const offAbs = Math.abs(offsetMs);
    const offH = Math.floor(offAbs / 3_600_000);
    const offM = Math.floor((offAbs % 3_600_000) / 60_000);

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const pad3 = (n: number) => String(n).padStart(3, '0');

    const timeCore = `${pad2(H)}:${pad2(m)}:${pad2(s)}${withMillis ? '.' + pad3(ms) : ''}`;
    const offsetStr = `${sign}${pad2(offH)}:${pad2(offM)}`;

    return `${Y}-${pad2(M)}-${pad2(D)}T${timeCore}${offsetStr}`;
  }

  /**
   * ✅ STRATÉGIE HYBRIDE : Dates serveur + convertToTimezone frontend
   * Utilise les dates calculées côté serveur et les convertit pour le timezone du marché
   *
   * @param hub Hub pour timezone
   * @param options Options pour le serveur
   * @returns Dates au format ISO avec offset timezone marché
   */
  getValidShippingDatesFromServer(hub?: any, options: any = {}): string[] {
    // 1. Récupérer dates UTC du serveur (via API /v1/config shippingweek)
    // 2. Convertir chaque date vers timezone marché avec offset
    const targetHub = hub || this.getDefaultHub();
    const timezone = this.getHubTimezone(targetHub);

    // Cette méthode sera appelée avec les dates serveur
    // Pour l'instant, déléguer vers l'ancienne méthode mais avec conversion timezone
    const utcDates = this.getValidShippingDatesForHub(targetHub, options);

    return utcDates.map(utcDate => this.convertToTimezone(utcDate, timezone));
  }

  /**
   * Formate une date UTC pour affichage client dans timezone du hub
   * La date reste UTC, seul l'affichage change
   *
   * @param utcDate Date en UTC
   * @param hub Hub pour timezone (défaut: Europe/Zurich)
   * @returns String formaté en timezone Swiss
   */
  formatForClient(utcDate: Date, hub?: any): string {
    // ✅ PROTECTION : Vérifier que utcDate est une date valide
    if (!utcDate || isNaN(utcDate.getTime())) {
      utcDate = new Date(); // Fallback: maintenant
    }

    const timezone = this.getHubTimezone(hub);

    try {
      return new Intl.DateTimeFormat('fr-CH', {
        timeZone: timezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(utcDate); // utcDate reste UTC, seul le rendu change
    } catch (error) {
      // ✅ FALLBACK : Si Intl.DateTimeFormat échoue
      console.error('formatForClient: erreur formatage:', error.message, 'date:', utcDate, 'timezone:', timezone);

      // Fallback simple avec toLocaleDateString
      try {
        return utcDate.toLocaleDateString('fr-CH', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      } catch (fallbackError) {
        // Ultimate fallback
        return utcDate.toDateString();
      }
    }
  }

  // === TIMING PRODUIT (COUNTDOWN & VALIDATION) ===

  /**
   * Use timeleftBeforeCollect with { includeInterface: true } instead
   * ✅ DÉLÉGUER vers timeleftBeforeCollect - fonction principale
   */
  getProductOrderTiming(product: any, hub?: Hub, options: any = {}): ProductOrderTiming {

    const targetHub = hub || this.getDefaultHub();
    const { when } = options;

    return this.timeleftBeforeCollect(
      targetHub,
      product?.attributes?.timelimit,
      when,
      { includeInterface: true }
    ) as ProductOrderTiming;
  }

  /**
   * ✅ FONCTION UTILITAIRE : Construire l'interface ProductOrderTiming
   * Utilisée par timeleftBeforeCollect (fonction principale)
   */
  private buildProductOrderTimingInterface(hoursLeft: number, hasProductLimit: boolean): ProductOrderTiming {
    const isOutOfTimeLimit = hoursLeft < 0;
    const shouldShowCountdown = hasProductLimit && hoursLeft > 0 && hoursLeft < 10;

    return {
      isOutOfTimeLimit,
      shouldShowCountdown,
      hoursLeft,
      formattedTimeLeft: this.formatHoursAndMinutesLeft(hoursLeft),
      formattedDeadline: this.formatDeadlineTime(hoursLeft)
    };
  }


  /**
   * Formate le temps restant en heures et minutes
   *
   * @param hoursLeft Heures restantes (peut être décimal)
   * @returns String formaté "2 h 30 minutes" ou "45 minutes"
   */
  formatHoursAndMinutesLeft(hoursLeft: number): string {
    const hours = Math.floor(Math.abs(hoursLeft));
    const minutes = Math.floor((Math.abs(hoursLeft) - hours) * 60);

    if (hours > 0) {
      return `${hours} h ${minutes} minutes`;
    }
    return `${minutes} minutes`;
  }

  /**
   * Formate l'heure de deadline (utilisé quand le délai est dépassé)
   * Reconstruit l'heure exacte de la deadline à partir du temps restant négatif
   *
   * @param hoursLeft Heures restantes (négatif si deadline passée)
   * @returns String formaté "14h30"
   */
  formatDeadlineTime(hoursLeft: number): string {
    // Reconstituer l'heure exacte de deadline en ajoutant le temps restant (négatif) au moment actuel
    const now = new Date();
    const deadline = new Date(now.getTime() + hoursLeft * 3600000); // 3,600,000 ms = 1 heure

    const deadlineHours = deadline.getHours();
    const deadlineMinutes = deadline.getMinutes().toString().padStart(2, '0');

    return `${deadlineHours}h${deadlineMinutes}`;
  }


  // === INTERNATIONALISATION (I18N) ===

  /**
   * Retourne le nom court d'un jour selon l'index et la langue
   *
   * @param idx Index du jour (0=dimanche, 6=samedi)
   * @param lang Langue ('fr', 'de', 'en')
   * @returns Nom court du jour (ex: 'lun.', 'mar.')
   */
  getWeekDay(idx: number, lang = 'fr'): string {
    const weekdaysShort = this.i18n_weekdaysShort(lang);
    return weekdaysShort[idx] || '';
  }

  /**
   * Noms complets des jours de la semaine selon la langue
   *
   * @param lang Langue ('fr', 'de', 'en')
   * @returns Array des noms complets ['dimanche', 'lundi', ...]
   */
  i18n_weekdays(lang = 'fr'): string[] {
    const i18n = {
      fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
      en: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      de: ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag']
    };
    return i18n[lang] || i18n.fr;
  }

  /**
   * Noms courts des jours de la semaine selon la langue
   *
   * @param lang Langue ('fr', 'de', 'en')
   * @returns Array des noms courts ['dim.', 'lun.', ...]
   */
  i18n_weekdaysShort(lang = 'fr'): string[] {
    const i18n = {
      fr: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
      en: ['sun.', 'mon.', 'tue.', 'wed.', 'thu.', 'fri.', 'sat.'],
      de: ['so.', 'mo.', 'di.', 'mi.', 'do.', 'fr.', 'sa.']
    };
    return i18n[lang] || i18n.fr;
  }

  /**
   * Noms des mois selon la langue
   *
   * @param lang Langue ('fr', 'de', 'en')
   * @returns Array des noms des mois ['janvier', 'février', ...]
   */
  i18n_months(lang = 'fr'): string[] {
    const i18n = {
      fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
      en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
      de: ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember']
    };
    return i18n[lang] || i18n.fr;
  }

  /**
   * Noms des mois selon la langue (alias de i18n_months pour rétrocompatibilité)
   */
  weekdaysNames(lang = 'fr'): string[] {
    return this.i18n_weekdays(lang);
  }

  /**
   * Noms des mois selon la langue (alias de i18n_months pour rétrocompatibilité)
   */
  monthsNames(lang = 'fr'): string[] {
    return this.i18n_months(lang);
  }



  // === MESSAGES NO-SHIPPING ===

  /**
   * Obtient le message de fermeture pour un jour donné
   * Synchronisé avec la logique config.noShippingMessage()
   *
   * @param hub Hub pour les périodes de fermeture
   * @param currentShippingDay Jour à vérifier
   * @param locale Langue pour le message
   * @returns Message de fermeture ou null
   */
  getNoShippingMessage(hub: any, currentShippingDay: Date, locale = 'fr'): string | null {
    if (!hub?.noshipping?.length || !currentShippingDay) {
      return null;
    }

    // Trouver la période de fermeture qui correspond au jour
    const noshipping = hub.noshipping.find(shipping => {
      if (!shipping.from || !shipping.to) return false;

      // Vérifier si currentShippingDay tombe dans la période [from, to]
      const from = new Date(shipping.from);
      const to = new Date(shipping.to);

      return currentShippingDay >= from && currentShippingDay <= to;
    });

    // Retourner le message dans la langue demandée
    return noshipping?.message?.[locale] || null;
  }

  // === UTILITAIRES PRIVÉS ===

  private formatDates(lst: Date[], limit?: Date): Date[] {
    return lst
      .sort((a, b) => a.getTime() - b.getTime())
      .filter(date => !limit || date < limit);
  }

  private dayToDates(days: number[], offset?: Date, limit?: Date, hub?: any): Date[] {
    // ✅ CORRECTION: HUB-CENTRIC pour cohérence avec hub.weekdays
    const now = offset || new Date();
    const targetHub = hub || this.getDefaultHub();
    const nowHub = this.toHubTime(now, targetHub); // ✅ Normaliser vers timezone Hub

    // ✅ CORRECT: Utiliser jour Hub pour comparer avec hub.weekdays (cohérent)
    const today = nowHub.getDay(); // ✅ Jour Swiss pour comparaison avec hub.weekdays Swiss
    const h24 = 86400000;
    const week = 86400000 * 7;
    const result: Date[] = [];

    days = days?.sort() || [];

    days.forEach(day => {
      const diff = day - today;
      if (diff >= 0) {
        const resultDate = new Date(nowHub.getTime() + diff * h24); // ✅ Utilise nowHub
        result.push(resultDate);
      }
    });

    days.forEach(day => {
      const diff = day - today;
      if (diff < 0) {
        const potential = new Date(nowHub.getTime() + diff * h24 + week); // ✅ Utilise nowHub
        if (!limit || potential < limit) {
          result.push(potential);
        }
      }
    });

    return result;
  }

  /**
   * Returns the first calendar date that matches `dayOfWeek` (0=Sun…6=Sat),
   * starting from `startDate` (inclusive) or from tomorrow when omitted.
   *
   * This is the canonical proxy for "next occurrence of a weekday" used by admin
   * subscription creation. All date arithmetic must go through CalendarService —
   * never compute raw Date offsets in components.
   *
   * ## Hub constraints behaviour
   *
   * ### hub.weekdays
   * By default the returned date must be in `hub.weekdays` (standard e-commerce).
   * Pass `options.acceptAllWeekdays = true` for B2B contract products that can be
   * delivered on any day regardless of the hub's normal delivery schedule.
   *
   * ### hub.noshipping (holidays / closures)
   * `noshipping` periods are **always respected**, even for contract products.
   * If the computed date falls inside a closure window the method advances to the
   * first day AFTER the closure that still matches `dayOfWeek`.
   * Rationale: a contractual delivery on a public holiday is either cancelled or
   * postponed — never silently kept on a closed day.
   *
   * @param dayOfWeek  Target day-of-week (0 = Sunday … 6 = Saturday)
   * @param startDate  Earliest eligible date (defaults to tomorrow in hub timezone)
   * @param hub        Hub context for timezone normalisation and constraint checks
   * @param options    `acceptAllWeekdays`: bypass hub.weekdays filter (contract use)
   * @returns          First eligible date >= startDate whose getDay() === dayOfWeek
   */
  firstDeliveryDate(
    dayOfWeek: number,
    startDate?: Date,
    hub?: any,
    options: { acceptAllWeekdays?: boolean } = {}
  ): Date {
    const targetHub = hub || this.getDefaultHub();
    const { acceptAllWeekdays = false } = options;

    // Normalise reference point to hub timezone so getDay() comparisons are coherent
    const base = this.toHubTime(startDate || new Date(), targetHub);
    if (!startDate) {
      base.setDate(base.getDate() + 1); // default: start from tomorrow
    }
    base.setHours(0, 0, 0, 0);

    // Scan up to 14 days to handle noshipping windows that may span a full week
    for (let i = 0; i < 14; i++) {
      const dayMatches = base.getDay() === dayOfWeek;
      const weekdayAllowed = acceptAllWeekdays ||
        !targetHub?.weekdays ||
        targetHub.weekdays.indexOf(base.getDay()) !== -1;

      // Check noshipping — always enforced regardless of acceptAllWeekdays
      const blocked = this.isInNoshippingPeriod(base, targetHub);

      if (dayMatches && weekdayAllowed && !blocked) {
        return new Date(base);
      }
      base.setDate(base.getDate() + 1);
    }
    // Fallback: return last candidate (should not happen in practice)
    return new Date(base);
  }

  /** Returns true if `date` falls inside any noshipping closure window of the hub. */
  private isInNoshippingPeriod(date: Date, hub?: any): boolean {
    if (!hub?.noshipping?.length) { return false; }
    return hub.noshipping.some((ns: any) => {
      const from = new Date(ns.from);
      const to   = new Date(ns.to);
      from.setUTCHours(1, 0, 0, 0);
      to.setUTCHours(1, 0, 0, 0);
      return date >= from && date < to;
    });
  }
}
