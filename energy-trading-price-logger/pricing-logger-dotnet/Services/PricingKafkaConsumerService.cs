using System.Reflection;
using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Options;
using pricing_logger_dotnet.Configuration;
using pricing_logger_dotnet.Models;

namespace pricing_logger_dotnet.Services;

public class PricingKafkaConsumerService : IDisposable
{
  private readonly IConsumer<string, string> _consumer;
  private readonly KafkaSettings _settings;
  private readonly ILogger<PricingKafkaConsumerService> _logger;

  public PricingKafkaConsumerService(
    IOptions<KafkaSettings> settings,
    ILogger<PricingKafkaConsumerService> logger)
  {
    _settings = settings.Value;
    _logger = logger;

    var config = new ConsumerConfig
    {
      BootstrapServers = _settings.BootstrapServers,
      GroupId = _settings.ConsumerGroupId,
      AutoOffsetReset = AutoOffsetReset.Latest
    };

    _consumer = new ConsumerBuilder<string, string>(config).Build();
    _consumer.Subscribe(_settings.Topics.PricingChanges);
  }

  public Task<PriceChangeMessage?> ConsumeNextAsync(CancellationToken cancellationToken)
  {
    try
    {
        var result = _consumer.Consume(cancellationToken);
        if (result == null) return Task.FromResult<PriceChangeMessage?>(null);

        var message = JsonSerializer.Deserialize<PriceChangeMessage>(
            result.Message.Value,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        return Task.FromResult(message);
    }
    catch (OperationCanceledException)
    {
        return Task.FromResult<PriceChangeMessage?>(null);
    }
    catch (Exception ex)
    {
        _logger.LogError("Failed to consume message: {Error}", ex.Message);
        return Task.FromResult<PriceChangeMessage?>(null);
    }
  }

  public void Dispose()
  {
    _consumer?.Close();
    _consumer?.Dispose();
  }
}