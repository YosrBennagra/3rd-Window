# Data Contracts (Draft)

## Widget Definition
```ts
interface WidgetDefinition {
  id: string;
  title: string;
  component: string; // component key
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  propsSchema?: object;
}
```

## Alert
```ts
interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  source: string;
  createdAt: number;
  acknowledged?: boolean;
}
```

## Settings
```ts
interface Settings {
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'cozy';
  widgets: WidgetInstance[];
  alertRules: AlertRule[];
}
```
