# Script: test-onet-careers-complete.ps1
$username = "psychometric_assessm"
$password = "2964bsx"
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($username + ":" + $password))
$headers = @{
    "Authorization" = "Basic $base64Auth"
    "Accept" = "application/json"
}

# Function to test an endpoint
function Test-OnetEndpoint {
    param (
        [string]$Url,
        [string]$Label
    )
    Write-Output "Testing $Label..."
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -Headers $headers -TimeoutSec 30
        Write-Output "Response ($Label):"
        Write-Output ($response | ConvertTo-Json -Depth 6)
    } catch {
        Write-Output "Error ($Label): $($_.Exception.Message)"
        if ($_.Exception.Response) {
            Write-Output "Status Code: $($_.Exception.Response.StatusCode)"
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Output "Response Body: $($reader.ReadToEnd())"
        }
    }
    Write-Output ""
}

# Test endpoints
Test-OnetEndpoint -Url "https://services.onetcenter.org/ws/online/careers?interest=investigative,artistic" -Label "online/careers - interest"
Test-OnetEndpoint -Url "https://services.onetcenter.org/ws/online/careers?riasec=IA" -Label "online/careers - riasec"
Test-OnetEndpoint -Url "https://services.onetcenter.org/ws/online/occupations?interest=investigative,artistic" -Label "online/occupations - interest"
Test-OnetEndpoint -Url "https://services.onetcenter.org/ws/mnm/careers/15-1252.00/personality" -Label "career personality - Software Developer (15-1252.00)"