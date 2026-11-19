; PixelDebh: Retro-Rescue! - hooks for the Windows installer (NSIS).
;
; tauri.conf.json > bundle > windows > nsis > installerHooks points here. Tauri includes this file in its installer
; template (after LogicLib and Win\RestartManager.nsh) and inserts each NSIS_HOOK_* macro at its place.
; Keep this file plain ASCII: makensis reads a file without a byte order mark in the system code page. That is why the
; Italian messages below are worded without accented letters.

!define /ifndef PD_ERROR_MORE_DATA 234
!define /ifndef PD_WAIT_STEP_MS 250
!define /ifndef PD_WAIT_STEPS 80 ; 80 x 250 ms = 20 seconds
!define /ifndef PD_LANG_ITALIAN 1040
!define /ifndef PD_WRITE_TEST "pixeldebh-write-test.tmp"
; What an install with no window at all (/S) does when it cannot write to the chosen folder: IDCANCEL stops it,
; IDOK would move the game to the recommended folder. With a window (also the one of an update) the player chooses.
!define /ifndef PD_FOLDER_SILENT_CHOICE IDCANCEL

Var PdFolderMoved ; 1 when the game went to the recommended folder instead of the chosen one

; $R0 <- 1 when a file can be created in $INSTDIR, 0 when it cannot.
!macro PD_CAN_WRITE_INSTDIR
  ClearErrors
  FileOpen $R0 "$INSTDIR\${PD_WRITE_TEST}" w
  ${If} ${Errors}
    StrCpy $R0 0
  ${Else}
    FileClose $R0
    Delete "$INSTDIR\${PD_WRITE_TEST}"
    StrCpy $R0 1
  ${EndIf}
!macroend

; Says that $INSTDIR cannot be written to, and stops the installation. Uses $R2.
!macro PD_STOP_NO_WRITE
  ${If} $LANGUAGE = ${PD_LANG_ITALIAN}
    StrCpy $R2 "L'installazione non riesce a scrivere in questa cartella:$\r$\n$\r$\n$INSTDIR$\r$\n$\r$\nControlla lo spazio sul disco e l'antivirus, poi riprova."
  ${Else}
    StrCpy $R2 "The installer cannot write to this folder:$\r$\n$\r$\n$INSTDIR$\r$\n$\r$\nCheck the free disk space and the antivirus, then try again."
  ${EndIf}
  MessageBox MB_OK|MB_ICONSTOP "$R2" /SD IDOK
  ${If} $LANGUAGE = ${PD_LANG_ITALIAN}
    Abort "Installazione fermata: non si riesce a scrivere nella cartella."
  ${Else}
    Abort "Installation stopped: the folder cannot be written to."
  ${EndIf}
!macroend

; The installer runs without administrator rights and proposes a folder of the player (%LOCALAPPDATA%), but its folder
; page accepts any path, and it remembers the last one. In a folder it cannot write to (Program Files, for example) the
; copy of the first file used to fail with "Error opening file for writing" and Abort / Retry / Ignore; "Ignore" went on
; without the exe and saved that folder in the registry, so every later install and every update failed the same way.
; Here, before anything is copied or saved: if a file cannot be created in the folder, say so and offer the recommended
; folder (OK) or stop (Cancel).
!macro PD_CHECK_FOLDER
  Push $R0
  Push $R1
  Push $R2
  !insertmacro PD_CAN_WRITE_INSTDIR
  ${If} $R0 = 0
    StrCpy $R1 "$LOCALAPPDATA\${PRODUCTNAME}" ; the folder the installer proposes by itself
    ${If} $INSTDIR == $R1
      !insertmacro PD_STOP_NO_WRITE ; even that one refuses: nothing better to offer
    ${EndIf}
    ${If} $LANGUAGE = ${PD_LANG_ITALIAN}
      StrCpy $R2 "L'installazione non riesce a scrivere in questa cartella (di solito servono i permessi di amministratore):$\r$\n$\r$\n$INSTDIR$\r$\n$\r$\nPremi OK per installare il gioco nella cartella consigliata:$\r$\n$\r$\n$R1$\r$\n$\r$\nPremi Annulla per fermare l'installazione."
    ${Else}
      StrCpy $R2 "The installer cannot write to this folder (it usually needs administrator rights):$\r$\n$\r$\n$INSTDIR$\r$\n$\r$\nPress OK to install the game in the recommended folder:$\r$\n$\r$\n$R1$\r$\n$\r$\nPress Cancel to stop the installation."
    ${EndIf}
    ${If} ${Cmd} `MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "$R2" /SD ${PD_FOLDER_SILENT_CHOICE} IDCANCEL`
      ${If} $LANGUAGE = ${PD_LANG_ITALIAN}
        Abort "Installazione fermata: scegli un'altra cartella."
      ${Else}
        Abort "Installation stopped: choose another folder."
      ${EndIf}
    ${EndIf}
    StrCpy $INSTDIR $R1
    SetOutPath $INSTDIR
    !insertmacro PD_CAN_WRITE_INSTDIR
    ${If} $R0 = 0
      !insertmacro PD_STOP_NO_WRITE
    ${EndIf}
    StrCpy $PdFolderMoved 1
  ${EndIf}
  Pop $R2
  Pop $R1
  Pop $R0
!macroend

; At the start of the Install section, just after the template has set the output folder and just before it checks
; whether the game is running.
;
; First the folder (see PD_CHECK_FOLDER above).
;
; Then, in an update only (/UPDATE: the game starts this installer that way), wait up to 20 seconds for the game to let
; go of its exe. The game starts the installer and closes straight away. The template's check (Restart Manager) can find
; the exe still in use while the game is on its way out: RmShutdown then fails and the installer stops with "Failed to
; kill" (Tauri issue 16277; a player updating to 1.19.0 saw it, and the second try worked). After the wait the
; template's check runs as before: if the game is still open, it closes it or says why it cannot.
; A manual install does not wait: there the template asks the player to close the game.
!macro NSIS_HOOK_PREINSTALL
  !insertmacro PD_CHECK_FOLDER
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

; At the end of the Install section. Only when an update had to move the game to the recommended folder: in an update
; the template leaves the shortcuts alone, and they would still start the copy that could not be replaced (which would
; ask for the same update again). Point the ones that exist at the new copy.
!macro NSIS_HOOK_POSTINSTALL
  ${If} $PdFolderMoved == 1
  ${AndIf} $UpdateMode = 1
    ${If} ${FileExists} "$SMPROGRAMS\${PRODUCTNAME}.lnk"
      CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
      !ifmacrodef SetLnkAppUserModelId
        !insertmacro SetLnkAppUserModelId "$SMPROGRAMS\${PRODUCTNAME}.lnk"
      !endif
    ${EndIf}
    ${If} ${FileExists} "$DESKTOP\${PRODUCTNAME}.lnk"
      CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
      !ifmacrodef SetLnkAppUserModelId
        !insertmacro SetLnkAppUserModelId "$DESKTOP\${PRODUCTNAME}.lnk"
      !endif
    ${EndIf}
  ${EndIf}
!macroend
