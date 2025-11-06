# PowerShell script to fix template literal syntax
# Replaces double quotes with backticks for template literals

$files = Get-ChildItem -Path "frontend" -Include *.tsx,*.ts -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.next" 
}

$count = 0
$filesFixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace double quotes with backticks for template literals containing ${process.env.NEXT_PUBLIC_API_URL
    $content = $content -replace '"\$\{process\.env\.NEXT_PUBLIC_API_URL([^"]+)"', '`${process.env.NEXT_PUBLIC_API_URL$1`'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesFixed++
        $matches = ([regex]::Matches($originalContent, '"\$\{process\.env\.NEXT_PUBLIC_API_URL')).Count
        $count += $matches
        Write-Host "Fixed $($file.Name) - $matches replacements"
    }
}

Write-Host "`nTotal: Fixed $count instances in $filesFixed files"
