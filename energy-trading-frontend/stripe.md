# Stripe Tranzakció Folyamat – Energy Trading Platform

## Áttekintés

A rendszer Stripe-ot használ a kredit feltöltéshez. A felhasználó HUF-ban fizet, és a befizetett összeg alapján krediteket kap (**1 HUF = 10 kredit**, minimum 500 HUF).

---

## Szereplők

| Szereplő | Leírás |
|----------|--------|
| **Frontend (Angular)** | A felhasználó itt adja meg a kártyaadatokat a Stripe Card Element-en keresztül |
| **Backend (Spring Boot)** | PaymentIntent-et hoz létre, webhook-ot fogad |
| **Stripe** | A fizetést feldolgozza, webhook eseményt küld |
| **Adatbázis** | Tárolja a Payment rekordokat és a kredit egyenleget |

---

## Lépések részletesen

### 1. Felhasználó megnyitja a TopUp modalt

A felhasználó a navbar kredit gombjára vagy a profil oldalon a feltöltés gombra kattint. Megnyílik a `TopUpModalComponent`.

Az `ngOnInit`-ben a modal betölti a **Stripe.js**-t a publishable key-jel:

```typescript
this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
this.elements = this.stripe.elements();
this.cardElement = this.elements.create('card', { ... });
this.cardElement.mount('#card-element');
```

A kártyaadatok **soha nem jutnak el a backendhez** – azokat kizárólag a Stripe kezeli.

---

### 2. Felhasználó megadja az összeget és rákattint a Küldés gombra

```
Frontend → Backend: POST /api/payments/create-payment-intent
Body: { amount: 1000 }  // HUF-ban
```

---

### 3. Backend létrehozza a PaymentIntent-et

A `PaymentController` fogadja a kérést és a `PaymentService`-en keresztül:

1. Létrehozza a Stripe **PaymentIntent**-et a megadott összeggel (fillérben, tehát `amount * 100`)
2. Létrehoz egy **Payment** rekordot az adatbázisban `PENDING` státusszal
3. Visszaküldi a `clientSecret`-et a frontendnek

```
Backend → Frontend: { clientSecret: "pi_xxx_secret_xxx" }
Backend → DB: INSERT Payment (stripePaymentId, amount, status=PENDING, userId/companyId)
Backend → Stripe: PaymentIntent létrehozás
```

---

### 4. Frontend megerősíti a fizetést

A frontend a `clientSecret` segítségével megerősíti a fizetést közvetlenül a Stripe-nak:

```typescript
const result = await this.stripe.confirmCardPayment(
  intentResponse.clientSecret,
  { payment_method: { card: this.cardElement } }
);
```

```
Frontend → Stripe: confirmCardPayment (kártyaadatok + clientSecret)
```

---

### 5. Stripe feldolgozza a fizetést

A Stripe elvégzi a fizetési műveletet. Két lehetséges kimenetel:

#### ❌ Sikertelen fizetés
```
Stripe → Frontend: { error: { message: "..." } }
Frontend: modal bezárása + hibaüzenet toast
```

#### ✅ Sikeres fizetés
```
Stripe → Frontend: { paymentIntent: { status: "succeeded" } }
Frontend: success toast + modal bezárása
```

---

### 6. Stripe Webhook – a kredit jóváírás kulcslépése

Sikeres fizetés után a Stripe **webhook**-ot küld a backendnek:

```
Stripe → Backend: POST /api/payments/webhook
Header: Stripe-Signature: t=xxx,v1=xxx
Body: { type: "payment_intent.succeeded", data: { object: { id: "pi_xxx", ... } } }
```

A backend:
1. **Ellenőrzi a webhook signature-t** a `stripe.webhook.secret` segítségével – ez garantálja hogy valóban Stripe küldte
2. Megkeresi az adatbázisban a Payment rekordot a `stripePaymentId` alapján
3. Frissíti a státuszt `PENDING` → `SUCCESS`
4. **Jóváírja a krediteket** – `amount * 10` kreditet ad hozzá a felhasználó/cég egyenlegéhez
5. **WebSocket értesítést** küld a frontendnek az új kredit egyenleggel

```
Backend → DB: UPDATE Payment SET status=SUCCESS
Backend → DB: UPDATE Company/User SET creditBalance += amount * 10
Backend → Frontend (WebSocket): { creditBalance: 12500 }
```

---

### 7. Frontend frissíti a kredit egyenleget

A navbar WebSocket subscription fogadja az üzenetet és valós időben frissíti a megjelenített kredit egyenleget:

```typescript
this.webSocketService.subscribe(`/topic/credits/${companyId}`, (message) => {
  this.userService.updateCreditBalance(parseFloat(message.creditBalance));
});
```

---

## Teljes folyamat diagram

```
Felhasználó
    │
    │ 1. Megnyitja a modalt
    ▼
Frontend (Angular)
    │
    │ 2. POST /api/payments/create-payment-intent
    ▼
Backend (Spring Boot)
    │
    │ 3. PaymentIntent létrehozás + PENDING rekord
    ▼
Stripe API ←──────────────────────────────────────────┐
    │                                                  │
    │ clientSecret visszaküldve                        │
    ▼                                                  │
Frontend                                               │
    │                                                  │
    │ 4. confirmCardPayment (kártyaadatok)             │
    └──────────────────────────────────────────────────┘
                    │
                    │ 5. Fizetés feldolgozása
                    ▼
                  Stripe
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
       Sikeres            Sikertelen
          │                   │
          │ webhook            │ error response
          ▼                   ▼
      Backend             Frontend
          │               (modal bezárul,
          │6. Signature     hibaüzenet)
          │   ellenőrzés
          │   DB frissítés
          │   Kredit jóváírás
          ▼
      WebSocket
          │
          │ 7. Kredit értesítés
          ▼
      Frontend
    (navbar frissül)
```

---

## Fontos biztonsági szempontok

| Szempont | Megvalósítás |
|----------|-------------|
| **Kártyaadatok** | Soha nem érik el a backendet – Stripe Card Element kezeli |
| **Webhook hitelesítés** | Stripe-Signature header ellenőrzése `whsec_...` kulccsal |
| **API kulcsok** | `application.properties`-ben tárolva, `.gitignore`-olva |
| **Összeg validáció** | Backend oldalon ellenőrzött, minimum 500 HUF |
| **Duplikált jóváírás** | Stripe garantálja hogy egy `payment_intent.succeeded` esemény csak egyszer érkezik |

---

## Konfigurációs kulcsok

```properties
stripe.secret.key=sk_test_...        # Backend API hívásokhoz
stripe.webhook.secret=whsec_...      # Webhook signature ellenőrzéshez
stripe.public.key=pk_test_...        # Frontend Stripe.js inicializáláshoz
```

> ⚠️ **Fontos:** A kulcsokat rendszeresen meg kell újítani (jelenlegi beállítás: 7 napos lejárat). Lejárt kulcsok esetén a fizetés sikertelen lesz.

---

## Fejlesztői környezet – ngrok

Mivel a Stripe webhook-nak publikusan elérhető URL kell, fejlesztés közben **ngrok**-ot használunk:

```bash
ngrok http 8080
```

A generált URL-t (`https://xxx.ngrok-free.dev`) be kell állítani a Stripe dashboardon webhook endpoint-ként:

```
https://xxx.ngrok-free.dev/api/payments/webhook
```

> ⚠️ **Fontos:** Az ngrok ingyenes verzióján az URL minden indításkor változik – ilyenkor a Stripe dashboardon frissíteni kell!