import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import warnings
warnings.filterwarnings('ignore')

# Load dataset
df = pd.read_csv("final_dataset.csv")

# Encode categorical variables
label_encoders = {}
categorical_cols = ['State', 'City', 'Soil Type', 'Livability Label']
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    label_encoders[col] = le

# Features and target
X = df.drop(['Livability Label', 'Area ID'], axis=1)
y = df['Livability Label']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train Random Forest
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model & encoders
joblib.dump((model, label_encoders, categorical_cols), "model.pkl")

print("✅ Model trained and saved as model.pkl")
