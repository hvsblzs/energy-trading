# Kafka – Árváltozás Integráció összefoglaló

## Mi az a Kafka és miben különbözik a RabbitMQ-tól?

A Kafka is egy  **message broker** , de egészen más filozófiával működik mint a RabbitMQ.

**RabbitMQ** olyan mint egy posta: a levelet kézbesítik, és ha a címzett átvette, a levél eltűnik.

**Kafka** olyan mint egy **napló (log)** – az üzenetek nem tűnnek el amikor egy consumer elolvassa őket. Megmaradnak egy megadott ideig (alapból 7 nap), és bármennyi consumer olvashatja ugyanazt az üzenetet egymástól teljesen függetlenül.

---

## Alapfogalmak

**Topic** – Az üzenetek kategóriája. A producerek ide küldenek, a consumerek innen olvasnak.

**Partition** – Minden topic fel van osztva partíciókra. Ez a párhuzamos feldolgozást teszi lehetővé.

**Broker** – Maga a Kafka szerver, ami az üzeneteket tárolja és kezeli.

**Offset** – Minden üzenetnek van egy sorszáma (offset) a partíción belül. A consumer megjegyzi hol tartott, és újraindítás után onnan folytatja.

**Producer** – Üzeneteket küld a topicra.

**Consumer** – Feliratkozik egy topicra és olvassa az üzeneteket.

**Consumer Group** – Ha több consumer **ugyanabba** a consumer group-ba tartozik, az üzeneteket **elosztják** egymás között. Ha **különböző** group-ba tartoznak,  **mindenki megkapja az összes üzenetet** . Ez a kulcskülönbség a RabbitMQ-tól – ott egy üzenetet csak egy consumer kaphat meg.

---

## A projekt architektúrája

```
Főapp (Spring Boot)
  │
  ├──► resource-types topic ──► .NET pricing-producer (megtanulja a nyersanyagokat)
  │
  └──◄── resource-types-request topic ◄── .NET pricing-producer (listát kér induláskor)

.NET pricing-producer
  │
  └──► pricing-changes topic ──► Főapp (DB update)
                             └──► .NET pricing-logger (CSV fájlba ír)
```

### Három topic és szerepük

| Topic                      | Irány                              | Tartalom                                |
| -------------------------- | ----------------------------------- | --------------------------------------- |
| `resource-types`         | Főapp → pricing-producer          | Nyersanyag lista (INIT/CREATED/DELETED) |
| `resource-types-request` | pricing-producer → Főapp          | Egyszerű REQUEST string                |
| `pricing-changes`        | pricing-producer → Főapp + logger | Árváltozás üzenetek                 |

### Consumer group-ok

| App              | Group                             | Topic                      |
| ---------------- | --------------------------------- | -------------------------- |
| pricing-producer | `pricing-producer-dotnet-group` | `resource-types`         |
| Főapp           | `main-app-request-group`        | `resource-types-request` |
| Főapp           | `main-app-group`                | `pricing-changes`        |
| pricing-logger   | `pricing-logger-group`          | `pricing-changes`        |

A főapp és a pricing-logger **különböző** group-ban figyelik a `pricing-changes` topicot – ezért mindkettő megkapja az összes árváltozást.

---

## A három alkalmazás részletesen

### 1. Főapp – Spring Boot (Producer + Consumer)

#### Producer oldal – `ResourceTypeKafkaProducer`

Elküldi a nyersanyag listát a `resource-types` topicra három esetben:

* Induláskor (`ApplicationStartupListener` – `INIT` action, teljes lista)
* Új nyersanyag létrehozásakor (`CREATED` action)
* Nyersanyag törlésekor (`DELETED` action)

Minden üzenet tartalmazza az aktuális `buyPrice` és `sellPrice` értékeket is, hogy a pricing-producer tudja miből induljon az automatikus árváltoztatásnál.

#### Consumer oldal – `ResourceTypeRequestListener`

Figyeli a `resource-types-request` topicot. Ha a pricing-producer REQUEST üzenetet küld, a főapp válaszol egy friss INIT üzenettel. Ez oldja meg az offset problémát – a pricing-producer mindig friss adatot kap újraindításkor.

#### Consumer oldal – `PricingKafkaListener`

Figyeli a `pricing-changes` topicot és feldolgozza az árváltozásokat:

1. Validálja hogy az árak pozitívak
2. Megkeresi az adatbázisban a resource type-ot
3. Lekéri a `system@internal` usert
4. Új `Pricing` sort ment az adatbázisba – ugyanúgy mint a manuális árbeállítás

#### System user

A `pricing` táblában a `set_by_user_id` kötelező mező. Mivel a Kafka üzenetnek nincs bejelentkezett usere, a V4-es Flyway migrációval létrehoztunk egy `system@internal` usert:

* `is_active = false` – nem tud bejelentkezni
* `password_hash = 'N/A'` – nem érvényes hash
* `role = 'ADMIN'` – kötelező mező miatt kell

#### JSON kompatibilitás

A .NET alapból `PascalCase`-ben szerializál (`ResourceType`), a Java `camelCase`-t vár (`resourceType`). Az `ObjectMapper` bean-be felvett `ACCEPT_CASE_INSENSITIVE_PROPERTIES` konfiguráció oldja meg ezt a különbséget.

---

### 2. pricing-producer – .NET Worker Service (Consumer + Producer)

#### Indulás folyamata

1. A `ResourceTypeConsumerService` feliratkozik a `resource-types` topicra
2. A `ManualResetEventSlim` megvárja amíg a Kafka **ténylegesen** hozzárendelte a partíciókat a consumerhez (`SetPartitionsAssignedHandler` callback)
3. Csak ezután küldi el a `KafkaProducerService` a REQUEST üzenetet
4. Megvárja az INIT üzenetet (max 15 másodperc)
5. Megjeleníti a konzolos menüt

#### Miért `ManualResetEventSlim` és nem fix delay?

A fix `Task.Delay(2000)` nem garantált – lassabb gépen vagy terhelt rendszeren a consumer nem biztos hogy feliratkozott 2 másodpercen belül. A `SetPartitionsAssignedHandler` callback pontosan azt a pillanatot jelzi amikor a Kafka broker hozzárendelte a partíciókat, tehát a consumer garantáltan készen áll.

#### Konzolos menü – Manuális mód

* Nyersanyag kiválasztása listából
* Aktuális árak megjelenítése tájékoztató célból
* Buy és sell price bekérése
* Megerősítés után elküldés a `pricing-changes` topicra

#### Konzolos menü – Automatikus mód

* Nyersanyag kiválasztása listából
* Az aktuális árak automatikusan betöltődnek (nem kell manuálisan megadni)
* Intervallum megadása másodpercekben
* Háttérszálon fut, ENTER leállítja
* Súlyozott véletlenszerű árváltozás generálás

#### Súlyozott árváltozás függvény

```
50% esély:  1-5%  változás
25% esély:  5-10% változás
15% esély: 10-20% változás
 7% esély: 20-40% változás
 3% esély: 40-60% változás
```

A kisebb változásoknak nagyobb az esélye – ez realisztikusabb piaci viselkedést szimulál.

#### Szálbiztonság

A `ResourceTypeConsumerService`-ben `ConcurrentBag<ResourceTypeInfo>` tárolja a nyersanyag listát. A Kafka listener háttérszálon írja, a konzolos menü főszálon olvassa – a `ConcurrentBag` biztosítja hogy nem ütköznek egymással.

---

### 3. pricing-logger – .NET Worker Service (Consumer)

#### Működés

Folyamatosan figyeli a `pricing-changes` topicot és minden beérkező árváltozást CSV fájlba ír.

#### CSV formátum

```
Timestamp,ResourceType,Unit,BuyPrice,SellPrice,SentAt
2026-04-20 14:52:33,GAS,m3,10000.0000,9500.0000,2026-04-20 14:52:32
2026-04-20 14:52:38,ELECTRICITY,kWh,203.0000,204.0000,2026-04-20 14:52:37
```

#### Fájl helye

Konfigurálható az `appsettings.json`-ban:

```json
"Logger": {
  "OutputDirectory": "logs",
  "FileName": "pricing-changes.csv"
}
```

#### Szálbiztonság

A `CsvWriterService`-ben `SemaphoreSlim` biztosítja hogy egyszerre csak egy szál írhat a fájlba. Ez megakadályozza a CSV struktúra megsérülését ha több üzenet érkezik egyszerre.

#### `AutoOffsetReset.Latest`

A logger `Latest` offset reset-et használ – csak az app indítása után érkező üzeneteket olvassa. Ez szándékos: nem akarjuk visszajátszani a régi árakat a CSV-be minden újraindításkor.

---

## Üzenet struktúrák

### ResourceTypeMessage (főapp → pricing-producer)

```json
{
  "action": "INIT",
  "resourceTypes": [
    {
      "id": 1,
      "name": "GAS",
      "unit": "m3",
      "color": "#10b981",
      "active": true,
      "currentBuyPrice": 750.00,
      "currentSellPrice": 700.00
    }
  ]
}
```

### PriceChangeMessage (pricing-producer → főapp + logger)

```json
{
  "ResourceType": "GAS",
  "Unit": "m3",
  "BuyPrice": 820.50,
  "SellPrice": 775.00,
  "SentAt": "2026-04-20T14:52:32"
}
```

---

## Lokális fejlesztői környezet

### Kafka indítása Dockerrel

```yaml
services:
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
```

### Topic-ok létrehozása

```bash
docker exec -it kafka kafka-topics --create --topic resource-types --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
docker exec -it kafka kafka-topics --create --topic resource-types-request --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
docker exec -it kafka kafka-topics --create --topic pricing-changes --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### Ellenőrzés

```bash
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Indítási sorrend

1. Docker Kafka container
2. Főapp (Spring Boot) – létrehozza a Kafka producer/consumer kapcsolatokat, elküldi az INIT üzenetet
3. pricing-producer (.NET) – elkéri a nyersanyag listát, megjelenik a menü
4. pricing-logger (.NET) – elkezdi figyelni az árváltozásokat

---

## Technikai megjegyzések

### KRaft mód

A projekt KRaft módban futtatja a Kafkát – nincs szükség külön ZooKeeper service-re. A Kafka broker egyszerre tölti be a broker és a controller szerepét, ami egyszerűbb lokális fejlesztéshez.

### Jackson 3.x kompatibilitás

A Spring Boot 4.x Jackson 3.x-et használ (`tools.jackson` package), de a Kafka integrációban a `com.fasterxml.jackson` 2.x-et kell explicit dependency-ként megadni. Ezért van a `pom.xml`-ben külön `jackson-databind` és `jackson-datatype-jsr310` dependency.

### .NET vs Java JSON szerializáció

A .NET alapból `PascalCase`-ben szerializálja a property neveket, a Java Jackson `camelCase`-t vár. Az `ACCEPT_CASE_INSENSITIVE_PROPERTIES` ObjectMapper konfiguráció mindkét formátumot elfogadja, így a két platform zökkenőmentesen tud kommunikálni.

### Offset kezelés

A `pricing-producer` `AutoOffsetReset.Latest`-et használ a `resource-types` topicon, de ez önmagában nem elég – ha már olvasott korábban, a commitolt offset alapján folytatja. Ezért van a request/response mechanizmus: minden induláskor friss INIT üzenetet kér, ami garantáltan új offset pozíción van.
