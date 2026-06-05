import asyncio
import json
import aiosqlite
from pathlib import Path
from backend.config import settings

async def seed_cohorts():
    data_path = Path(__file__).parent / "mock_data" / "cohorts.json"
    cohorts = json.loads(data_path.read_text())

    async with aiosqlite.connect(settings.database_url) as db:
        for c in cohorts:
            await db.execute("""
                INSERT OR IGNORE INTO historical_cohorts
                (cohort_id, cancer_subtype, primary_mutation, stage, pd_l1_percent,
                 age, sex, smoking, ecog, pathology_summary, treatment_given,
                 outcome_os_months, outcome_pfs_months, clinical_outcome,
                 toxicity_profile, raw_json)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                c["cohort_id"], c["cancer_subtype"], c["primary_mutation"],
                c["stage"], c.get("pd_l1_percent"), c["age"], c["sex"],
                c["smoking"], c["ecog"], c["pathology_summary"],
                c["treatment_given"], c["outcome_os_months"],
                c["outcome_pfs_months"], c["clinical_outcome"],
                c["toxicity_profile"], json.dumps(c)
            ))
        await db.commit()
    print(f"Seeded {len(cohorts)} cohorts.")