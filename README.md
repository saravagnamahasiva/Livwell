# 🌍 LivWell – Smart Livability Index

LivWell is an AI-powered web application that predicts whether a location is suitable for living using environmental data, nearby facilities, machine learning, and recommendations for better nearby areas.

It is designed for **citizens**, **urban planners**, and **hackathon-level smart city decision systems**.

---

## 🚀 Features

- 📍 Interactive Google Maps Integration (Click / Search places)
- 🔎 Autocomplete Place Search (Google Places Autocomplete)
- 🌫️ Real-time Air Quality Index (AQI) using OpenWeather API
- 🏥 Nearby Facilities (Hospitals, Schools, Stores using Google Places API)
- 🤖 Machine Learning Livability Prediction (Random Forest)
- 📊 City-level Environmental & Infrastructure Analysis
- 🌟 Nearby Good Areas Recommendation
  - Suggests nearby locations within the same state that are predicted as more livable
- ✨ Apple-like Glassmorphism UI
  - Frosted glass cards + smooth gradients + premium modern look
- 🖥️ Responsive Layout (Fixed map + scrollable insights panel)

---

## 🧠 Technologies Used

- Python (Flask)
- Scikit-learn (Random Forest Classifier)
- Pandas & NumPy
- Google Maps API (Maps + Places + Autocomplete)
- OpenWeather API (AQI)
- HTML, CSS, JavaScript, Bootstrap

---

## 📂 Project Structure

```bash
livewell/
│
├── app.py
├── model.pkl
├── final_dataset.csv
├── requirements.txt
├── Procfile
├── README.md
├── .gitignore
│
├── templates/
│   ├── layout.html
│   └── index.html
│
└── static/
    ├── css/
    │   └── style.css
    │
    ├── js/
    │   ├── map.js
    │   └── streetview.js
    │
    └── assets/
        └── livwelllogo.png
```

---

# 🛠️ How to Run the Project in VS Code

Follow these steps carefully:

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/livewell.git
cd livewell
```

---

## 2️⃣ Create Virtual Environment

```bash
python -m venv venv
```
This creates a folder called `venv`.

---

## 3️⃣ Activate Virtual Environment

### 🪟 Windows (PowerShell)

```bash
venv\Scripts\Activate.ps1
```

### 🪟 Windows (CMD)

```bash
venv\Scripts\activate.bat
```

### 🍎 Mac/Linux

```bash
source venv/bin/activate
```

After activation, you should see `(venv)` in your terminal.

---

## 4️⃣ Install Required Libraries

```bash
pip install -r requirements.txt
```

---

## 5️⃣ Add API Keys (Environment Variables – Recommended)

### 🪟 Windows PowerShell

```bash
$env:GOOGLE_MAPS_API_KEY="YOUR_KEY"
$env:OPENWEATHER_API_KEY="YOUR_KEY"
```

### 🍎 Mac/Linux

```bash
export GOOGLE_MAPS_API_KEY="YOUR_KEY"
export OPENWEATHER_API_KEY="YOUR_KEY"
```

This keeps your keys safe and avoids uploading them to GitHub.

---

## 6️⃣ Run the Application

```bash
python app.py
```

You should see:

```
Running on http://127.0.0.1:5000
```

---

## 7️⃣ Open in Browser

Open:

```
http://127.0.0.1:5000
```

Your application will run successfully 🎉

---

## ⚠️ Important Notes

- Ensure `model.pkl` exists in the root directory.
- Do NOT upload `venv/` folder to GitHub.
- API keys must be set before running.
- Nearby Good Areas are based on dataset/model predictions (recommended areas may differ from real-time AQI facilities).

---

## 👨‍💻 Developed By

**Team Viveka**

- G. Ritvik  
- M. Sarvagna  
- K. Laxmi Lavanya  
- M.K.V.V. Vinay  

National Level Hackathon Project