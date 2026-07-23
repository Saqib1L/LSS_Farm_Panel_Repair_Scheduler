![GitHub stars](https://img.shields.io/github/stars/Saqib1L/LSS_Farm_Panel_Repair_Scheduler)
![GitHub contributors](https://img.shields.io/github/contributors/Saqib1L/LSS_Farm_Panel_Repair_Scheduler)
![GitHub forks](https://img.shields.io/github/forks/Saqib1L/LSS_Farm_Panel_Repair_Scheduler)
![GitHub license](https://img.shields.io/github/license/username/repo)
# LLS Farm Panel Repair Scheduler
> Large Scale Solar (LSS) Farms in Malaysia contain hundreds of thousands of photovoltaic (PV) panels spread over large areas. An example includes the TNB Sepang Solar farm which features 238,140 panels among many other LSS Farms in Malaysia. These panels continuously generate electricity and periodically report operational metrics such as efficiency and power output to a monitoring system. 

> Due to environmental factors such as dust accumulation, high temperature, humidity, ageing, and/or equipment faults, many panels begin to lose efficiency and produce less electricity per duration than optimal. If these degraded panels are not identified and repaired on time, they continue to lose efficiency over time and the farm experiences significant energy production losses that could’ve been readily avoided.

> For this project, a LSS Farm containing 200,000 panels is simulated. Each panel periodically reports its efficiency and the system automatically classifies its condition into one of four levels of severity.


| Efficiency (%) | Status | Maintenance Priority |
| --- | --- | --- |
| ≥ 90% | Healthy | None |
| 75% - 89.9% | Minor Degradation | Low | 
| 60% – 74.9% | Moderate Degradation | Medium | 
| < 60% | Severe Degradation | High |


> The objective is to process incoming panel readings, identify degraded panels in real time, and help maintenance teams prioritise panel repairs based on severity. 

The following represents illustrative assumptions to quantify business impact:


| Efficiency | Severity | Estimated Daily Production Loss | 
| --- | --- | --- | 
| ≥ 90% | Healthy | RM 0.00 per Day per Panel | 
| 75% - 89.9% | Minor Degradation | RM 0.50 per Day per Panel | 
|60% – 74.9% | Moderate Degradation | RM 2.00 per Day per Panel|
|< 60% | Severe Degradation | RM 5.00 per Day per Panel | 


---

## 📖 Table of Contents

- About
- Features
- Screenshots
- Demo
- Tech Stack
- Project Structure
- Installation
- Authors
- References

---

# 📌 About

---

# ✨ Features
1. Load / Generate Sensor Dataset (200,000 panels);
2. Start Real-Time Monitoring System;
3. Search Panel by ID;
4. View Top-K Worst Panels (Maintenance Priority)
5. View Fault Summary Statistics

---

# 🖼️ Screenshots

| Home | Dashboard |
|------|-----------|
| ![](images/home.png) | ![](images/dashboard.png) |

You can also include GIFs.

---

# 🎥 Demo

Video Demo

https://youtu.be/xxxxx

---

# 🛠️ Tech Stack

### Frontend

- HTML
- CSS
- Vanilla JS

### Backend

- Node.js
- Express

### Data Storage

- JSON

---

# 📂 Project Structure

```text
LSS_FARM_PANEL_Repair_Scheduler/
├── node_modules/
├── public/
│   ├── index.html
│   ├── render.js
│   └── style.css
├── scripts/
│   ├── dataGenScript.js
│   ├── deleteData.js
│   ├── PanelSimulation.js
│   ├── rankPanel.js
│   ├── server.js
│   └── statistics.js
├── sources/
│   ├── data.json
│   ├── main_queue.json
│   └── statistics.json
├── .gitattributes
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/Saqib1L/LSS_Farm_Panel_Repair_Scheduler.git
```

Go into the folder

```bash
cd LSS_Farm_Panel_Repair_Scheduler
```

Install dependencies

```bash
npm install
```
Generate dummy data

```bash
npm run restart-data
```

Start the server

```bash
npm run start-all
```

---

# 👤 Authors

**1. Muhammad Saqib (24009307)**

**2. Ananda Adiputra (24006462)**

**3. Dzikra Ahmad Rizaldi Nurfadillah (25013332)**

**4. Muhammad Affan Bimo Aristyo Putro (24009980)**

**5. Jade Brochard (26006896)**

# 🔍 References
[1] Eco-Business, “TNB subsidiary partners with Envision Digital to digitalise operations of its largest solar power project in Malaysia,” Eco-Business, May 2020. https://www.eco-business.com/press-releases/tnb-subsidiary-partners-with-envision-digital-to-digitalise-operations-of-its-largest-solar-power-project-in-malaysia/ (accessed Jun. 24, 2026).
