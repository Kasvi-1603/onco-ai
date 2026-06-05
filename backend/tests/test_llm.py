"""Dev 3 — LLM helper tests used by synthesizer and document generator."""

from __future__ import annotations

import json

import pytest

from services.llm import parse_json_response


class TestParseJsonResponse:
    def test_plain_json(self):
        data = parse_json_response('{"cohort_comparison": "test"}')
        assert data["cohort_comparison"] == "test"

    def test_markdown_fenced_json(self):
        raw = '```json\n{"trial_justifications": []}\n```'
        data = parse_json_response(raw)
        assert data["trial_justifications"] == []

    def test_agent2_shape_validates(self):
        from models.schemas import Agent2Output

        raw = json.dumps(
            {
                "trial_justifications": [{"nct_id": "NCT1", "rationale": "x", "matched_criteria": []}],
                "cohort_comparison": "SYN-001 match",
                "toxicity_warnings": [],
                "clinical_question_suggestion": "Review options?",
            }
        )
        out = Agent2Output.model_validate(parse_json_response(raw))
        assert out.trial_justifications[0].nct_id == "NCT1"
