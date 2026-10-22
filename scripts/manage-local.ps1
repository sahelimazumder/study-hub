param([ValidateSet('Start','Status','Stop','Disable')][string]$Action='Start')
$ErrorActionPreference='Stop'
$projectPath=Split-Path -Parent $PSScriptRoot
$taskName='IIM Ranchi Study Hub'
$account=[System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$nodePath=(Get-Command node -ErrorAction Stop).Source
$scriptPath=Join-Path $PSScriptRoot 'run-study-hub.vbs'
$wscriptPath=Join-Path $env:SystemRoot 'System32\wscript.exe'
$service=New-Object -ComObject 'Schedule.Service'
$service.Connect()
$folder=$service.GetFolder('\')
function Health {try{Invoke-RestMethod -Uri 'http://127.0.0.1:5173/__study_health' -TimeoutSec 3}catch{$null}}
if($Action -eq 'Status'){
 try{$task=$folder.GetTask($taskName);Write-Output "Windows task state: $($task.State) (4 means running)."}catch{Write-Output 'Windows autostart is not installed.'}
 $health=Health;if($health -and $health.mode -eq 'persistent'){Write-Output "Website healthy at http://127.0.0.1:5173/ (server process $($health.pid))."}else{Write-Output 'Website is not responding.'};exit
}
if($Action -in @('Stop','Disable')){
 try{$folder.GetTask($taskName).Stop(0)}catch{}
 # Stop only Node processes whose command line names this installation's server scripts.
 Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {$_.CommandLine -and ($_.CommandLine.Contains((Join-Path $projectPath 'server\local.mjs')) -or $_.CommandLine.Contains((Join-Path $projectPath 'server\supervisor.mjs')))} | ForEach-Object {Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue}
 if($Action -eq 'Disable'){try{$folder.DeleteTask($taskName,0)}catch{};Write-Output 'Windows autostart disabled.'}else{Write-Output 'Server stopped. It will start again at your next Windows sign-in or when you use START_STUDY_HUB.cmd.'};exit
}
Push-Location $projectPath
try{
 & $nodePath (Join-Path $PSScriptRoot 'local-build.mjs')
 if($LASTEXITCODE -ne 0){throw 'Build failed. See the messages above.'}
 $definition=$service.NewTask(0)
 $definition.RegistrationInfo.Description='Private local Study Hub. Starts at sign-in independently of Codex; automatically recovers server failures.'
 $definition.Principal.UserId=$account;$definition.Principal.LogonType=3;$definition.Principal.RunLevel=0
 $definition.Settings.Enabled=$true;$definition.Settings.Hidden=$true;$definition.Settings.ExecutionTimeLimit='PT0S'
 $definition.Settings.DisallowStartIfOnBatteries=$false;$definition.Settings.StopIfGoingOnBatteries=$false
 $definition.Settings.StartWhenAvailable=$true;$definition.Settings.MultipleInstances=2
 $definition.Settings.RestartCount=3;$definition.Settings.RestartInterval='PT1M'
 $trigger=$definition.Triggers.Create(9);$trigger.UserId=$account;$trigger.Enabled=$true
 $taskAction=$definition.Actions.Create(0);$taskAction.Path=$wscriptPath
 $taskAction.Arguments='//nologo "'+$scriptPath+'" "'+$nodePath+'"';$taskAction.WorkingDirectory=$projectPath
 $task=$folder.RegisterTaskDefinition($taskName,$definition,6,$account,$null,3,$null)
 $null=$task.Run($null)
 for($attempt=0;$attempt -lt 30;$attempt++){
  $health=Health;if($health -and $health.app -eq 'ranchi-study-hub' -and $health.mode -eq 'persistent'){Write-Output 'Study Hub is running independently of Codex at http://127.0.0.1:5173/';Write-Output 'Windows sign-in startup and automatic crash recovery are enabled.';exit 0}
  Start-Sleep -Seconds 1
 }
 throw 'The background server did not become healthy. Check .runtime/server.log and whether another app is using port 5173.'
}finally{Pop-Location}
