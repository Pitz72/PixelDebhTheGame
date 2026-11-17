; PixelDebh: Retro-Rescue! - hooks for the Windows installer (NSIS).
;
; tauri.conf.json > bundle > windows > nsis > installerHooks points here. Tauri includes this file in its installer
; template (after LogicLib and Win\RestartManager.nsh) and inserts each NSIS_HOOK_* macro at its place.
; Keep this file plain ASCII: makensis reads a file without a byte order mark in the system code page.

!define /ifndef PD_ERROR_MORE_DATA 234
!define /ifndef PD_WAIT_STEP_MS 250
!define /ifndef PD_WAIT_STEPS 80 ; 80 x 250 ms = 20 seconds

; At the start of the Install section, just before the template checks whether the game is running.
;
; In an update only (/UPDATE: the game starts this installer that way), wait up to 20 seconds for the game to let go of
; its exe. The game starts the installer and closes straight away. The template's check (Restart Manager) can find the
; exe still in use while the game is on its way out: RmShutdown then fails and the installer stops with "Failed to kill"
; (Tauri issue 16277; a player updating to 1.19.0 saw it, and the second try worked). After the wait the template's
; check runs as before: if the game is still open, it closes it or says why it cannot.
; A manual install does not wait: there the template asks the player to close the game.
!macro NSIS_HOOK_PREINSTALL
  ${If} $UpdateMode = 1
    Push $0
    Push $1
    Push $2
    Push $3
    Push $R0
    Push $R8
    Push $R9
    StrCpy $R9 0
    ${Do}
      StrCpy $R8 0 ; 1 while some process still uses the exe
      !insertmacro RestartManager_StartSession $R0
      ${If} $R0 != ""
        !insertmacro RestartManager_RegisterFile $R0 "$INSTDIR\${MAINBINARYNAME}.exe"
        ${If} $0 = 0
          ; ERROR_SUCCESS: nobody uses the exe; ERROR_MORE_DATA: some process does
          System::Call 'RSTRTMGR::RmGetList(p R0, *i .r1, *i .r2, p 0, *i .r3) i .r0'
          ${IfThen} $0 = ${PD_ERROR_MORE_DATA} ${|} StrCpy $R8 1 ${|}
        ${EndIf}
        !insertmacro RestartManager_EndSession $R0
      ${EndIf}
      ${If} $R8 = 0
        ${ExitDo}
      ${EndIf}
      Sleep ${PD_WAIT_STEP_MS}
      IntOp $R9 $R9 + 1
    ${LoopUntil} $R9 >= ${PD_WAIT_STEPS}
    Pop $R9
    Pop $R8
    Pop $R0
    Pop $3
    Pop $2
    Pop $1
    Pop $0
  ${EndIf}
!macroend
