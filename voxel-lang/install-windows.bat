@echo off
setlocal EnableDelayedExpansion

:: VoxelScript Installer for Windows
:: Run as Administrator for system-wide install

echo.
echo [92m╔═══════════════════════════════════════════════════════════╗[0m
echo [92m║                                                           ║[0m
echo [92m║   ██╗   ██╗ ██████╗ ██╗  ██╗███████╗██╗                  ║[0m
echo [92m║   ██║   ██║██╔═══██╗╚██╗██╔╝██╔════╝██║                  ║[0m
echo [92m║   ██║   ██║██║   ██║ ╚███╔╝ █████╗  ██║                  ║[0m
echo [92m║   ╚██╗ ██╔╝██║   ██║ ██╔██╗ ██╔══╝  ██║                  ║[0m
echo [92m║    ╚████╔╝ ╚██████╔╝██╔╝ ██╗███████╗███████╗             ║[0m
echo [92m║     ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝             ║[0m
echo [92m║                                                           ║[0m
echo [92m║        VOXELSCRIPT INSTALLER - Windows Edition            ║[0m
echo [92m║                                                           ║[0m
echo [92m╚═══════════════════════════════════════════════════════════╝[0m
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [93mNote: Running without admin rights - installing for current user only[0m
    echo [93mRun as Administrator for system-wide install[0m
    echo.
    set "INSTALL_MODE=user"
) else (
    echo [92mRunning with Administrator privileges - system-wide install[0m
    set "INSTALL_MODE=system"
)

:: Check for Node.js
echo.
echo [96m[1/6] Checking dependencies...[0m
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [91mError: Node.js is not installed.[0m
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [92m✓ Node.js %NODE_VER% found[0m

:: Set install directory
if "%INSTALL_MODE%"=="system" (
    set "INSTALL_DIR=%ProgramFiles%\VoxelScript"
) else (
    set "INSTALL_DIR=%LOCALAPPDATA%\VoxelScript"
)

echo.
echo [96m[2/6] Creating installation directory...[0m
echo Installing to: %INSTALL_DIR%
if exist "%INSTALL_DIR%" (
    echo Removing existing installation...
    rmdir /s /q "%INSTALL_DIR%" 2>nul
)
mkdir "%INSTALL_DIR%"

:: Copy files
echo.
echo [96m[3/6] Copying VoxelScript files...[0m
set "SOURCE_DIR=%~dp0"

xcopy "%SOURCE_DIR%lexer.js" "%INSTALL_DIR%\" /y >nul
xcopy "%SOURCE_DIR%parser.js" "%INSTALL_DIR%\" /y >nul
xcopy "%SOURCE_DIR%interpreter.js" "%INSTALL_DIR%\" /y >nul
xcopy "%SOURCE_DIR%voxel.js" "%INSTALL_DIR%\" /y >nul
xcopy "%SOURCE_DIR%package.json" "%INSTALL_DIR%\" /y >nul
if exist "%SOURCE_DIR%README.md" xcopy "%SOURCE_DIR%README.md" "%INSTALL_DIR%\" /y >nul

:: Copy bin directory
mkdir "%INSTALL_DIR%\bin" 2>nul
xcopy "%SOURCE_DIR%bin\*" "%INSTALL_DIR%\bin\" /y >nul 2>nul

:: Copy examples
if exist "%SOURCE_DIR%examples" (
    mkdir "%INSTALL_DIR%\examples" 2>nul
    xcopy "%SOURCE_DIR%examples\*" "%INSTALL_DIR%\examples\" /y >nul
)

echo [92m✓ Files copied[0m

:: Create CLI batch file
echo.
echo [96m[4/6] Creating CLI command...[0m

echo @echo off > "%INSTALL_DIR%\bin\voxel.cmd"
echo setlocal >> "%INSTALL_DIR%\bin\voxel.cmd"
echo set "VOXEL_HOME=%INSTALL_DIR%" >> "%INSTALL_DIR%\bin\voxel.cmd"
echo if "%%~1"=="" ( >> "%INSTALL_DIR%\bin\voxel.cmd"
echo     node "%%VOXEL_HOME%%\voxel.js" >> "%INSTALL_DIR%\bin\voxel.cmd"
echo ) else ( >> "%INSTALL_DIR%\bin\voxel.cmd"
echo     node "%%VOXEL_HOME%%\voxel.js" %%* >> "%INSTALL_DIR%\bin\voxel.cmd"
echo ) >> "%INSTALL_DIR%\bin\voxel.cmd"

echo [92m✓ CLI command created[0m

:: Add to PATH
echo.
echo [96m[5/6] Adding to PATH...[0m

set "BIN_PATH=%INSTALL_DIR%\bin"

if "%INSTALL_MODE%"=="system" (
    :: System PATH
    for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "CURRENT_PATH=%%b"
    echo !CURRENT_PATH! | find /i "%BIN_PATH%" >nul
    if !errorLevel! neq 0 (
        setx /M PATH "!CURRENT_PATH!;%BIN_PATH%" >nul 2>&1
        if !errorLevel! equ 0 (
            echo [92m✓ Added to system PATH[0m
        ) else (
            echo [93m! Could not modify system PATH. Add manually: %BIN_PATH%[0m
        )
    ) else (
        echo [93m✓ Already in system PATH[0m
    )
) else (
    :: User PATH
    for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "CURRENT_PATH=%%b"
    echo !CURRENT_PATH! | find /i "%BIN_PATH%" >nul
    if !errorLevel! neq 0 (
        setx PATH "!CURRENT_PATH!;%BIN_PATH%" >nul 2>&1
        echo [92m✓ Added to user PATH[0m
    ) else (
        echo [93m✓ Already in user PATH[0m
    )
)

:: Register file associations
echo.
echo [96m[6/6] Registering file associations...[0m

:: .voxel extension
reg add "HKCU\Software\Classes\.voxel" /ve /d "VoxelScript.File" /f >nul 2>&1
reg add "HKCU\Software\Classes\.vxl" /ve /d "VoxelScript.File" /f >nul 2>&1

:: File type
reg add "HKCU\Software\Classes\VoxelScript.File" /ve /d "VoxelScript Source File" /f >nul 2>&1
reg add "HKCU\Software\Classes\VoxelScript.File\shell" /ve /d "open" /f >nul 2>&1

:: Open command (runs the script)
reg add "HKCU\Software\Classes\VoxelScript.File\shell\open" /ve /d "Run with VoxelScript" /f >nul 2>&1
reg add "HKCU\Software\Classes\VoxelScript.File\shell\open\command" /ve /d "cmd /c \"%BIN_PATH%\voxel.cmd\" \"%%1\" & pause" /f >nul 2>&1

:: Edit command
reg add "HKCU\Software\Classes\VoxelScript.File\shell\edit" /ve /d "Edit" /f >nul 2>&1
reg add "HKCU\Software\Classes\VoxelScript.File\shell\edit\command" /ve /d "notepad.exe \"%%1\"" /f >nul 2>&1

:: Run command in context menu
reg add "HKCU\Software\Classes\VoxelScript.File\shell\run" /ve /d "Run Script" /f >nul 2>&1
reg add "HKCU\Software\Classes\VoxelScript.File\shell\run\command" /ve /d "cmd /k \"%BIN_PATH%\voxel.cmd\" \"%%1\"" /f >nul 2>&1

:: System-wide registration if admin
if "%INSTALL_MODE%"=="system" (
    reg add "HKCR\.voxel" /ve /d "VoxelScript.File" /f >nul 2>&1
    reg add "HKCR\.vxl" /ve /d "VoxelScript.File" /f >nul 2>&1
    reg add "HKCR\VoxelScript.File" /ve /d "VoxelScript Source File" /f >nul 2>&1
    reg add "HKCR\VoxelScript.File\shell\open\command" /ve /d "cmd /c \"%BIN_PATH%\voxel.cmd\" \"%%1\" & pause" /f >nul 2>&1
    reg add "HKCR\VoxelScript.File\shell\run" /ve /d "Run Script" /f >nul 2>&1
    reg add "HKCR\VoxelScript.File\shell\run\command" /ve /d "cmd /k \"%BIN_PATH%\voxel.cmd\" \"%%1\"" /f >nul 2>&1
)

:: Refresh shell
call :RefreshShell

echo [92m✓ File associations registered[0m
echo [92m✓ Double-click .voxel files to run them![0m
echo [92m✓ Right-click for "Run Script" option[0m

:: Done!
echo.
echo [92m═══════════════════════════════════════════════════════════[0m
echo [92m              INSTALLATION COMPLETE![0m
echo [92m═══════════════════════════════════════════════════════════[0m
echo.
echo VoxelScript installed to: [96m%INSTALL_DIR%[0m
echo.
echo [93mUsage:[0m
echo   [96mvoxel[0m                    - Start REPL
echo   [96mvoxel script.voxel[0m      - Run a script
echo   [96mvoxel --help[0m            - Show help
echo.
echo [93mYou can now:[0m
echo   [96m• Double-click any .voxel file to run it[0m
echo   [96m• Right-click → "Run Script" on .voxel files[0m
echo   [96m• Type "voxel" in any terminal[0m
echo.
echo [93mNOTE: Open a NEW terminal window to use the 'voxel' command.[0m
echo.
echo [92mWelcome to the Matrix! [0m
echo.
pause
exit /b 0

:RefreshShell
:: Notify Windows of the change
powershell -Command "& {Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Shell{[DllImport(\"shell32.dll\")]public static extern void SHChangeNotify(int wEventId,uint uFlags,IntPtr dwItem1,IntPtr dwItem2);}'; [Shell]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)}" >nul 2>&1
exit /b 0
