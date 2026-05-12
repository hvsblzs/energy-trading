namespace pricing_logger_dotnet.Models;

public record PriceChangeMessage(
  string ResourceType,
  string Unit,
  decimal BuyPrice,
  decimal SellPrice,
  DateTime SentAt
);