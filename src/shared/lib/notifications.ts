// src/shared/lib/notifications.ts
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { toast } from "sonner";

/**
 * A utility function to check for notification permissions and send a notification.
 * Handles requesting permission if not already granted.
 * @param {string | { title: string; body?: string; icon?: string }} options - The notification options.
 */
export async function showNotification(
  options: string | { title: string; body?: string; icon?: string }
) {
  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      console.log("[Notifications] Permission not granted, requesting...");
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    if (permissionGranted) {
      console.log("[Notifications] Sending notification:", options);
      sendNotification(options);
    } else {
      console.warn("[Notifications] Permission denied. Cannot send notification.");
    }
  } catch (error) {
    console.error("[Notifications] Failed to send notification:", error);
    // Fallback to a toast if the native API fails for some reason
    const title = typeof options === 'string' ? options : options.title;
    const body = typeof options === 'string' ? undefined : options.body;
    toast.error("Could not send desktop notification.", { description: `${title}${body ? `: ${body}` : ''}` });
  }
}