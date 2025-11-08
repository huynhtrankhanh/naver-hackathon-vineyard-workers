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
    },
  },
  plugins: [],
};
