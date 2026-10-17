/// How this copy of the game was installed. It decides what the update notice offers: an installed copy
/// can replace itself, a portable one (or one from a distribution package) can only be told that there
/// is something new and be pointed at the download.
///
/// * `installer`: Windows, put there by the setup program (it leaves `uninstall.exe` next to the game).
/// * `appimage`: Linux AppImage (it can replace its own file).
/// * `portable`: Windows, the bare exe; `package`: Linux .deb / .rpm (the package manager updates those).
#[tauri::command]
fn install_kind() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        let installed = std::env::current_exe()
            .ok()
            .and_then(|exe| exe.parent().map(|dir| dir.join("uninstall.exe").exists()))
            .unwrap_or(false);
        if installed {
            "installer"
        } else {
            "portable"
        }
    }
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("APPIMAGE").is_some() {
            "appimage"
        } else {
            "package"
        }
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        "other"
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Key/value store in the app data directory: high scores and settings.
        .plugin(tauri_plugin_store::Builder::new().build())
        // Restart after an update, and open the release page in the browser.
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Self-update from the GitHub releases (see `plugins.updater` in tauri.conf.json).
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            let _ = app; // keeps the closure argument used on platforms without the updater
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![install_kind])
        .run(tauri::generate_context!())
        .expect("error while running PixelDebh Retro-Rescue");
}
