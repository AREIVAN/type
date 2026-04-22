import { create } from 'zustand';
import { AppSettings, getSettings as loadSettings, saveSettings as persistSettings } from '@/utils/storage';

interface SettingsState extends AppSettings {
  load: () => void;
  update: (settings: Partial<AppSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  textSize: 18,
  showVocabulary: true,
  soundEnabled: false,
  
  load: () => {
    const settings = loadSettings();
    set(settings);
  },
  
  update: (newSettings) => {
    persistSettings(newSettings);
    set({ ...get(), ...newSettings });
  },
  
  reset: () => {
    const defaultSettings: AppSettings = {
      textSize: 18,
      showVocabulary: true,
      soundEnabled: false,
    };
    persistSettings(defaultSettings);
    set(defaultSettings);
  },
}));