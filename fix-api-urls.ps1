# Fix API URL patterns in frontend files
$files = Get-ChildItem -Path "frontend\app" -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $updated = $content -replace [regex]::Escape("process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'"), "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'"
    
    if ($content -ne $updated) {
        Set-Content -Path $file.FullName -Value $updated -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nDone! Updated all API URL patterns."
