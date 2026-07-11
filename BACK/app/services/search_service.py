from database import get_connection
from queries.search_queries import (
    GET_DRUG_ID,
    GET_DRUG_ID_PARTIAL,
    GET_DRUG_SUGGESTIONS,
    GET_DRUG_ANALYTICS,
)


def get_drug_statistics(drug_name: str):
    """
    Find a drug by name (exact first, then partial ILIKE),
    then return its price + availability analytics.
    """
    conn = get_connection()
    cur  = conn.cursor()

    try:
        # 1. Exact match
        cur.execute(GET_DRUG_ID, (drug_name,))
        drug = cur.fetchone()

        # 2. Partial match fallback
        if drug is None:
            starts_with = f"{drug_name}%"
            anywhere    = f"%{drug_name}%"
            cur.execute(GET_DRUG_ID_PARTIAL, (anywhere, starts_with))
            drug = cur.fetchone()

        if drug is None:
            return None

        drug_id      = drug["drug_id"]
        matched_name = drug["name"]   # use the DB name (correct casing/full name)

        cur.execute(GET_DRUG_ANALYTICS, (drug_id,))
        result = cur.fetchone()

        return {
            "drug_name": matched_name,
            "drug_id":   drug_id,
            "statistics": result,
        }

    finally:
        cur.close()
        conn.close()


def get_drug_suggestions(query: str) -> list:
    """
    Return up to 10 drug name suggestions for autocomplete.
    """
    if not query or len(query.strip()) < 2:
        return []

    conn = get_connection()
    cur  = conn.cursor()

    try:
        starts_with = f"{query}%"
        anywhere    = f"%{query}%"
        cur.execute(GET_DRUG_SUGGESTIONS, (anywhere, starts_with))
        rows = cur.fetchall()
        return [{"drug_id": r["drug_id"], "name": r["name"]} for r in rows]

    finally:
        cur.close()
        conn.close()
