
using pricing_producer_dotnet.Menu;
using pricing_producer_dotnet.Services;

namespace pricing_producer_dotnet;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly KafkaProducerService _producerService;
    private readonly ResourcetypeConsumerService _consumerService;

    public Worker(
        ILogger<Worker> logger,
        KafkaProducerService producerService,
        ResourcetypeConsumerService consumerService)
    {
        _logger = logger;
        _producerService = producerService;
        _consumerService = consumerService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 1. Indítjuk a consumer szálat
        var consumerTask = Task.Run(() =>
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _consumerService.ProcessNextMessage(stoppingToken);
            }
        }, stoppingToken);

        // 2. Megvárja, amíg a consumer feliratkozik
        Console.WriteLine("Waiting for Kafka consumer to be ready...");
        var subscribed = await Task.Run(
            () => _consumerService.WaitUntilSubscribed(TimeSpan.FromSeconds(30)),
            stoppingToken
        );

        if (!subscribed)
        {
            Console.WriteLine("❌ Kafka consumer failed to subscribe. Is Kafka running?");
            Environment.Exit(1);
        }

        // 3. Request üzenet küldés
        await _producerService.SendResourceTypeRequestAsync();

        // 4. Megvárja az INIT üzenetet
        await WaitForResourceTypeAsync(stoppingToken);

        // 5. Konzolos menü
        var menu = new ConsoleMenu(_producerService, _consumerService, _logger);
        await menu.RunAsync(stoppingToken);

        await consumerTask;
    }

    private async Task WaitForResourceTypeAsync(CancellationToken stoppingToken)
    {
        Console.WriteLine("\n⏳ Waiting for resource types from Kafka...");

        int attempts = 0;
        while (!_consumerService.IsInitialized && attempts < 30)
        {
            await Task.Delay(500, stoppingToken);
            attempts++;
            if (attempts % 4 == 0)
            {
                Console.WriteLine($"   Still waiting... ({attempts / 2}s)");
            }
        }

        if (!_consumerService.IsInitialized)
        {
            Console.WriteLine("❌ Could not load resource types. Is the main app running?");
            Environment.Exit(1);
        }

        Console.WriteLine("✅ Resource types loaded successfully!\n");
    }
}