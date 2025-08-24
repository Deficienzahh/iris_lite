/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colori cyan ottimizzati per il CoreStatus
        'cyan-400': '#22d3ee', // Questo è l'irisBlue originale
        'cyan-500': '#06b6d4', // Un ciano leggermente più scuro per il core
        'cyan-600': '#0891b2',
        'cyan-700': '#0e7490',
        'cyan-800': '#155e75',
        'cyan-300': '#67e8f9', // Questo è l'irisBlueLight originale
        'cyan-200': '#a5f3fc', // Una tonalità ancora più chiara per coerenza
      },
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
      },
      animation: {
        // Animazioni per il CoreStatus
        'spin-slow': 'spin-slow 8s linear infinite',
        'spin-reverse': 'spin-reverse 12s linear infinite',
        'pulse-stronger': 'pulse-stronger 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'expand-fade': 'expand-fade 4s ease-out infinite',
        
        // Animazioni esistenti mantenute
        'pulse-grow': 'pulseGrow 1.2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out infinite',
        'spin': 'spin 1s linear infinite', // Spin normale di Tailwind
      },
      keyframes: {
        // Keyframes per il CoreStatus
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'pulse-stronger': {
          '0%, 100%': { 
            opacity: '0.5',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.8',
            transform: 'scale(1.05)'
          },
        },
        'pulse-slow': {
          '0%, 100%': { 
            opacity: '0.3',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.6',
            transform: 'scale(1.02)'
          },
        },
        'ping-slow': {
          '0%': {
            transform: 'scale(1)',
            opacity: '1'
          },
          '75%, 100%': {
            transform: 'scale(1.2)',
            opacity: '0',
          },
        },
        'expand-fade': {
          '0%': { 
            transform: 'scale(0.8)', 
            opacity: '0.3' 
          },
          '50%': { 
            transform: 'scale(1.1)', 
            opacity: '0.1' 
          },
          '100%': { 
            transform: 'scale(1.3)', 
            opacity: '0' 
          },
        },
        
        // Keyframes esistenti mantenuti
        pulseGrow: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-3px)' },
          '75%': { transform: 'translateX(3px)' },
        }
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};