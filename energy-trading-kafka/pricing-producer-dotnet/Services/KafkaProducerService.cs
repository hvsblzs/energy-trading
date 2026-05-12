using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Options;
using pricing_producer_dotnet.Configuration;
using pricing_producer_dotnet.Models;

namespace pricing_producer_dotnet.Services;

// IDisposable: Jelzi, hogy erőforrásokat használ, amiket fel kell majd szabadítani.
public class KafkaProducerService : IDisposable
{
  private readonly IProducer<string, string> _producer;
  private readonly KafkaSettings _settings;
  private readonly ILogger<KafkaProducerService> _logger;

  // IOptions<KafkaSettings>: Ezzel kérjük le a konfigot
  public KafkaProducerService(IOptions<KafkaSettings> settings, ILogger<KafkaProducerService> logger)
  {
    _settings = settings.Value;
    _logger = logger;

    var config = new ProducerConfig
    {
      BootstrapServers = _settings.BootstrapServers
    };

    _producer = new ProducerBuilder<string, string>(config).Build();
  }

  // REQUEST küldése a főappnak
  public async Task SendResourceTypeRequestAsync()
  {
    var message = new Message<string, string>
    {
      Key = "pricing-producer.dotnet",
      Value = "REQUEST"
    };

    await _producer.ProduceAsync(_settings.Topics.ResourceTypesRequest, message);
    _logger.LogInformation("Sent resource type request to Kafka");
  }

  public async Task SendPriceChangeAsync(PriceChangeMessage priceChange)
  {
    var json = JsonSerializer.Serialize(priceChange);

    var message = new Message<string, string>
    {
      Key = priceChange.ResourceType,
      Value = json
    };

    await _producer.ProduceAsync(_settings.Topics.PricingChanges, message);
    _logger.LogInformation(
      "Sent price change: {ResourceType} buy={BuyPrice} sell={SellPrice}",
      priceChange.ResourceType,
      priceChange.BuyPrice,
      priceChange.SellPrice
    );
  }

  // Dispose: Felszabadítja a Kafka producer kapcsolatot
  public void Dispose()
  {
    _producer?.Dispose();
  }
}