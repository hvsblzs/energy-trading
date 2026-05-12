namespace pricing_logger_dotnet.Configuration;

public class KafkaSettings
{
  public const string SectionName = "Kafka";
  public string BootstrapServers {get; set;} = string.Empty;
  public string ConsumerGroupId {get; set;} = string.Empty;
  public KafkaTopics Topics {get; set;} = new();
}

public class KafkaTopics
{
  public string PricingChanges {get; set;} = string.Empty;
}