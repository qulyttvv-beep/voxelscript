@echo off
echo ============================================
echo    VOXELSCRIPT INSTALLER BUILDER
echo ============================================
echo.

cd /d "%~dp0editor"

echo [1/4] Checking dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building application...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    echo.
    echo Make sure you have icon.ico files in editor/assets/
    echo Convert the SVG files using: https://convertio.co/svg-ico/
    pause
    exit /b 1
)

echo.
echo [3/4] Build complete!
echo.
echo [4/4] Output location:
echo       editor\dist\VoxelScript-Setup-1.0.0.exe
echo.
echo ============================================
echo    BUILD SUCCESSFUL!
echo ============================================
pause
