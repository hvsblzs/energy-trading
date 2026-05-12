# 1. FÁZIS: BUILD
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /app

COPY *.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish

# 2. FÁZIS: RUN
FROM mcr.microsoft.com/dotnet/runtime:8.0

WORKDIR /app

# Logs mappa létrehozása megfelelő jogosultságokkal
RUN mkdir -p /app/logs && chmod 777 /app/logs

COPY --from=builder /app/publish .

ENTRYPOINT ["dotnet", "pricing-logger-dotnet.dll"]