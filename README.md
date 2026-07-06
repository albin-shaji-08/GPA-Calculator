# ⚡ GPA & CGPA Calculator

> Developed for **COSC HackWeek 2026** by **[Albin Shaji](https://github.com/albin-shaji-08)**

---

<!-- Animated Neo-Brutalist Banner -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="100%" height="auto">
  <rect x="5" y="5" width="790" height="190" fill="#FAF6EE" stroke="#000" stroke-width="4" />
  <rect x="11" y="11" width="790" height="190" fill="none" stroke="#000" stroke-width="4" />
  <rect x="5" y="5" width="790" height="20" fill="#FFDE4D" stroke="#000" stroke-width="4" />
  <text x="40" y="110" font-family="'Impact', 'Arial Black', sans-serif" font-size="48" fill="#000" letter-spacing="2">GPA CALCULATOR</text>
  <text x="40" y="150" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#000">&gt;_ HACKWEEK_2026 // PORTFOLIO_EDITION</text>
  <circle cx="740" cy="110" r="10" fill="#F87171" stroke="#000" stroke-width="3" />
</svg>

---

### 🚀 Console Links & Metadata

- **Live Tracker Console**: [View Live Demo](https://your-live-demo-url.com) ⚡
- **Aesthetic Standard**: Neo-Brutalism (high contrast, solid drop shadows, raw layout)
- **GPA Scale Config**: Standard 4.0, 5.0, 10.0 + Custom scale unlocks

---

## 📸 System Screenshots

|                                                 📡 Dashboard View                                                 |                                             📝 Semester Grade Sheets                                              |
| :---------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------: |
| ![Dashboard Screenshot](https://raw.githubusercontent.com/albin-shaji-08/GPACalculator/main/assets/dashboard.png) | ![Semesters Screenshot](https://raw.githubusercontent.com/albin-shaji-08/GPACalculator/main/assets/semesters.png) |

|                                                 🔮 Goal Simulator                                                 |                                             ⚙️ Scale Configurator                                             |
| :---------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------: |
| ![Simulator Screenshot](https://raw.githubusercontent.com/albin-shaji-08/GPACalculator/main/assets/simulator.png) | ![Grading Screenshot](https://raw.githubusercontent.com/albin-shaji-08/GPACalculator/main/assets/grading.png) |

---

## 🛠️ Key Features

- **Real-time GPA & CGPA Math**: Instantly updates your overall metrics as credit hours or grades are adjusted.
- **GPA Progression Chart**: Visually trace semester-by-semester performance on a high-contrast bar chart.
- **Goal-based "What-If" Planner**: Compute the exact target GPA and average grades required in your remaining semesters to hit your graduation CGPA goals.
- **Future Projections Simulator**: Hypothetically simulate upcoming semesters to forecast long-term grade trajectories.
- **Flexible Scale Customizer**:
  - Switch instantly between **4.0**, **5.0**, and **10.0** scale presets.
  - Dynamically display dynamic **CGPA Division Classes** (_Distinction_, _First Class_, _Second Class_).
  - Activate **Custom Scale** to unlock table cell editing, description tweaks, and new custom grade rows.
- **Clean B&W PDF Reports**: Generate and print paper-saving, high-quality semester grade reports with a single click.
- **LocalStorage Sync**: Keep your academic data saved locally in your browser automatically.

---

## 💻 Tech Stack

- **Structure**: Semantic HTML5 DOM
- **Styling**: Vanilla CSS3 (Custom Neo-brutalist variables & `@keyframes` animations)
- **Logic**: Pure ES6+ JavaScript (State management, SVG chart renderer, print engines)
- **Icons**: Inline SVGs & Lucide Icon set

---

## ⚙️ Local Setup Console

1. **Clone the repository:**

   ```bash
   git clone https://github.com/albin-shaji-08/GPACalculator.git
   cd GPACalculator
   ```

2. **Launch server:**

   ```bash
   # Python (Built-in)
   python -m http.server 8000
   ```

3. Open **`http://localhost:8000/index.html`** in your browser.
