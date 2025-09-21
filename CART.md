# CartService - Spécification Technique

Service Angular centralisé pour la gestion du panier, des commandes et des abonnements dans l'écosystème Karibou.

## 🏗️ Architecture

- **Type** : Service Angular Injectable
- **Scope** : Singleton (providedIn: 'root')
- **État** : Réactif via RxJS (ReplaySubject)
- **Persistance** : LocalStorage + API Server sync

## 📊 Modèles de Données

### CartItem
```typescript
class CartItem {
  sku: number;           // ID produit
  title: string;         // Nom produit
  hub: string;           // Hub de livraison
  variant: string;       // Variante produit
  quantity: number;      // Quantité
  price: number;         // Prix unitaire
  finalprice: number;    // Prix total (price * quantity)
  frequency?: string;    // Fréquence abonnement ("week", "month")
  active: boolean;       // Item actif dans abonnement
  timelimit?: number;    // Limite temps spécifique produit
  note?: string;         // Note client
  audio?: string;        // Note audio
  vendor: {              // Informations vendeur
    urlpath: string;
    name: string;
    weekdays: number[];
    discount: { threshold: number; amount: number; }
  };
  category: { slug: string; name: string; };
}
```

### CartSubscription
```typescript
interface CartSubscription {
  id: string;
  plan: string;          // "customer" | "business"
  frequency: string;     // "week" | "month" | "2weeks"
  dayOfWeek: number;     // 0-6 (dimanche-samedi)
  status: string;        // "active" | "paused" | "cancelled"
  nextInvoice: Date;     // Prochaine facturation
  shipping: ShippingAddress;
  items: CartSubscriptionProductItem[];
}
```

## 🛒 API Publique

### **Gestion des Items**

#### `add(product: Product | CartItem, variant?: string, quiet?: boolean)`
**Use Case** : Ajouter un produit au panier
- Vérifie stock limit et doublons
- Incrémente quantité si item existant
- Calcule discount vendeur automatiquement
- **Événement** : `ITEM_ADD` | `ITEM_MAX`

#### `remove(product: CartItem, variant?: string)`
**Use Case** : Retirer une unité d'un produit
- Décrémente quantité ou supprime si qty=1
- Recalcule discounts vendeur
- **Événement** : `ITEM_REMOVE`

#### `removeAll(product: CartItem, variant?: string)`
**Use Case** : Supprimer complètement un produit
- Supprime toutes les quantités
- **Événement** : `ITEM_REMOVE`

#### `addAll(products: Product[] | CartItem[])`
**Use Case** : Ajouter plusieurs produits en batch
- Optimisé pour ajout en masse
- **Événement** : `ITEM_ALL`

#### `clearAfterOrder(hub: string, order?: Order, contract?: CartSubscription)`
**Use Case** : Nettoyer panier après commande
- Préserve items subscription actifs
- Sauvegarde pending order
- **Événement** : `CART_CLEARED`

### **Gestion des Dates de Livraison** ✅ **MIGRÉ CalendarService**

#### `getCurrentShippingDay(): Date`
**Use Case** : Obtenir date de livraison actuelle
- Retourne cache ou calcule via `CalendarService.nextShippingDay()`
- **Utilisé par** : Tous les composants pour affichage

#### `setShippingDay(newDate: Date, hours: number)`
**Use Case** : Définir nouvelle date/heure de livraison
- Sauvegarde en cache + localStorage
- **Événement** : `CART_SHIPPING`

#### `getShippingDayForMultipleHUBs(): Date[]`
**Use Case** : Support multi-hubs (intersection dates)
- Calcule dates communes entre hubs via `CalendarService.getValidShippingDatesForHub()`
- **Utilisé par** : Interface multi-marchés

### **Gestion des Adresses**

#### `setShippingAddress(address: UserAddress | DepositAddress)`
**Use Case** : Définir adresse de livraison
- Valide deposits du hub
- Vérifie addresses utilisateur
- **Événement** : `CART_ADDRESS`

#### `getCurrentShippingAddress(): UserAddress`
**Use Case** : Obtenir adresse actuelle

### **Gestion des Paiements**

#### `setPaymentMethod(payment: UserCard)`
**Use Case** : Définir méthode de paiement
- Met à jour gateway fees automatiquement
- **Événement** : `CART_PAYMENT`

#### `getCurrentPaymentMethod(): UserCard`
**Use Case** : Obtenir méthode de paiement actuelle

### **Calculs Financiers**

#### `subTotal(ctx: CartItemsContext): number`
**Use Case** : Sous-total items + service fees
- Inclut fees hub et gateway
- Exclut shipping et discounts

#### `total(ctx: CartItemsContext): number`
**Use Case** : Total final commande
- subTotal + shipping - discounts
- Arrondi au 0.05 près

#### `computeShippingFees(ctx: CartItemsContext): number`
**Use Case** : Calcul frais de livraison
- Gère deposits, plans utilisateur, discounts
- Support multiple orders même jour

#### `hasShippingReduction(ctx: CartItemsContext)`
**Use Case** : Vérifier réductions shipping disponibles
- Retourne `{multiple, discountA, discountB, deposit}`

### **Gestion des Abonnements**

#### `subscriptionsGet(): Observable<CartSubscription[]>`
**Use Case** : Récupérer abonnements utilisateur
- Cache résultats dans `subscription$`

#### `subscriptionCreate(params: CartSubscriptionData): Observable<CartSubscription>`
**Use Case** : Créer nouvel abonnement
- Validation côté serveur
- **Événement** : Mise à jour `subscription$`

#### `subscriptionPause(subscription: CartSubscription, to: Date)`
**Use Case** : Suspendre abonnement temporairement

#### `subscriptionResume(subscription: CartSubscription)`
**Use Case** : Reprendre abonnement suspendu

#### `subscriptionCancel(subscription: CartSubscription)`
**Use Case** : Annuler abonnement définitivement

### **Validation et État**

#### `hasError(hub: string): boolean`
**Use Case** : Vérifier erreurs dans panier
- Vérifie items avec `item.error`

#### `hasPendingOrder(): Order`
**Use Case** : Vérifier commande en cours
- Retourne order authorized/prepaid

#### `isCurrentShippingDayAvailable(shop: Shop): boolean`
**Use Case** : Vérifier disponibilité vendeur
- Teste `shop.available.weekdays` vs date actuelle

### **Persistance et Synchronisation**

#### `load(shared?: string)`
**Use Case** : Charger panier (localStorage + serveur)
- Support panier partagé via UUID
- **Événement** : `CART_LOADED` | `CART_LOAD_ERROR`

#### `save(state: CartState)`
**Use Case** : Sauvegarder panier (localStorage + serveur)
- Sync automatique avec fallback local
- **Événement** : Selon action

#### `setContext(config: Config, user: User, shops?: Shop[], orders?: Order[])`
**Use Case** : Initialiser contexte panier
- Configure hub, utilisateur, pending orders
- Définit dates par défaut via `CalendarService`

## 🔄 Événements RxJS

### `cart$: ReplaySubject<CartState>`
**Stream principal** pour changements panier :
- `CART_INIT` : Initialisation
- `CART_LOADED` : Chargement terminé
- `ITEM_ADD` : Ajout produit
- `ITEM_REMOVE` : Suppression produit
- `CART_SHIPPING` : Changement date/heure
- `CART_ADDRESS` : Changement adresse
- `CART_PAYMENT` : Changement paiement

### `subscription$: ReplaySubject<CartSubscription[]>`
**Stream abonnements** pour changements contrats

## 🎯 Use Cases Principaux

### **UC1 : Ajout Produit Simple**
```typescript
// 1. Utilisateur clique "Ajouter au panier"
this.$cart.add(product, variant);
// → Vérifie stock, ajoute/incrémente, calcule discount
// → Événement ITEM_ADD émis
```

### **UC2 : Sélection Date Livraison**
```typescript
// 1. Utilisateur choisit nouvelle date dans calendrier
this.$cart.setShippingDay(newDate, hours);
// → Sauvegarde cache + localStorage
// → Événement CART_SHIPPING émis
```

### **UC3 : Calcul Total Commande**
```typescript
// 1. Interface affiche total temps réel
const total = this.$cart.total({hub: 'geneva-market'});
// → subTotal + shipping - discounts
// → Inclut fees gateway et service
```

### **UC4 : Validation Avant Checkout**
```typescript
// 1. Vérifier erreurs et disponibilité
const hasErrors = this.$cart.hasError(hub);
const hasShipping = this.$cart.hasShippingReduction(ctx);
// → Interface adapte boutons et messages
```

### **UC5 : Création Abonnement**
```typescript
// 1. Utilisateur configure abonnement hebdomadaire
this.$cart.subscriptionCreate({
  dayOfWeek: 2,        // Mardi
  frequency: 'week',
  items: cartItems,
  shipping: address,
  payment: 'pm_123'
});
// → Création côté serveur + cache local
```

### **UC6 : Multi-Hub Support**
```typescript
// 1. Interface multi-marchés
const commonDays = this.$cart.getShippingDayForMultipleHUBs();
// → Intersection dates disponibles entre hubs
// → Utilise CalendarService pour cohérence
```

## 🔧 Intégration CalendarService ✅

### **Fonctions Migrées**
- `getCurrentShippingDay()` → `CalendarService.nextShippingDay()`
- `getShippingDayForMultipleHUBs()` → `CalendarService.getValidShippingDatesForHub()`
- `loadCache()` → `CalendarService.nextShippingDay()` + `potentialShippingWeek()`
- `setContext()` → `CalendarService.getDefaultTimeByDay()` + `potentialShippingWeek()`

### **Avantages Migration**
- ✅ **Timezone Hub-Centric** : Dates cohérentes pour clients internationaux
- ✅ **Single Source of Truth** : Même logique que backend testé
- ✅ **Bug Fixes** : Calculs timezone Swiss corrects
- ✅ **Évolutivité** : Support futur multi-hub automatique

## 📋 Dépendances

### **Services Injectés**
- `HttpClient` : Communication API
- `CalendarService` : Logique dates/livraisons ✅

### **Services Utilisés**
- `ConfigService` : Configuration globale
- `AnalyticsService` : Métriques et tracking

### **Interfaces**
- `CartItemsContext` : Contexte filtrage items
- `CartSubscriptionData` : Données création abonnement
- `CartState` : État changements panier

## 🚀 Performance

### **Optimisations**
- **Debounced Loading** : 300ms pour éviter appels multiples
- **Vendor Discount Cache** : Calcul optimisé par vendeur
- **LocalStorage Fallback** : Fonctionnement offline
- **ReplaySubject(1)** : Dernier état toujours disponible

### **Patterns Réactifs**
- **Observable Streams** : `cart$` et `subscription$`
- **Error Handling** : Fallback gracieux localStorage
- **State Management** : Immutable state updates

---

*Documentation générée pour kng2-core v6.0.0 avec migration CalendarService*
