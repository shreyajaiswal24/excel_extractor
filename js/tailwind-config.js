// Shared Tailwind config for the Play CDN.
// Must be loaded AFTER the Tailwind Play CDN script tag.
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        status: {
          pass: "#16a34a",
          passBg: "#dcfce7",
          fail: "#dc2626",
          failBg: "#fee2e2",
          na: "#6b7280",
          naBg: "#f3f4f6",
          defect: "#d97706",
          defectBg: "#fef3c7",
          total: "#0284c7",
          totalBg: "#e0f2fe",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(14, 165, 233, 0.08)",
        card: "0 2px 12px -2px rgba(2, 132, 199, 0.06)",
      },
    },
  },
};
