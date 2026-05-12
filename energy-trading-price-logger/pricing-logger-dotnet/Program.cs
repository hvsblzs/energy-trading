using pricing_logger_dotnet;
using pricing_logger_dotnet.Configuration;
using pricing_logger_dotnet.Services;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<KafkaSettings>(
  builder.Configuration.GetSection(KafkaSettings.SectionName)
);
builder.Services.Configure<LoggerSettings>(
  builder.Configuration.GetSection(LoggerSettings.SectionName)
);

builder.Services.AddSingleton<CsvWriterService>();
builder.Services.AddHostedService<Worker>();
builder.Services.AddSingleton<PricingKafkaConsumerService>();

var host = builder.Build();
host.Run();