"""Seed historical_cohorts from mock_data/cohorts.json."""

from db.database import seed_if_empty


def run() -> None:
    seed_if_empty()


if __name__ == "__main__":
    from db.database import init_db

    init_db()
    run()
    print("Cohorts seeded (if empty).")
