; VoxelScript Installer Custom NSIS Script
; Additional installer customizations

!macro customHeader
  !system "echo 'Building VoxelScript Installer...'"
!macroend

!macro customInit
  ; Check for Visual C++ Redistributable
  ; VoxelScript needs this for Electron
!macroend

!macro customInstall
  ; Register .voxel file extension
  WriteRegStr HKCR ".voxel" "" "VoxelScript.File"
  WriteRegStr HKCR ".vxl" "" "VoxelScript.File"
  WriteRegStr HKCR "VoxelScript.File" "" "VoxelScript Source File"
  WriteRegStr HKCR "VoxelScript.File\DefaultIcon" "" "$INSTDIR\resources\app\assets\file-icon.ico"
  WriteRegStr HKCR "VoxelScript.File\shell\open\command" "" '"$INSTDIR\VoxelScript.exe" "%1"'
  WriteRegStr HKCR "VoxelScript.File\shell\edit" "" "Edit with VoxelScript"
  WriteRegStr HKCR "VoxelScript.File\shell\edit\command" "" '"$INSTDIR\VoxelScript.exe" "%1"'
  
  ; Refresh shell
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro customUnInstall
  ; Unregister file extensions
  DeleteRegKey HKCR ".voxel"
  DeleteRegKey HKCR ".vxl"
  DeleteRegKey HKCR "VoxelScript.File"
  
  ; Refresh shell
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
