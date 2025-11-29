@echo off
:: VoxelScript CLI - Windows
:: Usage: voxel script.voxel
:: Usage: voxel (starts REPL)

setlocal

set "VOXEL_HOME=%~dp0.."
set "SCRIPT=%~1"

if "%SCRIPT%"=="" (
    node "%VOXEL_HOME%\voxel.js"
) else (
    node "%VOXEL_HOME%\voxel.js" "%~f1" %2 %3 %4 %5 %6 %7 %8 %9
)
