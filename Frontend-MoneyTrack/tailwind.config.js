// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Đảm bảo bạn có dòng này
  ],
  theme: {
    extend: {
      backgroundImage: {
        "splash-screen": "url('/assets/background.jpg')",
      },
      animation: {
        "slide-down": "slideDown 0.3s ease-out",
      },
      keyframes: {
        slideDown: {
          "0%": { transform: "translate(-50%, -100%)", opacity: "0" },
          "100%": { transform: "translate(-50%, 0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
