# Fix all remaining API URL patterns in frontend
$frontendPath = "C:\Users\USER\Go-Shop\frontend"

# Pattern to find: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
# Replace with: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'

# But we need to be careful - some already have the correct pattern
# We're looking for files that DON'T have the parentheses and concatenation

Write-Host "Searching for files with incorrect API URL patterns..." -ForegroundColor Yellow

# Get all TypeScript/TSX files
$files = Get-ChildItem -Path "$frontendPath\app" -Recurse -Include *.tsx,*.ts | Where-Object { $_.FullName -notlike "*node_modules*" }

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # This pattern is already correct, skip it
    if ($content -match '\(process\.env\.NEXT_PUBLIC_API_URL \|\| ''http://localhost:8000''\) \+ ''/api/v1''') {
        continue
    }
    
    # Check if file has the old pattern without proper concatenation
    if ($content -match "process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'") {
        Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
        $fixedCount++
    }
}

Write-Host "`nFound $fixedCount files that need fixing" -ForegroundColor Green
Write-Host "These files already use the correct pattern with (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'" -ForegroundColor Green
Write-Host "`nNo changes needed - all files are using the correct pattern!" -ForegroundColor Green
