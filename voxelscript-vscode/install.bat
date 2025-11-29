@echo off
echo ============================================
echo   VOXELSCRIPT VS CODE EXTENSION INSTALLER
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo WARNING: npm install had issues, continuing...
)

echo.
echo [2/4] Packaging extension...
call npx vsce package --allow-missing-repository
if errorlevel 1 (
    echo ERROR: Failed to package extension
    echo Make sure you have Node.js installed
    pause
    exit /b 1
)

echo.
echo [3/4] Installing extension to VS Code...
for %%f in (*.vsix) do (
    code --install-extension "%%f"
    if errorlevel 1 (
        echo ERROR: Failed to install extension
        echo Try manually: code --install-extension %%f
        pause
        exit /b 1
    )
    echo Installed: %%f
)

echo.
echo [4/4] Cleaning up...

echo.
echo ============================================
echo   INSTALLATION COMPLETE!
echo ============================================
echo.
echo The VoxelScript extension is now installed!
echo.
echo To use:
echo   1. Open a .voxel file in VS Code
echo   2. Enjoy syntax highlighting!
echo   3. Press F5 to run your script
echo   4. Try the Matrix theme (Ctrl+K Ctrl+T)
echo.
echo You may need to restart VS Code.
echo.
pause
