namespace pricing_logger_dotnet.Configuration;

public class LoggerSettings
{
  public const string SectionName = "Logger";
  public string OutputDirectory {get; set;} = "logs";
  public string FileName {get; set;} = "pricing-changes.csv";

  public string FullPath => Path.Combine(OutputDirectory, FileName);
}