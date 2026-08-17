$files = Get-ChildItem -Path $PSScriptRoot\.. -Include *.ts,*.tsx -Recurse |
  Where-Object { $_.FullName -notmatch '\\(node_modules|dist|\.expo)\\' }

$replacements = @(
  @("import { getClubes } from '@/services/academias-service'", "import { getAcademias } from '@/services/academias-service'"),
  @("import { getClubes, getClubById } from '@/services/academias-service'", "import { getAcademias, getAcademiaById } from '@/services/clubes-service'"),
  @("import { getClubById, getClubes, updateClub } from '@/services/academias-service'", "import { getAcademiaById, getAcademias, updateClub } from '@/services/clubes-service'"),
  @("import { getClubById, getClubes } from '@/services/academias-service'", "import { getAcademiaById, getAcademias } from '@/services/clubes-service'"),
  @("import { createClub } from '@/services/academias-service'", "import { createClub } from '@/services/clubes-service'"),
  @("import { getClubes } from '@/services/clubes-service'", "import { getAcademias } from '@/services/academias-service'"),
  @('API_ENDPOINTS.usersLocalClube', 'API_ENDPOINTS.userslocal'),
  @('.xano', '.user'),
  @('{ local, xano }', '{ local, user }')
)

$count = 0
foreach ($file in $files) {
  $content = [IO.File]::ReadAllText($file.FullName)
  $original = $content
  foreach ($pair in $replacements) {
    $content = $content.Replace($pair[0], $pair[1])
  }
  if ($content -ne $original) {
    [IO.File]::WriteAllText($file.FullName, $content)
    $count++
  }
}

Write-Output "Updated $count files"
