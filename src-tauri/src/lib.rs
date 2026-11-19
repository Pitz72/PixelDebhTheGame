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
    let builder = tauri::Builder::default();

    // One copy of the game at a time (Windows). Two copies each keep the save as it was when they started and write
    // the whole file again when they close: the one closed last would put its old data back over the game just
    // played (and both would play their music). Starting the game a second time brings the first one to the front.
    // It has to be the first plugin.
    #[cfg(target_os = "windows")]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        use tauri::Manager;
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));

    builder
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
