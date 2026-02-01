#  Smart Livability Index using Geospatial & Environmental Data

##  Overview
Smart Livability Index is an AI-powered system that predicts whether a given area is **Good for Living** or **Not Suitable for Living** by combining multiple real-world environmental and geospatial datasets.

Unlike traditional city ranking systems, this project provides **area-level insights** and actionable details to support better living and planning decisions.

---

##  Problem Statement
Choosing a healthy and sustainable place to live is difficult due to scattered and complex data such as pollution, water quality, population density, and industrial impact.

This project solves that by integrating these factors into a **single intelligent livability prediction system**.

---

##  Solution Approach
The system uses a **Random Forest Machine Learning model** trained on environmental and infrastructural features to classify livability.

### Key Parameters Used:
-  Air Quality Index (AQI)
-  Water Quality Index (WQI)
-  Population Density
-  Proximity to Industrial Areas
-  Pollution Levels
-  Cost of Living
-  Availability of Essential Facilities

---

##  Classification Output
Each area is classified as:
-  **Good for Living**
- **Not Suitable for Living**

If classified as *Good for Living*, the system also displays:
- Cost of living estimates
- Nearby essential places (schools, hospitals, grocery stores, temples, etc.)
- Environmental quality scores (AQI & WQI)
- Area images (if available)

---

##  Model Details
- **Algorithm:** Random Forest Classifier
- **Accuracy:** ~93%
- **Why Random Forest?**
  - Handles mixed data well
  - Robust to noise
  - High accuracy on tabular datasets

---

##  Unique Features
- Neighborhood-level livability analysis
- Combines environmental, social, and infrastructure data
- User-friendly and interpretable output
- Fuzzy city name matching for better usability
- Hackathon-ready real-world AI + data visualization project

---

##  Real-World Impact
- Helps citizens choose healthier places to live
- Assists urban planners in identifying weak zones
- Encourages data-driven urban sustainability decisions

---

## Data Sources
- OpenAQ (Air Quality)
- Water Quality Datasets (Kaggle / Global Sources)
- WorldPop (Population Density)
- OpenStreetMap (Industrial & Facility Data)
- Numbeo (Cost of Living)

---

## Tech Stack
- Python
- Pandas, NumPy
- Scikit-learn
- Random Forest ML Model
- Geospatial APIs
- Data Visualization Tools

---

##  Future Enhancements
- Live AQI & WQI API integration
- Interactive map-based visualization
- Explainable AI (SHAP values)
- Web deployment using Flask / FastAPI
- Real-time livability score updates

---

##  Use Case
Designed for **hackathons**, **urban planning research**, and **AI-based decision support systems**.

---

## 📄 License
This project is open-source and intended for educational and research purposes.
