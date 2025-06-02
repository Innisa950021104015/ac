# Script: test-onet-careers-online.ps1
$username = "psychometric_assessm"
$password = "2964bsx"
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($username + ":" + $password))
$headers = @{
    "Authorization" = "Basic $base64Auth"
    "Accept" = "application/json"
}

# Test /online/careers with interest=investigative,artistic
Write-Output "Testing /online/careers with interest=investigative,artistic..."
try {
    $response = Invoke-RestMethod -Uri "https://services.onetcenter.org/ws/online/careers?interest=investigative,artistic" -Method Get -Headers $headers
    Write-Output "Response (online/careers - interest):"
    Write-Output ($response | ConvertTo-Json -Depth 4)
} catch {
    Write-Output "Error (online/careers - interest): $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Output "Status Code: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Output "Response Body: $($reader.ReadToEnd())"
    }
}

# Test /online/careers with riasec=IA
Write-Output "`nTesting /online/careers with riasec=IA..."
try {
    $response = Invoke-RestMethod -Uri "https://services.onetcenter.org/ws/online/careers?riasec=IA" -Method Get -Headers $headers
    Write-Output "Response (online/careers - riasec):"
    Write-Output ($response | ConvertTo-Json -Depth 4)
} catch {
    Write-Output "Error (online/careers - riasec): $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Output "Status Code: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Output "Response Body: $($reader.ReadToEnd())"
    }
}

# Test career details for Software Developer (15-1252.00)
Write-Output "`nTesting career details for Software Developer (15-1252.00)..."
try {
    $response = Invoke-RestMethod -Uri "https://services.onetcenter.org/ws/mnm/careers/15-1252.00/" -Method Get -Headers $headers
    Write-Output "Response (career details):"
    Write-Output ($response | ConvertTo-Json -Depth 4)
} catch {
    Write-Output "Error (career details): $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Output "Status Code: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Output "Response Body: $($reader.ReadToEnd())"
    }
}