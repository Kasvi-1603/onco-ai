"""Seed knowledge_snippets from mock_data/knowledge.json."""

from db.database import seed_if_empty


def run() -> None:
    seed_if_empty()


if __name__ == "__main__":
    from db.database import init_db

    init_db()
    run()
    print("Knowledge snippets seeded (if empty).")
