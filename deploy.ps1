# ======================================================================
# Auto Deploy Script for GitHub Pages Jekyll Blog
# Usage: .\deploy.ps1 "Your commit message"
# ======================================================================

param(
    [string]$CommitMessage = "Update blog content"
)

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Change to script directory
Set-Location $PSScriptRoot

Write-Info "========================================="
Write-Info "  GitHub Pages Auto Deploy Script"
Write-Info "========================================="
Write-Info ""

# Step 1: Check if we're in a git repository
Write-Info "[1/8] Checking git repository..."
if (-not (Test-Path ".git")) {
    Write-Error "Error: Not a git repository!"
    exit 1
}
Write-Success "✓ Git repository found"

# Step 2: Check for uncommitted changes
Write-Info "[2/8] Checking for changes..."
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Warning "No changes to commit. Exiting..."
    exit 0
}
Write-Success "✓ Found changes to commit"

# Step 3: Fetch latest changes from remote
Write-Info "[3/8] Fetching latest changes from remote..."
git fetch origin
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Failed to fetch from remote!"
    exit 1
}
Write-Success "✓ Fetched latest changes"

# Step 4: Check if remote has new commits
Write-Info "[4/8] Checking for remote updates..."
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/main
if ($localCommit -ne $remoteCommit) {
    Write-Warning "Remote has new commits. Pulling changes..."
    git pull --rebase origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: Failed to pull changes. Please resolve conflicts manually."
        exit 1
    }
    Write-Success "✓ Pulled and rebased successfully"
} else {
    Write-Success "✓ Local is up to date with remote"
}

# Step 5: Clean build artifacts and cache
Write-Info "[5/8] Cleaning build artifacts and cache..."
if (Test-Path "_site") {
    Remove-Item -Path "_site" -Recurse -Force
    Write-Success "  - Removed _site directory"
}
if (Test-Path ".jekyll-cache") {
    Remove-Item -Path ".jekyll-cache" -Recurse -Force
    Write-Success "  - Removed .jekyll-cache directory"
}
if (Test-Path ".jekyll-metadata") {
    Remove-Item -Path ".jekyll-metadata" -Force
    Write-Success "  - Removed .jekyll-metadata file"
}
if (Test-Path ".sass-cache") {
    Remove-Item -Path ".sass-cache" -Recurse -Force
    Write-Success "  - Removed .sass-cache directory"
}
Write-Success "✓ Cleanup completed"

# Step 6: Build the site locally to verify
Write-Info "[6/8] Building site locally to verify..."
bundle exec jekyll clean | Out-Null
$buildOutput = bundle exec jekyll build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Build failed!"
    Write-Error $buildOutput
    exit 1
}
Write-Success "✓ Build successful"

# Step 7: Commit changes
Write-Info "[7/8] Committing changes..."
Write-Info "Commit message: $CommitMessage"

# Add only tracked files and new content files (exclude build artifacts)
git add _config.yml
git add _data/
git add _posts/
git add _tabs/
git add _includes/
git add _layouts/
git add _plugins/
git add assets/
git add Gemfile*
git add .github/
git add CLAUDE.md
git add *.md

# Create commit
git commit -m "$CommitMessage`n`n🤖 Generated with [Claude Code](https://claude.com/claude-code)`n`nCo-Authored-By: Claude <noreply@anthropic.com>"

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Nothing to commit or commit failed"
    # Check if it's because there's nothing to commit
    $statusAfter = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($statusAfter)) {
        Write-Info "All changes were build artifacts. Nothing to commit."
        exit 0
    } else {
        Write-Error "Commit failed!"
        exit 1
    }
}
Write-Success "✓ Changes committed"

# Step 8: Push to GitHub
Write-Info "[8/8] Pushing to GitHub..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Error: Push failed!"
    Write-Warning "Trying to pull and push again..."
    git pull --rebase origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to rebase. Please resolve conflicts manually."
        exit 1
    }
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Push failed again. Please check manually."
        exit 1
    }
}
Write-Success "✓ Pushed to GitHub successfully"

Write-Info ""
Write-Success "========================================="
Write-Success "  Deployment Completed Successfully! 🎉"
Write-Success "========================================="
Write-Info ""
Write-Info "Your changes have been pushed to GitHub."
Write-Info "GitHub Actions will automatically build and deploy your site."
Write-Info "Check deployment status at: https://github.com/gnutlam/gnutlam.github.io/actions"
Write-Info ""
Write-Info "Your site will be live at: https://gnutlam.github.io"
Write-Info ""
