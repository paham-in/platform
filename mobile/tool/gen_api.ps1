$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Copy-Item "$root\..\backend\docs\swagger.json" "$root\api\swagger.json" -Force

if (Test-Path "$root\packages\pahamin_api") {
  Remove-Item "$root\packages\pahamin_api" -Recurse -Force
}

npx --yes @openapitools/openapi-generator-cli generate `
  -i "$root\api\swagger.json" `
  -g dart-dio `
  -o "$root\packages\pahamin_api" `
  --config "$root\openapi-generator-config.yaml"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Remove-Item "$root\packages\pahamin_api\.openapi-generator" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$root\packages\pahamin_api\.openapi-generator-ignore" -Force -ErrorAction SilentlyContinue
Remove-Item "$root\packages\pahamin_api\test" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$root\packages\pahamin_api\doc" -Recurse -Force -ErrorAction SilentlyContinue

# Bump language version supaya json_serializable bisa emit null-aware syntax (>=3.8)
$pubspec = "$root\packages\pahamin_api\pubspec.yaml"
(Get-Content $pubspec) -replace "sdk: '>=3.5.0 <4.0.0'", "sdk: '>=3.8.0 <4.0.0'" | Set-Content $pubspec

# Serap warning unused_import di kode generated
$analysis = "$root\packages\pahamin_api\analysis_options.yaml"
$content = Get-Content $analysis -Raw
if ($content -notmatch "unused_import: ignore") {
  $content = $content -replace "    deprecated_member_use_from_same_package: ignore", "    deprecated_member_use_from_same_package: ignore`n    unused_import: ignore"
  Set-Content -LiteralPath $analysis -Value $content
}

# Generate .g.dart serializer: build_runner (sudah ter-resolve di package)
Push-Location "$root\packages\pahamin_api"
try {
  dart pub get | Out-Null
  dart run build_runner build --delete-conflicting-outputs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Output "API client regenerated."
Write-Output "API client regenerated."