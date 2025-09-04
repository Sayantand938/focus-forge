// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use log::info;
use tauri::Manager; // ✅ Needed for get_webview_window
use tauri_plugin_log::{Target, TargetKind}; // so you can log from Rust too

#[tauri::command]
fn greet(name: &str) -> String {
    info!("Greet command called with name: {}", name); // example Rust log
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        // ✅ Single instance plugin must be FIRST
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            // Log when a second instance is attempted
            info!(
                "Second instance attempted. Args: {:?}, CWD: {:?}",
                args, cwd
            );

            // Try to focus the main window if it exists
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_notification::init())
        // ✅ Logging plugin config
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(Target::new(TargetKind::LogDir {
                    file_name: Some("focus-forge.log".into()), // log file name
                }))
                .max_file_size(50_000) // Optional: limit file size
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll) // keep old logs
                .level(log::LevelFilter::Info) // only info+warn+error
                .build(),
        )
        // Other plugins
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        // Commands
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
