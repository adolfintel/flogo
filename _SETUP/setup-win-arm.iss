#define MyAppName "Flogo"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "Federico Dossena"
#define MyAppURL "https://fdossena.com/?p=flogo/index.frag"
#define MyAppExeName "Flogo.exe"

[Setup]
AppId={{E669A14D-0BA6-4705-B4A8-E80F7DC4235A}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=..\LICENSE.txt
SetupIconFile=..\icons\winicon.ico
UninstallDisplayIcon="{app}\{#MyAppExeName}",0
OutputDir=setup
OutputBaseFilename=Flogo-win-arm-{#MyAppVersion}
Compression=lzma2/ultra64
CompressionThreads=1
LZMADictionarySize=262144
LZMANumFastBytes=273
SolidCompression=yes
LZMAUseSeparateProcess=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=arm64
ArchitecturesInstallIn64BitMode=arm64

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}";

[Files]
Source: "..\out\win-arm64-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\icons\winicon_file.ico"; DestDir: "{app}"; Flags: ignoreversion

[Registry]
Root: HKLM; Subkey: "Software\Classes\.flogo"; ValueType: string; ValueData: "Flogo Program"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\Classes\Flogo Program"; ValueType: string; ValueData: "Flogo Program"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\Classes\Flogo Program\shell\open\command"; ValueType: string; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\Classes\Flogo Program\DefaultIcon"; ValueType: string; ValueData: "{app}\winicon_file.ico"; Flags: uninsdeletekey

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

