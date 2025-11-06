# Fix remaining API URL patterns in frontend files
$files = Get-ChildItem -Path "frontend" -Recurse -Include *.tsx,*.ts

$count = 0
foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        
        # Replace the old pattern with the new one
        $updated = $content -replace [regex]::Escape("process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'"), "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'"
        
        if ($content -ne $updated) {
            [System.IO.File]::WriteAllText($file.FullName, $updated)
            Write-Host "Updated: $($file.FullName)"
            $count++
        }
    } catch {
        Write-Host "Error processing $($file.FullName): $_"
    }
}

Write-Host "`nDone! Updated $count files."
