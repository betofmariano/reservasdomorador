$files = Get-ChildItem -Path $PSScriptRoot\.. -Include *.ts,*.tsx -Recurse |
  Where-Object { $_.FullName -notmatch '\\(node_modules|dist|\.expo)\\' }

$replacements = @(
  @('usersXano_id', 'users_id'),
  @('usersxano_id', 'users_id'),
  @('usersxanoId', 'usersId'),
  @('buildUsersXanoItemPath', 'buildUsersItemPath'),
  @('updateUsersXanoRecord', 'updateUsersRecord'),
  @('UpdateUsersXanoPayload', 'UpdateUsersPayload'),
  @('UsersXanoApiRecord', 'UsersApiRecord'),
  @('getClubesUsuario', 'getUserLocalAssociations'),
  @('ClubesUsuarioResponse', 'UserLocalAssociationsResponse'),
  @('enrichAssociationsWithClubs', 'enrichAssociationsWithAcademias'),
  @('filterAvailableClubs', 'filterAvailableAcademias'),
  @('findUserLocalAssociationForClub', 'findUserLocalAssociationForAcademia'),
  @('AssociatedClubDisplay', 'AssociatedLocalDisplay'),
  @("from '@/services/clubes-service'", "from '@/services/academias-service'"),
  @('getClubes()', 'getAcademias()'),
  @('getClubes,', 'getAcademias,'),
  @('clubes_id', 'academias_id'),
  @('clubesId', 'academiasId'),
  @('API_ENDPOINTS.clubes', 'API_ENDPOINTS.academias'),
  @('API_ENDPOINTS.usersxano', 'API_ENDPOINTS.users'),
  @('_usersxano', '_users'),
  @('resolveClubNameById', 'resolveAcademiaNameById'),
  @('getQuadrasByClub', 'getQuadrasByAcademia'),
  @('getHorariosByClub', 'getHorariosByAcademia'),
  @('filterClubsForConfiguration', 'filterAcademiasForConfiguration'),
  @('canManageClub', 'canManageAcademia'),
  @('userHasClubAssociation', 'userHasAcademiaAssociation'),
  @('isUserGestorOfClubFromAssociation', 'isUserGestorOfAcademiaFromAssociation'),
  @('isUserGestorOfClub', 'isUserGestorOfAcademia'),
  @('getClubGestorUserId', 'getAcademiaGestorUserId'),
  @('canAccessClubConfiguration', 'canAccessAcademiaConfiguration'),
  @('canAccessAdministracaoClube', 'canAccessAdministracaoAcademia'),
  @('isUserGestorClube', 'isUserGestorAcademia'),
  @('gestorClube', 'gestorAcademia'),
  @('clubeNome', 'localNome'),
  @('_clubes', '_academias')
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
