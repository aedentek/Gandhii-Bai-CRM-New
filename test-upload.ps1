Add-Type -AssemblyName System.Net.Http

$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent

# Add the form fields
$patientIdContent = New-Object System.Net.Http.StringContent "P0001"
$content.Add($patientIdContent, "patientId")

$fieldNameContent = New-Object System.Net.Http.StringContent "photo" 
$content.Add($fieldNameContent, "fieldName")

# Add the file
$filePath = "test-file.txt"
$fileContent = [System.IO.File]::ReadAllBytes($filePath)
$fileStream = New-Object System.IO.MemoryStream($fileContent)
$fileContent = New-Object System.Net.Http.StreamContent($fileStream)
$fileContent.Headers.ContentDisposition = New-Object System.Net.Http.Headers.ContentDispositionHeaderValue("form-data")
$fileContent.Headers.ContentDisposition.Name = "file"
$fileContent.Headers.ContentDisposition.FileName = "test-file.txt"
$content.Add($fileContent, "file", "test-file.txt")

# Send the request
Write-Host "Sending upload request..."
$response = $client.PostAsync("http://localhost:4000/api/upload-patient-file", $content).Result
$responseContent = $response.Content.ReadAsStringAsync().Result

Write-Host "Response Status: $($response.StatusCode)"
Write-Host "Response Content: $responseContent"

$client.Dispose()
