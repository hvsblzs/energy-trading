namespace pricing_producer_dotnet.Models;

public record ResourceTypeMessage (
  string Action,
  List<ResourceTypeInfo> ResourceTypes
);