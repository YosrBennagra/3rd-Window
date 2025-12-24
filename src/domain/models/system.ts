export interface SystemTemperatures {
  cpu_temp: number | null;
  gpu_temp: number | null;
  cpu_usage: number;
  available_sensors: string[];
}

export interface Monitor {
  identifier?: string | null;
  name: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  is_primary: boolean;
  scale_factor?: number; // DPI scale factor (1.0 = 100%, 1.5 = 150%, etc.)
  refresh_rate?: number | null; // Hz (e.g., 60, 144, 240)
}

export interface AppSettings {
  isFullscreen: boolean;
  selectedMonitor: number;
}
