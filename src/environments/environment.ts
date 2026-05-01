type RuntimeAppConfig = {
  apiBaseUrl?: string;
};

declare global {
  interface Window {
    __CONTROL_PANEL_CONFIG__?: RuntimeAppConfig;
  }
}

function resolveApiBaseUrl(): string {
  const runtimeValue = window.__CONTROL_PANEL_CONFIG__?.apiBaseUrl?.trim();
  if (runtimeValue) {
    return runtimeValue.replace(/\/$/, '');
  }

  const currentHostname = window.location.hostname?.trim();
  if (currentHostname && currentHostname !== 'localhost' && currentHostname !== '127.0.0.1') {
    return `http://${currentHostname}:3001`;
  }

  return 'http://localhost:3001';
}

export const environment = {
  production: false,
  apiBaseUrl: resolveApiBaseUrl(),
};
