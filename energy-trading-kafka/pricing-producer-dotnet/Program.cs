using pricing_producer_dotnet;
using pricing_producer_dotnet.Configuration;
using pricing_producer_dotnet.Services;

var builder = Host.CreateApplicationBuilder(args);

// KafkaSettings beolvasása az appsettings.json-ból
builder.Services.Configure<KafkaSettings>(
  builder.Configuration.GetSection(KafkaSettings.SectionName)
);

// Service-ek regisztrálása
builder.Services.AddSingleton<KafkaProducerService>();
builder.Services.AddSingleton<ResourcetypeConsumerService>();

builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
