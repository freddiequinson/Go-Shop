param(
    [ValidateSet("Full", "Tree")]
    [string]$Scope = "Full",
    [string]$Image = "ghcr.io/gitleaks/gitleaks@sha256:75bdb2b2f4db213cde0b8295f13a88d6b333091bbfbf3012a4e083d00d31caba"
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$temporary = Join-Path ([System.IO.Path]::GetTempPath()) ("goshop-secret-scan-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $temporary | Out-Null
$tree = Join-Path $temporary "tree"
New-Item -ItemType Directory -Path $tree | Out-Null

function Invoke-DockerQuiet {
    param([string[]]$Arguments)

    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "SilentlyContinue"
        & docker @Arguments 2>$null | Out-Null
        return $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
}

function Invoke-Gitleaks {
    param(
        [string]$Name,
        [string[]]$Arguments
    )

    $report = Join-Path $temporary "$Name.json"
    $dockerArguments = @(
        "run", "--rm",
        "-v", "${repo}:/repo:ro",
        "-v", "${temporary}:/report",
        "-v", "${tree}:/tree:ro"
    ) + @($Image) + $Arguments + @(
        "--config=/repo/.gitleaks.toml",
        "--redact",
        "--no-banner",
        "--report-format=json",
        "--report-path=/report/$Name.json"
    )

    $status = Invoke-DockerQuiet -Arguments $dockerArguments
    if ($status -notin 0, 1) {
        throw "Gitleaks $Name scan failed with status $status."
    }

    $findings = @()
    if (Test-Path -LiteralPath $report) {
        $parsed = Get-Content -LiteralPath $report -Raw | ConvertFrom-Json
        $findings = @($parsed | ForEach-Object { $_ })
    }

    Write-Host "$Name findings: $($findings.Count)"
    $findings |
        Select-Object RuleID, File, @{Name = "Commit"; Expression = { if ($_.Commit) { $_.Commit.Substring(0, 12) } else { "working-tree" } } } |
        Sort-Object RuleID, File, Commit -Unique |
        Format-Table -AutoSize |
        Out-Host

    return $findings.Count
}

try {
    & docker image inspect $Image *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Pinned Gitleaks image is missing. Pull it before scanning."
    }

    $canary = Join-Path $temporary "canary.txt"
    $canaryValue = @(
        "postgresql://canary-user:" + "canary-password@db.invalid/app",
        "PAYSTACK_SECRET_KEY=sk_" + "live_canary_value_that_is_not_real"
    )
    Set-Content -LiteralPath $canary -Value $canaryValue
    $canaryArguments = @(
        "run", "--rm",
        "-v", "${temporary}:/scan:ro",
        "-v", "${repo}/.gitleaks.toml:/gitleaks.toml:ro",
        $Image,
        "detect", "--no-git", "--source=/scan/canary.txt",
        "--config=/gitleaks.toml", "--redact", "--no-banner"
    )
    $canaryStatus = Invoke-DockerQuiet -Arguments $canaryArguments
    if ($canaryStatus -ne 1) {
        throw "Secret scanner canary failed with status $canaryStatus."
    }
    Remove-Item -LiteralPath $canary

    Push-Location $repo
    try {
        $candidateFiles = @(git ls-files --cached --others --exclude-standard)
        if ($LASTEXITCODE -ne 0) {
            throw "Could not enumerate publication-candidate files."
        }
    }
    finally {
        Pop-Location
    }

    foreach ($relativePath in $candidateFiles) {
        $source = Join-Path $repo $relativePath
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
            continue
        }
        $destination = Join-Path $tree $relativePath
        $destinationDirectory = Split-Path -Parent $destination
        New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
        Copy-Item -LiteralPath $source -Destination $destination
    }

    $historyCount = 0
    if ($Scope -eq "Full") {
        $historyCount = Invoke-Gitleaks -Name "history" -Arguments @("detect", "--source=/repo", "--log-opts=--all")
    }
    $treeCount = Invoke-Gitleaks -Name "tree" -Arguments @("detect", "--no-git", "--source=/tree")

    if (($historyCount + $treeCount) -gt 0) {
        Write-Error "Secret gate failed. Rotate exposed credentials and remove every finding before publication."
        exit 1
    }

    if ($Scope -eq "Full") {
        Write-Output "Secret gate passed: complete history and publication-candidate tree are clean."
    }
    else {
        Write-Output "Secret gate passed: publication-candidate tree is clean."
    }
}
finally {
    if (Test-Path -LiteralPath $temporary) {
        Remove-Item -LiteralPath $temporary -Recurse -Force
    }
}
