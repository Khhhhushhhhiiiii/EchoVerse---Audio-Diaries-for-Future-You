/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx,css}", // Scans all JS/TS files in src for Tailwind classes
    ],
    theme: {
      extend: {
        // Here you can extend Tailwind's default theme
        // For example, add custom colors, spacing, fonts, etc.
        colors: {
          primary: '#3b82f6', // Tailwind blue-500 as a custom color
        },
        fontFamily: {
          // Custom font family extending default
          sans: ['Roboto', 'sans-serif'],
        },
      },
    },
    plugins: [
      // Add Tailwind plugins here if needed
    ],
  }
  