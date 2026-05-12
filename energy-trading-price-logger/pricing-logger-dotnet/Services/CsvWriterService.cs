using System.Reflection;
using Microsoft.Extensions.Options;
using pricing_logger_dotnet.Configuration;
using pricing_logger_dotnet.Models;

namespace pricing_logger_dotnet.Services;

public class CsvWriterService
{
  private readonly LoggerSettings _settings;
  private readonly ILogger<CsvWriterService> _logger;

  //SemaphoreSlim: Szálbiztos írás miatt
  private readonly SemaphoreSlim _writeLock = new(1, 1);

  public CsvWriterService(
    IOptions<LoggerSettings> settings,
    ILogger<CsvWriterService> logger)
  {
    _settings = settings.Value;
    _logger = logger;

    EnsureFileEXists();
  }

  private void EnsureFileEXists()
  {
    Directory.CreateDirectory(_settings.OutputDirectory);

    if (!File.Exists(_settings.FullPath))
    {
      File.WriteAllText(_settings.FullPath,
        "Timestamp,ResourceType,Unit,BuyPrice,SellPrice,SentAt\n");
      _logger.LogInformation("Created CSV file: {Path}", _settings.FullPath);
    }
  }

  public async Task WriteAsync(PriceChangeMessage message)
  {
    await _writeLock.WaitAsync();
    try
    {
      var line = string.Format("{0},{1},{2},{3},{4},{5}\n",
          DateTime.Now.ToString("yyy-MM-dd HH:mm:ss"),
          message.ResourceType,
          message.Unit,
          message.BuyPrice.ToString("F2"),
          message.SellPrice.ToString("F2"),
          message.SentAt.ToString("yyyy-MM-dd HH:mm:ss")
      );

      await File.AppendAllTextAsync(_settings.FullPath, line);

      _logger.LogInformation(
        "Logged price change: {ResourceType} buy={BuyPrice} sell={SellPrice}",
        message.ResourceType,
        message.BuyPrice,
        message.SellPrice);
    }
    catch (Exception ex)
    {
      _logger.LogError("Failed to write to CSV: {Error}", ex.Message);
    }
    finally
    {
      _writeLock.Release();
    }
  }
}