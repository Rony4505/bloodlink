/** Marker endpoint when the browser granted Notification permission but PushManager is unavailable (e.g. iPhone Safari tab). */
export const LOCAL_PUSH_PERMISSION_PREFIX = "local-permission://";

export function isPermissionOnlyEndpoint(endpoint: string | undefined | null): boolean {
  return Boolean(endpoint?.startsWith(LOCAL_PUSH_PERMISSION_PREFIX));
}

export function isRealPushEndpoint(endpoint: string | undefined | null): boolean {
  return Boolean(endpoint && !isPermissionOnlyEndpoint(endpoint));
}
