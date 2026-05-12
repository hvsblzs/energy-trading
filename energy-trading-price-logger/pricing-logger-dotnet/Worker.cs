using pricing_logger_dotnet.Services;

namespace pricing_logger_dotnet;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly PricingKafkaConsumerService _consumerService;
    private readonly CsvWriterService _csvWriterService;

    public Worker(
        ILogger<Worker> logger,
        PricingKafkaConsumerService consumerService,
        CsvWriterService csvWriterService)
    {
        _logger = logger;
        _consumerService = consumerService;
        _csvWriterService = csvWriterService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Pricing Logger started, waiting for price changes...");

        while (!stoppingToken.IsCancellationRequested)
        {
            var message = await _consumerService.ConsumeNextAsync(stoppingToken);

            if (message != null)
            {
                await _csvWriterService.WriteAsync(message);
            }
        }
    }
}