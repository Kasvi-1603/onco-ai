"""Dev 3 — stubs not yet implemented (patient API, documents router, translation).

These tests document expected behaviour and will pass once implemented.
"""

from __future__ import annotations

import importlib
import inspect

import pytest


@pytest.mark.skip(reason="routers/patient.py not implemented yet — View 2 stretch")
def test_patient_api_returns_403_until_shared():
    pass


@pytest.mark.skip(reason="routers/documents.py not implemented yet")
def test_documents_save_endpoint():
    pass


@pytest.mark.skip(reason="services/translation.py not implemented yet")
def test_translation_localizes_approved_docs():
    pass


class TestDev3ModuleOwnership:
    """Sanity check: Dev 3 modules exist and expose expected entry points."""

    def test_synthesizer_has_synthesize(self):
        mod = importlib.import_module("agents.synthesizer")
        assert inspect.iscoroutinefunction(mod.synthesize)

    def test_document_generator_has_generate_documents(self):
        mod = importlib.import_module("services.document_generator")
        assert inspect.iscoroutinefunction(mod.generate_documents)

    def test_patient_router_is_stub(self):
        mod = importlib.import_module("routers.patient")
        assert "Owner: BE Dev 3" in (mod.__doc__ or "")

    def test_translation_is_stub(self):
        mod = importlib.import_module("services.translation")
        assert "Owner: BE Dev 3" in (mod.__doc__ or "")
