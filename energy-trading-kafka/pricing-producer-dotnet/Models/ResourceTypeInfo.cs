namespace pricing_producer_dotnet.Models;

// Record: Olyan, mint egy immutable DTO
public record ResourceTypeInfo (
  long Id,
  string Name,
  string Unit,
  string Color,
  bool Active,
  decimal CurrentBuyPrice,
  decimal CurrentSellPrice
);