from database import get_connection
from queries.PharmacyStock_queries import LOW_STOCK_DRUGS, GET_FREQUENTLY_SEARCHED_MISSING_DRUGS
from queries.pharmacy_analytics import (
    GET_PHARMACY_PAGE_TRAFFIC,
    GET_PHARMACY_DRUG_TRENDS,
    GET_PHARMACY_NAME_BY_ID,
)


def get_pharmacy_analytics_by_id(pharmacy_id: int):
    """
    Load analytics for a pharmacy identified by its ID.
    The ID comes from the JWT token — never from the client.
    """
    conn = get_connection()
    cur  = conn.cursor()

    try:
        # Get pharmacy name for display
        cur.execute(GET_PHARMACY_NAME_BY_ID, (pharmacy_id,))
        pharmacy = cur.fetchone()
        if pharmacy is None:
            return None

        # Page traffic
        cur.execute(GET_PHARMACY_PAGE_TRAFFIC, (pharmacy_id,))
        page_traffic = cur.fetchall()

        # Drug trends (system-wide top searched — city join has no matches)
        cur.execute(GET_PHARMACY_DRUG_TRENDS, (pharmacy_id,))
        drug_trends = cur.fetchall()

        return {
            "pharmacy_id":   pharmacy_id,
            "pharmacy_name": pharmacy["name"],
            "page_traffic":  page_traffic,
            "drug_trends":   drug_trends,
        }

    finally:
        cur.close()
        conn.close()


# Keep old name-based function for backward compat (internal use only)
def get_pharmacy_analytics(pharmacy_name: str):
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute("SELECT pharmacy_id, name FROM dim_pharmacy WHERE LOWER(name) LIKE LOWER(%s) LIMIT 1", (f"%{pharmacy_name}%",))
        p = cur.fetchone()
        if p is None:
            return None
        return get_pharmacy_analytics_by_id(p["pharmacy_id"])
    finally:
        cur.close()
        conn.close()


def get_low_stock_drugs(limit: int = 3):
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(LOW_STOCK_DRUGS, (limit,))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


def get_frequently_searched_missing_drugs(threshold: int = 1):
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute(GET_FREQUENTLY_SEARCHED_MISSING_DRUGS, (threshold,))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()
