@echo off
:: VoxelScript Uninstaller for Windows

echo.
echo [93mVoxelScript Uninstaller[0m
echo.

set "INSTALL_DIR_USER=%LOCALAPPDATA%\VoxelScript"
set "INSTALL_DIR_SYSTEM=%ProgramFiles%\VoxelScript"

:: Remove user installation
if exist "%INSTALL_DIR_USER%" (
    echo Removing user installation...
    rmdir /s /q "%INSTALL_DIR_USER%"
    echo [92m✓ Removed %INSTALL_DIR_USER%[0m
)

:: Remove system installation (requires admin)
if exist "%INSTALL_DIR_SYSTEM%" (
    echo Removing system installation...
    rmdir /s /q "%INSTALL_DIR_SYSTEM%" 2>nul
    if exist "%INSTALL_DIR_SYSTEM%" (
        echo [93m! Could not remove system install. Run as Administrator.[0m
    ) else (
        echo [92m✓ Removed %INSTALL_DIR_SYSTEM%[0m
    )
)

:: Remove registry entries
echo Removing file associations...
reg delete "HKCU\Software\Classes\.voxel" /f >nul 2>&1
reg delete "HKCU\Software\Classes\.vxl" /f >nul 2>&1
reg delete "HKCU\Software\Classes\VoxelScript.File" /f >nul 2>&1

:: Try system registry (requires admin)
reg delete "HKCR\.voxel" /f >nul 2>&1
reg delete "HKCR\.vxl" /f >nul 2>&1
reg delete "HKCR\VoxelScript.File" /f >nul 2>&1

echo [92m✓ File associations removed[0m

echo.
echo [92mVoxelScript has been uninstalled.[0m
echo [93mNote: You may need to manually remove VoxelScript from your PATH.[0m
echo.
pause
