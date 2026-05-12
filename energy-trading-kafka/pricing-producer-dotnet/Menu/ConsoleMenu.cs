using pricing_producer_dotnet.Models;
using pricing_producer_dotnet.Services;

namespace pricing_producer_dotnet.Menu;

public class ConsoleMenu
{
  private readonly KafkaProducerService _producerService;
  private readonly ResourcetypeConsumerService _consumerService;
  private readonly ILogger _logger;
  private readonly Random _random = new();

  public ConsoleMenu(
    KafkaProducerService producerService,
    ResourcetypeConsumerService consumerService,
    ILogger logger)
  {
    _producerService = producerService;
    _consumerService = consumerService;
    _logger = logger;
  }

  public async Task RunAsync(CancellationToken cancellationToken)
  {
    PrintBanner();

    while (!cancellationToken.IsCancellationRequested)
    {
      PrintMainMenu();
      var input = Console.ReadLine()?.Trim();

      switch (input)
      {
        case "1":
          await ShowManualModeAsync(cancellationToken);
          break;
        case "2":
          await ShowAutoModeAsync(cancellationToken);
          break;
        case "0":
          Console.WriteLine("\n👋 Goodbye!");
          Environment.Exit(0);
          break;
        default:
          Console.WriteLine("❌ Invalid option, please try again.");
          break;
      }
    }
  }

  // MANUÁLIS MÓD

  private async Task ShowManualModeAsync(CancellationToken cancellationToken)
  {
    while (true)
    {
      var resourceTypes = _consumerService.GetResourceTypes();
      PrintResourceTypeMenu(resourceTypes, "MANUAL MODE - Select resource type");
      Console.Write("Select (0 to go back): ");
      var input = Console.ReadLine()?.Trim();

      if (input == "0") return;

      if (!int.TryParse(input, out int index) || index < 1 || index > resourceTypes.Count)
      {
        Console.WriteLine("❌ Invalid selection.");
        continue;
      }

      var selected = resourceTypes[index - 1];

      Console.WriteLine($"   Current buy    : {selected.CurrentBuyPrice:F2}");
      Console.WriteLine($"   Current sell   : {selected.CurrentSellPrice:F2}");

      var buyPrice = AskForPrice($"Enter BUY price for {selected.Name} ({selected.Unit})");
      if (buyPrice == null) continue;

      var sellPrice = AskForPrice($"Enter SELL price for {selected.Name} ({selected.Unit})");
      if (sellPrice == null) continue;

      Console.WriteLine("\n📋 Confirm price change:");
      Console.WriteLine($"   Resource  : {selected.Name}"); 
      Console.WriteLine($"   New buy price : {buyPrice}");
      Console.WriteLine($"   New sell price: {sellPrice}");
      Console.Write("Send? (y/n): ");
      var confirm = Console.ReadLine()?.Trim();

      if (confirm?.ToLower() == "y")
      {
        var message = new PriceChangeMessage(
          selected.Name,
          selected.Unit,
          buyPrice.Value,
          sellPrice.Value,
          DateTime.UtcNow
        );
        await _producerService.SendPriceChangeAsync(message);
        Console.WriteLine("✅ Price change sent successfully!");
      }
      else
      {
        Console.WriteLine("❌ Cancelled.");
      }
    }
  }

  // AUTOMATIKUS MÓD

  private async Task ShowAutoModeAsync(CancellationToken cancellationToken)
  {
    var resourceTypes = _consumerService.GetResourceTypes();
    PrintResourceTypeMenu(resourceTypes, "AUTO MODE - Select resource type");
    Console.Write("Select (0 to go back): ");
    var input = Console.ReadLine()?.Trim();

    if (input == "0") return;

    if (!int.TryParse(input, out int index) || index < 1 || index > resourceTypes.Count)
    {
      Console.WriteLine("❌ Invalid selection.");
      return;
    }

    var selected = resourceTypes[index - 1];

    Console.Write("Enter interval in seconds (e.g. 5): ");
    if (!int.TryParse(Console.ReadLine()?.Trim(), out int intervalSeconds) || intervalSeconds <= 0)
    {
      Console.WriteLine("❌ Please enter a valid positive number.");
      return;
    }

    var currentBuyPrice = selected.CurrentBuyPrice;
    var currentSellPrice = selected.CurrentSellPrice;

    Console.WriteLine($"   Starting buy   : {currentBuyPrice:F2}");
    Console.WriteLine($"   Starting sell  : {currentSellPrice:F2}");

    Console.WriteLine($"\n🤖 Auto mode started for {selected.Name}");
    Console.WriteLine($"   Interval : {intervalSeconds}s");
    Console.WriteLine("   Press ENTER to stop.\n");

    using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

    var autoTask = Task.Run(async () =>
    {
      while (!cts.Token.IsCancellationRequested)
      {
        currentBuyPrice = ApplyPriceChange(currentBuyPrice);
        currentSellPrice = ApplyPriceChange(currentSellPrice);

        var message = new PriceChangeMessage(
          selected.Name,
          selected.Unit,
          currentBuyPrice,
          currentSellPrice,
          DateTime.UtcNow
        );

        await _producerService.SendPriceChangeAsync(message);
        Console.WriteLine($"   Sent: buy={currentBuyPrice:F2} sell={currentSellPrice:F2}");

        await Task.Delay(intervalSeconds * 1000, cts.Token);
      }
    }, cts.Token);

    // Főszál várja az ENTER-t
    await Task.Run(() => Console.ReadLine(), CancellationToken.None);
    await cts.CancelAsync();

    try {await autoTask;}
    catch (OperationCanceledException) {}

    Console.WriteLine("Auto mode stopped.");
  }

  // ÁRVÁLTOZÁS

  private decimal ApplyPriceChange(decimal currentPrice)
  {
    var rand = _random.NextDouble();

    double changePercent = rand switch
    {
      < 0.50 => 0.01 + _random.NextDouble() * 0.04,  // 50% esély: 1-5%
      < 0.75 => 0.05 + _random.NextDouble() * 0.05,  // 25% esély: 5-10%
      < 0.90 => 0.10 + _random.NextDouble() * 0.10,  // 15% esély: 10-20%
      < 0.97 => 0.20 + _random.NextDouble() * 0.20,  //  7% esély: 20-40%
      _      => 0.40 + _random.NextDouble() * 0.20   //  3% esély: 40-60%
    };

    var increase = _random.NextDouble() > 0.5;
    var multiplier = increase ? (1 + changePercent) : (1 - changePercent);
    var newPrice = currentPrice * (decimal)multiplier;
    newPrice = Math.Round(newPrice, 1);

    return newPrice < 1 ? 1 : newPrice;
  }

  // SEGÉDMETÓDUSOK

  private decimal? AskForPrice(string prompt)
  {
      Console.Write($"{prompt}: ");
      if (decimal.TryParse(Console.ReadLine()?.Trim(), out decimal value) && value > 0)
          return value;

      Console.WriteLine("❌ Invalid price. Must be a positive number.");
      return null;
  }

  private void PrintResourceTypeMenu(List<ResourceTypeInfo> resourceTypes, string title)
  {
      Console.WriteLine("\n+======================================+");
      Console.WriteLine($"|  {title,-36}|");
      Console.WriteLine("+======================================+");
      for (int i = 0; i < resourceTypes.Count; i++)
      {
          var rt = resourceTypes[i];
          var status = rt.Active ? "[+]" : "[-]";
          Console.WriteLine($"|  {i + 1}. {status} {rt.Name} ({rt.Unit})".PadRight(39) + "|");
      }
      Console.WriteLine("+======================================+");
      Console.WriteLine("|  0. Back                             |");
      Console.WriteLine("+======================================+");
  }

  private void PrintMainMenu()
  {
      Console.WriteLine("\n+======================================+");
      Console.WriteLine("|       ENERGY TRADING - PRICING       |");
      Console.WriteLine("+======================================+");
      Console.WriteLine("|  1. [M] Manual price change          |");
      Console.WriteLine("|  2. [A] Auto price change            |");
      Console.WriteLine("|  0. [X] Exit                         |");
      Console.WriteLine("+======================================+");
      Console.Write("Select: ");
  }

  private void PrintBanner()
  {
      Console.WriteLine("\n+======================================+");
      Console.WriteLine("|    ENERGY TRADING PRICE PRODUCER     |");
      Console.WriteLine("|       .NET Kafka Integration         |");
      Console.WriteLine("+======================================+");
  }
}