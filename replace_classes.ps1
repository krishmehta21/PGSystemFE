$files = Get-ChildItem -Path "d:\Personal Projects\PGProject\pg-control-system\src" -Recurse -Include *.tsx

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace "text-primary-text", "text-main-text" `
                          -replace "bg-primary-text", "bg-main-text" `
                          -replace "border-primary-text", "border-main-text" `
                          -replace "text-secondary-text", "text-black/60" `
                          -replace "bg-secondary-text", "bg-black/60" `
                          -replace "text-muted-text", "text-black/40" `
                          -replace "bg-page-bg", "bg-main-bg" `
                          -replace "bg-card-bg", "bg-white" `
                          -replace "border-card-border", "border-main-border" `
                          -replace "text-brand-accent", "text-accent" `
                          -replace "bg-brand-accent", "bg-accent" `
                          -replace "border-brand-accent", "border-accent" `
                          -replace "ring-brand-accent", "ring-accent" `
                          -replace "bg-brand-amber", "bg-warning" `
                          -replace "text-brand-amber", "text-warning"
    if ($content -cne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Updated $($file.Name)"
    }
}
