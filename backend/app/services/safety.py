import os
import re
import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
import google.generativeai as genai
from .. import models

SAFETY_ENGINE_MODE = os.getenv("SAFETY_ENGINE_MODE", "demo")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def normalize_text(s: str) -> str:
    if not s:
        return ""
    return re.sub(r'[^a-z0-9]', '', s.lower())

def check_allergy_conflict(allergen: str, med_name: str, generic_name: str) -> Tuple[bool, str]:
    a_norm = normalize_text(allergen)
    m_norm = normalize_text(med_name)
    g_norm = normalize_text(generic_name)
    
    # Penicillin & Beta-lactam class relationships
    penicillins = ["penicillin", "amoxicillin", "ampicillin", "augmentin", "clavulanate", "piperacillin", "oxacillin"]
    if any(p in a_norm for p in ["penicillin", "betalactam"]):
        if any(p in m_norm or p in g_norm for p in penicillins):
            return True, f"Patient has documented {allergen} allergy. Prescribed {med_name} belongs to the penicillin/beta-lactam class and carries cross-reactivity risk."

    # Sulfa class relationships
    sulfas = ["sulfa", "sulfamethoxazole", "bactrim", "septra", "sulfasalazine"]
    if any(s in a_norm for s in ["sulfa", "sulfonamide"]):
        if any(s in m_norm or s in g_norm for s in sulfas):
            return True, f"Patient has documented {allergen} allergy. Prescribed {med_name} contains sulfonamide derivatives."

    # Direct name or generic substring match
    if a_norm and (a_norm in m_norm or a_norm in g_norm or m_norm in a_norm):
        return True, f"Patient has documented {allergen} allergy matching prescribed medication {med_name}."

    return False, ""

def analyze_safety_and_trends(patient_id: str, db: Session) -> List[Dict[str, Any]]:
    """
    Analyzes patient records for duplicate medications, allergy conflicts,
    medication interactions, and lab trends. Returns structured SafetyAlert dicts.
    """
    alerts = []
    
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        return []
        
    active_meds = [m for m in patient.medications if m.status == "active"]
    allergies = patient.allergies
    lab_results = patient.lab_results
    
    # 1. Duplicate Medication / Therapeutic Duplication Check
    seen_med_keys = {}
    for med in active_meds:
        key = normalize_text(med.generic_name or med.name)
        if key in seen_med_keys:
            other_med = seen_med_keys[key]
            same_dosage = normalize_text(med.dosage or "") == normalize_text(other_med.dosage or "")
            title = f"Exact Duplicate Prescription: {med.name}" if same_dosage else f"Therapeutic Duplication Detected: {med.name}"
            desc = f"Multiple active prescriptions for {med.name} ({med.dosage or 'N/A'} vs {other_med.dosage or 'N/A'}). Clinical review recommended."
            alerts.append({
                "severity": "review",
                "category": "DUPLICATE_MEDICATION",
                "title": title,
                "description": desc,
                "evidence": [
                    {"source_record_id": med.source_record_id, "reason": f"Active prescription: {med.name} ({med.dosage or 'N/A'})"},
                    {"source_record_id": other_med.source_record_id, "reason": f"Active prescription: {other_med.name} ({other_med.dosage or 'N/A'})"}
                ]
            })
        else:
            seen_med_keys[key] = med

    # 2. Allergy Conflict Check
    for allergy in allergies:
        for med in active_meds:
            is_conflict, reason_desc = check_allergy_conflict(allergy.allergen, med.name, med.generic_name or "")
            if is_conflict:
                severity = "high" if allergy.severity == "high" else "review"
                alerts.append({
                    "severity": severity,
                    "category": "ALLERGY_CONFLICT",
                    "title": f"Critical Allergy Conflict: {med.name}",
                    "description": reason_desc,
                    "evidence": [
                        {"source_record_id": med.source_record_id, "reason": f"New prescription: {med.name} ({med.dosage or 'N/A'})"},
                        {"source_record_id": allergy.source_record_id, "reason": f"Allergy record: {allergy.allergen} (Reaction: {allergy.reaction or 'documented'})"}
                    ]
                })

    # 3. Medication Interaction Check (Prototype DEMO Rules Engine)
    for i in range(len(active_meds)):
        for j in range(i + 1, len(active_meds)):
            m1, m2 = active_meds[i], active_meds[j]
            n1, n2 = m1.name.lower(), m2.name.lower()
            
            is_interaction = False
            desc = ""
            if ("metformin" in n1 and "amoxicillin" in n2) or ("metformin" in n2 and "amoxicillin" in n1):
                is_interaction = True
                desc = "Concurrent use of Amoxicillin and Metformin requires clinical monitoring. Antibiotic therapy can alter renal clearance or gastrointestinal tolerability of Metformin."
            elif ("metformin" in n1 and "ibuprofen" in n2) or ("metformin" in n2 and "ibuprofen" in n1):
                is_interaction = True
                desc = "NSAIDs like Ibuprofen can reduce renal perfusion, increasing the risk of Metformin-associated adverse reactions. Clinical review recommended."
                
            if is_interaction:
                alerts.append({
                    "severity": "review",
                    "category": "MEDICATION_INTERACTION",
                    "title": f"Medication Interaction: {m1.name} + {m2.name}",
                    "description": desc,
                    "evidence": [
                        {"source_record_id": m1.source_record_id, "reason": f"Active prescription: {m1.name}"},
                        {"source_record_id": m2.source_record_id, "reason": f"Active prescription: {m2.name}"}
                    ]
                })

    # 4. Lab Trend Calculation Engine
    tests = {}
    for result in lab_results:
        name_clean = result.test_name.strip()
        if name_clean not in tests:
            tests[name_clean] = []
        tests[name_clean].append(result)
        
    for test_name, results in tests.items():
        if len(results) >= 2:
            # Sort chronologically by date
            sorted_results = sorted(results, key=lambda r: r.test_date)
            latest = sorted_results[-1]
            earliest = sorted_results[0]
            
            try:
                latest_val = float(latest.value)
                earliest_val = float(earliest.value)
                
                if test_name.lower() == "hba1c" and latest_val > earliest_val:
                    diff = latest_val - earliest_val
                    if diff >= 0.5:
                        alerts.append({
                            "severity": "review",
                            "category": "LAB_TREND",
                            "title": f"Increasing {test_name} Trend Detected",
                            "description": f"Patient's {test_name} increased from {earliest_val}% to {latest_val}% over the monitoring period. Clinical review recommended.",
                            "evidence": [
                                {"source_record_id": latest.source_record_id, "reason": f"Recent reading: {latest.value}% on {latest.test_date}"},
                                {"source_record_id": earliest.source_record_id, "reason": f"Previous reading: {earliest.value}% on {earliest.test_date}"}
                            ]
                        })
            except ValueError:
                pass # Non-float lab test (e.g. BP string)

    # Optional AI contextual explanation using Gemini if configured
    for alert in alerts:
        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                prompt = f"""
                You are an explainable medical decision support AI.
                Contextualize the following deterministic safety alert for patient/doctor review:
                Title: {alert['title']}
                Category: {alert['category']}
                Evidence: {[ev['reason'] for ev in alert['evidence']]}

                Rules: Do not invent medical facts. Provide a 2-sentence clinical explanation.
                """
                resp = model.generate_content(prompt)
                alert["description"] = resp.text.strip()
            except Exception as e:
                print(f"Gemini safety explanation fallback: {e}")

    return alerts

def get_lab_trend_statistics(patient_id: str, db: Session) -> List[Dict[str, Any]]:
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        return []
        
    results = patient.lab_results
    tests = {}
    for r in results:
        if r.test_name not in tests:
            tests[r.test_name] = []
        tests[r.test_name].append(r)
        
    trends = []
    for test_name, test_results in tests.items():
        sorted_res = sorted(test_results, key=lambda x: x.test_date)
        latest = sorted_res[-1]
        
        direction = "stable"
        if len(sorted_res) >= 2:
            try:
                v_latest = float(latest.value)
                v_prev = float(sorted_res[-2].value)
                if v_latest > v_prev:
                    direction = "increasing"
                elif v_latest < v_prev:
                    direction = "decreasing"
            except ValueError:
                if "/" in latest.value and "/" in sorted_res[-2].value:
                    try:
                        sys_latest = float(latest.value.split("/")[0])
                        sys_prev = float(sorted_res[-2].value.split("/")[0])
                        if sys_latest > sys_prev + 5:
                            direction = "increasing"
                        elif sys_latest < sys_prev - 5:
                            direction = "decreasing"
                    except:
                        pass
                        
        chart_data = []
        for r in sorted_res:
            val = 0.0
            try:
                val = float(r.value)
            except ValueError:
                if "/" in r.value:
                    val = float(r.value.split("/")[0])
            
            try:
                dt = datetime.datetime.strptime(r.test_date, "%Y-%m-%d")
                date_str = dt.strftime("%b %Y")
            except:
                date_str = r.test_date
                
            chart_data.append({"date": date_str, "value": val})
            
        trends.append({
            "id": test_name.lower().replace(" ", "_"),
            "name": test_name,
            "unit": latest.unit or "",
            "current": latest.value,
            "date": latest.test_date,
            "trend": direction,
            "data": chart_data
        })
        
    return trends
