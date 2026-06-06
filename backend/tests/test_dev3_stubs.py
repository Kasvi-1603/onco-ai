"""Module smoke tests — all routers and services importable."""

import importlib
import inspect


def test_all_routers_mounted():
    mod = importlib.import_module("main")
    paths = {getattr(r, "path", "") for r in mod.app.routes}
    assert "/health" in paths
    assert "/api/demo" in paths or any("/api/demo" in str(r) for r in mod.app.routes)


def test_synthesizer():
    mod = importlib.import_module("agents.synthesizer")
    assert inspect.iscoroutinefunction(mod.synthesize)


def test_document_generator():
    mod = importlib.import_module("services.document_generator")
    assert inspect.iscoroutinefunction(mod.generate_documents)


def test_translation():
    mod = importlib.import_module("services.translation")
    assert inspect.iscoroutinefunction(mod.localize_for_patient)


def test_patient_router():
    mod = importlib.import_module("routers.patient")
    assert mod.router.prefix == "/api/patient"
