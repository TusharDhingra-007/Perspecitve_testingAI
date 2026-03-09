# Perspective Testing AI
## 🚀 Overview

Perspective Testing AI is a concept-driven project that extends traditional software testing beyond functionality.

Instead of only checking whether a feature works, this system evaluates how the interface feels to different types of users.

Our goal is to detect user confusion in a software interface based on audience perspective.

## 🎯 Problem Statement

Software may work perfectly — no bugs, no crashes — but users can still feel confused or frustrated.

Traditional testing asks:

“Does it work?”

Perspective Testing asks:

“Does it feel right for this specific user?”

Different audiences experience the same interface differently.
For example:

Finance users prefer detailed data and drill-down options.

Management prefers summary dashboards and visual insights.

Our system aims to detect confusion based on such differences.

## 💡 Solution Concept

We introduce an AI Intermediary Model inside the testing phase.

How It Works:

The developer/tester selects an audience type.

The AI model activates according to that selected audience.

The model analyzes the interface behavior.

It calculates a Confusion Score.

The results are displayed in a dashboard.

This helps identify UI problems before real users face them.

## 🧠 Proof of Concept (POC)

For our initial implementation, we focus on detecting confusion using measurable interface behavior metrics.

We analyze:

* Number of clicks

* Task completion time

* Backtracks

* Rage clicks

* Hover time

* Interaction patterns

The AI model predicts a Satisfaction Score, which is converted into a:

Confusion Score = 100 - Satisfaction Score

This allows us to quantify user friction in a structured way.

## 🔍 Example Scenario

If an interface uses very light contrast:

For older users → AI may flag it as a problem due to weaker eyesight.

For younger users → AI may not flag it as a major issue.

Same interface.
Different audience.
Different result.

## 🏗️ Project Structure

app.py → Flask API exposing prediction endpoint

predict_satisfaction.py → Standalone prediction script

xgb_satisfaction_model.pkl → Trained XGBoost model bundle

Frontend dashboard → Displays confusion results

## 🖥️ API Endpoint
POST /predict

Input JSON:

{
  "backtracks": 11,
  "click_count": 7,
  "form_errors": 0,
  "hover_time": 0.8,
  "rage_clicks": 0,
  "task_time": 55
}

Response:

{
  "confusion_score": 42.3,
  "satisfaction_score": 57.7
}
## 📊 Future Vision

Currently, the model focuses on confusion detection.

In future versions, we aim to:

Train audience-specific models (Finance, IT, Management)

Include visual contrast detection

Add accessibility-based evaluation

Integrate real-time UX analytics

Build a plug-in framework for SDLC integration

## 🖼️ Visual Demonstration
* Proof of Concept (POC)

<img width="348" height="362" alt="image" src="https://github.com/user-attachments/assets/764eb204-6cca-4224-879e-ff4a299334ca" />

* Actual Idea – Plug-In Model Architecture

<img width="880" height="611" alt="image" src="https://github.com/user-attachments/assets/66e4c28e-16cf-44f6-8155-613244170da9" />

## 🛠️ Tech Stack

* Python

* Flask

* XGBoost

* Pandas / NumPy

* Frontend (HTML/CSS/JS)

* Firebase (optional integration)

## 🖥️ Steps to Run the Project Locally

* Clone the repository

* Install Python 3.9+ and pip

* Create and activate a virtual environment

* Install required Python packages (flask, flask-cors, numpy, pandas, scikit-learn, xgboost)

* Place xgb_satisfaction_model.pkl in the same folder as app.py

* Run the backend using python app.py

* Create a Firebase project and enable Firestore

* Copy Firebase web configuration keys

* Create js/env.js from env.example.js and add Firebase config with apiBaseUrl = http://localhost:5000

* Run the frontend using Live Server or python -m http.server 8000

* Open the browser and test the application locally

## 👨‍💻 Working Demo

<img width="1888" height="815" alt="image" src="https://github.com/user-attachments/assets/130a188b-debb-4e4c-9aae-f72c98e2300b" />

<img width="1889" height="824" alt="image" src="https://github.com/user-attachments/assets/bd1b68b4-f4ab-493c-a6f8-1d65ff9867c9" />

## 👥 Team

Team Name: Code Warriors

Members:

Arpan Kumar

Birakishore Nayak

Tushar Dhingra

Varun Thakur

Jatin Sharma

## 📌 Final Thought

Software should not just function correctly.

It should feel right for the user.

Perspective Testing AI is a step toward measurable, audience-aware software quality.
