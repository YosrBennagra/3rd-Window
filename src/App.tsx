import React from 'react';
import WidgetHost from './components/WidgetHost';
import SettingsPanel from './components/SettingsPanel';
import './theme/global.css';

export default function App() {
  return (
    <div className="app">
      <WidgetHost />
      <SettingsPanel />
    </div>
  );
}
