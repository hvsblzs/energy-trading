
using System.Collections.Concurrent;
using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.Options;
using pricing_producer_dotnet.Configuration;
using pricing_producer_dotnet.Models;
namespace pricing_producer_dotnet.Services;

public class ResourcetypeConsumerService : IDisposable
{
  private readonly IConsumer<string, string> _consumer;
  private readonly KafkaSettings _settings;
  private readonly ILogger<ResourcetypeConsumerService> _logger;

  // ConcurrentBag: Szálbiztos lista
  private readonly ConcurrentBag<ResourceTypeInfo> _resourceTypes = new();

  private readonly ManualResetEventSlim _subscribed = new(false);

  public ResourcetypeConsumerService(
    IOptions<KafkaSettings> settings,
    ILogger<ResourcetypeConsumerService> logger)
  {
    _settings = settings.Value;
    _logger = logger;

    var config = new ConsumerConfig
    {
      BootstrapServers = _settings.BootstrapServers,
      GroupId = _settings.ConsumerGroupId,
      AutoOffsetReset = AutoOffsetReset.Latest
    };

    _consumer = new ConsumerBuilder<string, string>(config)
      .SetPartitionsAssignedHandler((c, partitions) =>
      {
        _logger.LogInformation("Partitions assigned, consumer ready");
        _subscribed.Set();
      })
      .Build();
    _consumer.Subscribe(_settings.Topics.ResourceTypes);
  }

  public bool WaitUntilSubscribed(TimeSpan timeout) => _subscribed.Wait(timeout);

  public List<ResourceTypeInfo> GetResourceTypes() => _resourceTypes.ToList();

  public bool IsInitialized => !_resourceTypes.IsEmpty;

  public void ProcessNextMessage(CancellationToken cancellationToken)
  {
    try
    {
      var result = _consumer.Consume(cancellationToken);
      if (result == null) return;

      var message = JsonSerializer.Deserialize<ResourceTypeMessage>(
        result.Message.Value,
        new JsonSerializerOptions {PropertyNameCaseInsensitive = true}
      );

      if(message == null) return;

      switch (message.Action)
      {
        case "INIT":
          while(_resourceTypes.TryTake(out _)) {}
          foreach(var rt in message.ResourceTypes)
            _resourceTypes.Add(rt);
          _logger.LogInformation(
            "Resource types initialized: {Count} items",
            _resourceTypes.Count
          );
          break;

        case "CREATED":
          foreach(var rt in message.ResourceTypes)
            _resourceTypes.Add(rt);
          _logger.LogInformation(
            "Resource type added: {Name}",
            message.ResourceTypes.First().Name
          );
          break;

        case "DELETED":
          var deletedId = message.ResourceTypes.First().Id;
          var toRemove = _resourceTypes.FirstOrDefault(rt => rt.Id == deletedId);
          if(toRemove != null)
          {
            while(_resourceTypes.TryTake(out var item))
            {
              if(item.Id != deletedId)
                _resourceTypes.Add(item);
            }
          }
          _logger.LogInformation(
            "Resource type removed: {Name}",
            message.ResourceTypes.First().Name
          );
          break;
      }
    } catch (OperationCanceledException)
    {
      
    } catch (Exception ex)
    {
      _logger.LogError("Error processing resource type message: {Error}", ex.Message);
    }
  }

  public void Dispose()
  {
    _consumer?.Close();
    _consumer?.Dispose();
  }
}