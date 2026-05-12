using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using pricing_logger_dotnet.Configuration;
using pricing_logger_dotnet.Models;
using pricing_logger_dotnet.Services;

namespace pricing_logger_dotnet.Tests;

public class CsvWriterServiceTests : IDisposable
{
    private readonly string _testDirectory;
    private readonly string _testFilePath;
    private readonly Mock<ILogger<CsvWriterService>> _loggerMock;
    private readonly LoggerSettings _settings;
    private readonly IOptions<LoggerSettings> _options;

    public CsvWriterServiceTests()
    {
        // Minden teszthez egyedi temp mappa
        _testDirectory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        _testFilePath = Path.Combine(_testDirectory, "test-pricing.csv");

        _loggerMock = new Mock<ILogger<CsvWriterService>>();

        _settings = new LoggerSettings
        {
            OutputDirectory = _testDirectory,
            FileName = "test-pricing.csv"
        };

        _options = Options.Create(_settings);
    }

    // Teszt után töröljük a temp mappát
    public void Dispose()
    {
        if (Directory.Exists(_testDirectory))
            Directory.Delete(_testDirectory, recursive: true);
    }

    // ── EnsureFileExists tesztek ──────────────────────────

    [Fact]
    public void Constructor_ShouldCreateOutputDirectory()
    {
        // Act
        var service = new CsvWriterService(_options, _loggerMock.Object);

        // Assert
        Assert.True(Directory.Exists(_testDirectory));
    }

    [Fact]
    public void Constructor_ShouldCreateCsvFileWithHeader()
    {
        // Act
        var service = new CsvWriterService(_options, _loggerMock.Object);

        // Assert
        Assert.True(File.Exists(_testFilePath));
        var content = File.ReadAllText(_testFilePath);
        Assert.Contains("Timestamp,ResourceType,Unit,BuyPrice,SellPrice,SentAt", content);
    }

    [Fact]
    public void Constructor_ShouldNotOverwriteExistingFile()
    {
        // Arrange - fájl már létezik saját tartalommal
        Directory.CreateDirectory(_testDirectory);
        File.WriteAllText(_testFilePath, "existing content\n");

        // Act
        var service = new CsvWriterService(_options, _loggerMock.Object);

        // Assert - tartalom nem változott
        var content = File.ReadAllText(_testFilePath);
        Assert.Equal("existing content\n", content);
    }

    // ── WriteAsync tesztek ────────────────────────────────

    [Fact]
    public async Task WriteAsync_ShouldAppendLineToFile()
    {
        // Arrange
        var service = new CsvWriterService(_options, _loggerMock.Object);
        var message = new PriceChangeMessage(
            ResourceType: "GAS",
            Unit: "m3",
            BuyPrice: 100.00m,
            SellPrice: 90.00m,
            SentAt: new DateTime(2026, 1, 1, 10, 0, 0)
        );

        // Act
        await service.WriteAsync(message);

        // Assert
        var lines = File.ReadAllLines(_testFilePath);
        // lines[0] = fejléc, lines[1] = az új sor
        Assert.Equal(2, lines.Length);
        Assert.Contains("GAS", lines[1]);
        Assert.Contains("m3", lines[1]);
        Assert.Contains("100.00", lines[1]);
        Assert.Contains("90.00", lines[1]);
    }

    [Fact]
    public async Task WriteAsync_ShouldFormatPricesWithTwoDecimals()
    {
        // Arrange
        var service = new CsvWriterService(_options, _loggerMock.Object);
        var message = new PriceChangeMessage(
            ResourceType: "GAS",
            Unit: "m3",
            BuyPrice: 100.5m,
            SellPrice: 90.1m,
            SentAt: DateTime.Now
        );

        // Act
        await service.WriteAsync(message);

        // Assert
        var content = File.ReadAllText(_testFilePath);
        Assert.Contains("100.50", content);
        Assert.Contains("90.10", content);
    }

    [Fact]
    public async Task WriteAsync_ShouldAppendMultipleLines()
    {
        // Arrange
        var service = new CsvWriterService(_options, _loggerMock.Object);
        var message1 = new PriceChangeMessage("GAS", "m3", 100m, 90m, DateTime.Now);
        var message2 = new PriceChangeMessage("ELECTRICITY", "kWh", 50m, 45m, DateTime.Now);

        // Act
        await service.WriteAsync(message1);
        await service.WriteAsync(message2);

        // Assert
        var lines = File.ReadAllLines(_testFilePath);
        // fejléc + 2 sor
        Assert.Equal(3, lines.Length);
        Assert.Contains("GAS", lines[1]);
        Assert.Contains("ELECTRICITY", lines[2]);
    }

    [Fact]
    public async Task WriteAsync_ShouldFormatSentAtDate()
    {
        // Arrange
        var service = new CsvWriterService(_options, _loggerMock.Object);
        var sentAt = new DateTime(2026, 4, 22, 10, 30, 0);
        var message = new PriceChangeMessage("GAS", "m3", 100m, 90m, sentAt);

        // Act
        await service.WriteAsync(message);

        // Assert
        var content = File.ReadAllText(_testFilePath);
        Assert.Contains("2026-04-22 10:30:00", content);
    }

    [Fact]
    public async Task WriteAsync_ShouldBeThreadSafe()
    {
        // Arrange
        var service = new CsvWriterService(_options, _loggerMock.Object);
        var tasks = Enumerable.Range(0, 10).Select(i =>
            service.WriteAsync(new PriceChangeMessage(
                ResourceType: $"RESOURCE_{i}",
                Unit: "unit",
                BuyPrice: i * 10m,
                SellPrice: i * 9m,
                SentAt: DateTime.Now
            ))
        );

        // Act - 10 párhuzamos írás
        await Task.WhenAll(tasks);

        // Assert - fejléc + 10 sor
        var lines = File.ReadAllLines(_testFilePath);
        Assert.Equal(11, lines.Length);
    }
}