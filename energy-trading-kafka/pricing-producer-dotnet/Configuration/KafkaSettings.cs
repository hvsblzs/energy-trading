namespace pricing_producer_dotnet.Configuration;

// Egy osztályban az összes Kafkával kapcsolatos property.
public class KafkaSettings
{
  public const string SectionName = "Kafka";

  public string BootstrapServers {get; set;} = string.Empty;
  public KafkaTopics Topics {get; set;} = new();
  public string ConsumerGroupId {get; set;} = string.Empty;
}

public class KafkaTopics
{
  public string ResourceTypes {get; set;} = string.Empty;
  public string ResourceTypesRequest{get; set;} = string.Empty;
  public string PricingChanges {get; set;} = string.Empty;
}