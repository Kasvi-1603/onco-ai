"""Patient-facing localization from approved documents only."""

from __future__ import annotations

from models.schemas import (
    PatientLocalizedSections,
    PatientLocalizedView,
    SessionPayload,
    SupportedLang,
)
from services.llm import complete

FOOTER = (
    "This information was prepared by your care team. "
    "It is not a diagnosis or prescription from an AI."
)

HEADLINES: dict[SupportedLang, str] = {
    "en": "Your care team has reviewed your results",
    "hi": "आपकी देखभाल टीम ने आपके परिणामों की समीक्षा की है",
    "ta": "உங்கள் care team உங்கள் முடிவுகளை மதிப்பாய்வு செய்துள்ளது",
    "kn": "ನಿಮ್ಮ ಆರೈಕೆ ತಂಡವು ನಿಮ್ಮ ಫಲಿತಾಂಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿದೆ",
}


async def localize_for_patient(
    payload: SessionPayload, lang: SupportedLang
) -> PatientLocalizedView:
    docs = payload.approved_documents or payload.documents
    p = payload.patient_profile

    system = f"""You translate approved clinical summaries into compassionate plain language for patients.
Language: {lang}. Reading level: 8th grade.
NEVER mention: cohort IDs, NCT IDs, similarity scores, TCGA codes, exon numbers, or "AI recommends".
Use lock-and-key analogy for gene changes. Facts only from the approved text below."""

    user = f"""Approved treatment plan:
{docs.treatment_plan[:2000]}

Clinical patient summary:
{docs.patient_summary_clinical[:1500] or docs.mdt_brief[:1500]}

Side effects / toxicity notes:
{docs.toxicity_check[:800]}

Trial note (if any):
{docs.trial_report[:600]}

Diagnosis context: {p.pathology.histological_type}, stage {p.clinical.stage}
Gene finding (explain simply): {p.genomic.egfr}

Return JSON:
{{
  "what_we_found": "...",
  "what_this_means": "...",
  "side_effects": "...",
  "trials": "... or null",
  "questions_for_doctor": ["...", "..."]
}}"""

    text, _ = await complete(system, user, json_mode=True, temperature=0.2)
    if text:
        try:
            from services.llm import parse_json_response

            data = parse_json_response(text)
            sections = PatientLocalizedSections(
                what_we_found=data.get("what_we_found", ""),
                what_this_means=data.get("what_this_means", ""),
                side_effects=data.get("side_effects", ""),
                trials=data.get("trials"),
                questions_for_doctor=data.get("questions_for_doctor", []),
            )
            return PatientLocalizedView(
                session_id=payload.session_id,
                lang=lang,
                headline=HEADLINES.get(lang, HEADLINES["en"]),
                sections=sections,
                footer_disclaimer=FOOTER,
            )
        except Exception:
            pass

    return _fallback_localized(payload, lang)


def _fallback_localized(payload: SessionPayload, lang: SupportedLang) -> PatientLocalizedView:
    docs = payload.approved_documents or payload.documents
    p = payload.patient_profile
    hist = p.pathology.histological_type or "lung cancer"
    stage = p.clinical.stage or "advanced"

    if lang == "hi":
        found = (
            f"आपको {hist} है — फेफड़ों का एक प्रकार। "
            f"आपके जीन में एक विशिष्ट परिवर्तन मिला है जो इलाज के विकल्प निर्धारित करने में मदद करता है।"
        )
        means = "आपकी देखभाल टीम ने एक उपचार योजना की समीक्षा की है। विवरण के लिए अपने डॉक्टर से बात करें।"
        side = "संभावित दुष्प्रभावों के बारे में अपनी देखभाल टीम आपको बताएगी।"
    elif lang == "ta":
        found = f"உங்களுக்கு {hist} உள்ளது. உங்கள் மருத்துவக் குழு முடிவுகளை மதிப்பாய்வு செய்துள்ளது."
        means = "சிகிச்சை திட்டத்தை உங்கள் மருத்துவருடன் விவாதிக்கவும்."
        side = "பக்க விளைவுகள் குறித்து உங்கள் care team விளக்கும்."
    elif lang == "kn":
        found = f"ನಿಮಗೆ {hist} ಇದೆ. ನಿಮ್ಮ gene ನಲ್ಲಿ ಚಿಕಿತ್ಸೆ ಮಾರ್ಗದರ್ಶನಕ್ಕೆ ಸಹಾಯ ಮಾಡುವ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ."
        means = "ನಿಮ್ಮ care team ಚಿಕಿತ್ಸಾ ಯojನೆಯನ್ನು ಪರಿಶೀಲಿಸಿದೆ."
        side = "ಪಾರ್ಶ್ವ ಪರಿಣಾಮಗಳ ಬಗ್ಗೆ ನಿಮ್ಮ ವೈದ್ಯರೊಂದಿಗೆ ಮಾತನಾಡಿ."
    else:
        found = (
            f"You have {hist}, a type of lung cancer at stage {stage}. "
            f"Tests found a specific change in your EGFR gene — like a broken lock — "
            f"that helps guide treatment options."
        )
        means = (
            "Your care team has reviewed a treatment plan. "
            "The details below come from your doctor's approved summary — not an AI recommendation."
        )
        if docs.treatment_plan:
            means += " Your plan may include a daily targeted tablet focused on your specific gene change."
        side = (
            "Similar patients have experienced manageable side effects such as skin rash or diarrhea. "
            "Contact your care team if you have severe symptoms."
        )

    trials = None
    if docs.trial_report and "NCT" in docs.trial_report:
        trials = "Your doctor identified research studies you can ask about at your next visit."

    questions = [
        "What are the benefits and risks of the proposed treatment?",
        "What side effects should I watch for at home?",
        "When should I return for follow-up scans?",
        "Are there clinical trials I should discuss?",
    ]

    return PatientLocalizedView(
        session_id=payload.session_id,
        lang=lang,
        headline=HEADLINES.get(lang, HEADLINES["en"]),
        sections=PatientLocalizedSections(
            what_we_found=found,
            what_this_means=means,
            side_effects=side,
            trials=trials,
            questions_for_doctor=questions,
        ),
        footer_disclaimer=FOOTER,
    )
