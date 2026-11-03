param([string]$JdkRoot = $env:JAVA_HOME)
$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot
if (!$JdkRoot) { throw 'Set JAVA_HOME to a JDK 17 installation.' }
$out = Join-Path $PSScriptRoot 'build'
New-Item -ItemType Directory -Force $out | Out-Null
$javaFiles = (Get-ChildItem (Join-Path $PSScriptRoot 'src'),(Join-Path $PSScriptRoot 'vendor') -Recurse -Filter '*.java').FullName
& "$JdkRoot/bin/javac.exe" -encoding UTF-8 -nowarn -d $out $javaFiles
if ($LASTEXITCODE) {throw 'Java compilation failed.'}
& "$JdkRoot/bin/jar.exe" cfe "$PSScriptRoot/adventure.jar" Adventure -C $out .
if ($LASTEXITCODE) {throw 'JAR creation failed.'}
if (!(Test-Path "$PSScriptRoot/runtime/bin/java.exe")) {
    & "$JdkRoot/bin/jlink.exe" --add-modules java.base,java.desktop,jdk.httpserver,jdk.charsets --strip-debug --no-header-files --no-man-pages --compress=2 --output "$PSScriptRoot/runtime"
    if ($LASTEXITCODE) {throw 'Runtime build failed.'}
}
$compiler = "$env:WINDIR/Microsoft.NET/Framework64/v4.0.30319/csc.exe"
$executable = Join-Path $project 'Play Enchanted Scepters.exe'
$icon = Join-Path $PSScriptRoot 'crest.ico'
$launcher = Join-Path $PSScriptRoot 'src\Launch.cs'
& $compiler /nologo /target:winexe /optimize+ "/out:$executable" "/win32icon:$icon" /r:System.Windows.Forms.dll $launcher
if ($LASTEXITCODE) {throw 'Windows launcher compilation failed.'}
