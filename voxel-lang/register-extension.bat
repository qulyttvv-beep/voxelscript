@echo off
:: VoxelScript File Association Registration
:: Run as Administrator!

echo ============================================
echo    VOXELSCRIPT FILE ASSOCIATION SETUP
echo ============================================
echo.
echo This will register .voxel and .vxl files
echo to open with VoxelScript Editor.
echo.
echo NOTE: Run this as Administrator!
echo.

set VOXEL_PATH=%~dp0editor

:: Register .voxel extension
reg add "HKCR\.voxel" /ve /d "VoxelScript.File" /f
reg add "HKCR\.vxl" /ve /d "VoxelScript.File" /f

:: Create file type
reg add "HKCR\VoxelScript.File" /ve /d "VoxelScript Source File" /f
reg add "HKCR\VoxelScript.File\DefaultIcon" /ve /d "%VOXEL_PATH%\assets\icon.ico" /f

:: Open command
reg add "HKCR\VoxelScript.File\shell\open\command" /ve /d "\"%VOXEL_PATH%\..\..\node_modules\electron\dist\electron.exe\" \"%VOXEL_PATH%\" \"%%1\"" /f

:: Edit command
reg add "HKCR\VoxelScript.File\shell\edit" /ve /d "Edit with VoxelScript" /f
reg add "HKCR\VoxelScript.File\shell\edit\command" /ve /d "\"%VOXEL_PATH%\..\..\node_modules\electron\dist\electron.exe\" \"%VOXEL_PATH%\" \"%%1\"" /f

echo.
echo ============================================
echo    REGISTRATION COMPLETE!
echo ============================================
echo.
echo .voxel and .vxl files are now associated with VoxelScript.
echo.
pause
