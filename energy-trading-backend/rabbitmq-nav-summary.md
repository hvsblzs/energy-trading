# RabbitMQ – NAV Reporting Service összefoglaló

## Mi az a RabbitMQ?

A RabbitMQ egy **message broker** – egy közvetítő szoftver, amely üzeneteket fogad, tárol és továbbít alkalmazások között. Az alapgondolat az, hogy a kommunikáló alkalmazások ne közvetlenül egymással beszéljenek, hanem egy közvetítőn keresztül.

### Miért hasznos ez?

* **Decoupling (szétválasztás):** A küldő és fogadó alkalmazás teljesen független egymástól. Ha a fogadó le van állítva, az üzenetek ott várnak a sorban.
* **Megbízhatóság:** Durable (tartós) queue-k esetén a RabbitMQ újraindítás után is megőrzi az üzeneteket.
* **Skálázhatóság:** Több consumer is olvashat ugyanabból a queue-ból, így a terhelés elosztható.

---

## Alapfogalmak

### Producer

Az alkalmazás, amely üzeneteket  **küld** . A mi esetünkben a fő Energy Trading backend.

### Consumer

Az alkalmazás, amely üzeneteket  **fogad és feldolgoz** . A mi esetünkben a NAV service.

### Queue

Az üzenetek tárolóhelye. A RabbitMQ itt tartja az üzeneteket addig, amíg a consumer ki nem veszi őket. A mi projektünkben két queue van:

* `nav.transactions` – egyedi tranzakciók
* `nav.revenue` – időszakos bevételi összesítők

### Exchange

A producer nem közvetlenül a queue-ba küld, hanem az  **exchange** -be. Az exchange dönti el, melyik queue-ba kerüljön az üzenet, a **routing key** alapján.

**Exchange típusok:**

| Típus           | Működés                                                       |
| ---------------- | ---------------------------------------------------------------- |
| **Direct** | Pontos routing key egyezés alapján irányít (ezt használjuk) |
| Fanout           | Minden kapcsolódó queue-ba elküldi az üzenetet               |
| Topic            | Wildcard mintázat alapján irányít                            |
| Headers          | Üzenet fejlécek alapján irányít                             |

### Routing Key

Egy szöveges "cím", amelyet a producer az üzenethez rendel. Az exchange ezt használja az irányításhoz.

### Binding

Az exchange és a queue közötti összeköttetés, egy routing key-jel párosítva.

### Teljes üzenetfolyam

```
Producer (főapp)
     │
     │  convertAndSend(exchange, routingKey, message)
     ▼
  nav.exchange  (Direct Exchange)
     │
     ├── routingKey: "nav.transactions" ──► Queue: nav.transactions ──► NAV Consumer
     │
     └── routingKey: "nav.revenue"      ──► Queue: nav.revenue      ──► NAV Consumer
```

---

## A projekt felépítése

### Főapp – Producer oldal (`energy-trading-backend`)

#### RabbitMQConfig.java

Definiálja a RabbitMQ infrastruktúrát Spring Beanként:

* Létrehozza a két  **durable queue** -t (`nav.transactions`, `nav.revenue`)
* Létrehozza a  **Direct Exchange** -et (`nav.exchange`)
* Összköti a queue-kat az exchange-dzsel  **Binding** -ok segítségével

#### NavReportingService.java

A két `@Scheduled` job felelős az üzenetek küldéséért:

**`sendRecentTransactions()`**

* Időköz: `nav.schedule.transactions` property alapján (pl. 60 másodpercenként)
* Lekérdezi az elmúlt 1 percben keletkezett tranzakciókat az adatbázisból
* Minden tranzakcióból épít egy `NavTransactionMessage` objektumot
* `ObjectMapper`-rel JSON Stringgé szerializálja
* `RabbitTemplate.convertAndSend()` segítségével elküldi a `nav.transactions` queue-ba

**`sendRevenueSummary()`**

* Időköz: `nav.schedule.revenue` property alapján (pl. 5 percenként)
* Lekérdezi az elmúlt 5 perc tranzakcióit
* Összesíti a teljes kredit forgalmat és nyersanyagonkénti bontást készít
* Egy `NavRevenueMessage` objektumot épít és JSON-ként elküldi a `nav.revenue` queue-ba

#### Konfigurálható property-k (`application.properties`)

```properties
nav.rabbitmq.exchange=nav.exchange
nav.rabbitmq.queue.transactions=nav.transactions
nav.rabbitmq.queue.revenue=nav.revenue
nav.rabbitmq.routing-key.transactions=nav.transactions
nav.rabbitmq.routing-key.revenue=nav.revenue

nav.schedule.transactions=60000    # ms - tranzakció küldés időköze
nav.schedule.revenue=300000        # ms - revenue összesítő időköze
```

---

### NAV app – Consumer oldal (`nav-service`)

#### RabbitMQConfig.java

Deklarálja a queue-kat a NAV app oldalán is. Ez azért szükséges, hogy a NAV app a főapptól függetlenül is el tudjon indulni – ha a queue még nem létezik, ő maga hozza létre. Ha már létezik, a RabbitMQ egyszerűen átugorja.

#### NavMessageListener.java

A `@RabbitListener` annotációval jelölt metódusok folyamatosan figyelik a queue-kat.

* Amint üzenet érkezik, a Spring automatikusan meghívja a megfelelő metódust
* A JSON Stringet `ObjectMapper.readValue()` segítségével deszerializálja a megfelelő DTO-ba
* Formázott loggal kiírja a konzolra

#### ObjectMapper konfiguráció

A `JavaTimeModule` regisztrálása szükséges a `LocalDateTime` mezők helyes kezeléséhez, különben a Jackson nem tudja deszerializálni a dátum/idő értékeket.

---

## DTO-k (üzenet struktúrák)

### NavTransactionMessage

Egyedi tranzakciót reprezentál:

```
transactionId  – tranzakció azonosítója
companyName    – cég neve
resourceType   – nyersanyag neve
quantity       – mennyiség
unit           – mértékegység
creditAmount   – kredit összeg
direction      – BUY vagy SELL
createdAt      – létrehozás időpontja
```

### NavRevenueMessage

Időszakos összesítőt reprezentál:

```
periodFrom        – időszak kezdete
periodTo          – időszak vége
totalCreditVolume – összes kredit forgalom
breakdown[]       – nyersanyagonkénti bontás
  └── resourceType, unit, totalQuantity, totalCredit
```

---

## Technikai megjegyzések

### Jackson 3.x és Spring Boot 4.x kompatibilitás

A Spring Boot 4.x már Jackson 3.x-et használ (`tools.jackson` package), de a Spring AMQP beépített konverterei még a régi Jackson 2.x-et (`com.fasterxml.jackson`) várják. Emiatt a JSON szerializációt manuálisan végezzük `ObjectMapper`-rel, és a RabbitMQ-nak csak String típusú üzenetet adunk át – ez verzióktól független megoldás.

### Durable queue-k

Mindkét queue `durable(true)` beállítással lett létrehozva. Ez azt jelenti, hogy ha a RabbitMQ szerver újraindul, a queue-k és a bennük lévő, még fel nem dolgozott üzenetek megmaradnak.

### Lazy loading és @Transactional

A `@Scheduled` metódusok alapból nem futnak tranzakcióban, ezért a Hibernate lazy-betöltött kapcsolatokhoz (pl. `transaction.getCompany().getName()`) nem tudott hozzáférni session nélkül. A `@Transactional(readOnly = true)` annotáció megoldja ezt – a session nyitva marad a metódus teljes futása alatt.

---

## Lokális fejlesztői környezet

### RabbitMQ indítása Dockerrel

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

| Port  | Cél                                            |
| ----- | ----------------------------------------------- |
| 5672  | AMQP protokoll – itt kommunikál a Java app    |
| 15672 | Management UI – böngészőből monitorozható |

### Management UI

Elérhető: [http://localhost:15672](http://localhost:15672/)

Belépés: `guest` / `guest`

Itt látható valós időben:

* A queue-k aktuális állapota (hány üzenet vár feldolgozásra)
* Az exchange-ek és binding-ok
* Az üzenetátviteli statisztikák

### Indítási sorrend

1. Docker RabbitMQ container
2. NAV app (létrehozza a queue-kat ha még nem léteznek)
3. Főapp (elkezdi küldeni az üzeneteket)

> A sorrend nem kritikus – mindkét app képes létrehozni a queue-kat, és a RabbitMQ megőrzi az üzeneteket amíg a consumer el nem indul.
>
