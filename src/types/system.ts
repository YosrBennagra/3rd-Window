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
}

export interface AppSettings {
  isFullscreen: boolean;
  selectedMonitor: number;
}
