import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

const Preset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '#fefce8',
      100: '#fef08a',
      200: '#fde047',
      300: '#facc15',
      400: '#eab308',
      500: '#ca8a04',
      600: '#a16207',
      700: '#854d0e',
      800: '#713f12',
      900: '#422006',
      950: '#1c1917',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#0b1120',
    },
  },
});

export default Preset;
