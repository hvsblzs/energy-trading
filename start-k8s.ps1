Write-Host "Starting Minikube..." -ForegroundColor Cyan
minikube start

Write-Host "Waiting for pods to be ready..." -ForegroundColor Cyan
kubectl wait --for=condition=ready pod --all -n energy-trading --timeout=120s

Write-Host "Starting port-forward on http://localhost:8081" -ForegroundColor Green
kubectl port-forward -n energy-trading service/frontend 8081:80