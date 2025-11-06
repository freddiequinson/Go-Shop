# Fix API URL patterns in frontend components
$files = Get-ChildItem -Path "frontend\components" -Recurse -Include *.tsx,*.ts

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $updated = $content -replace [regex]::Escape("process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'"), "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'"
        
        if ($content -ne $updated) {
            [System.IO.File]::WriteAllText($file.FullName, $updated)
            Write-Host "Updated: $($file.FullName)"
        }
    } catch {
        Write-Host "Error processing $($file.FullName): $_"
    }
}

Write-Host "`nDone! Updated all API URL patterns in components."
