from database import get_connection
from queries.PharmacyStock_queries import(
     LOW_STOCK_DRUGS , GET_FREQUENTLY_SEARCHED_MISSING_DRUGS
)

from queries.pharmacy_analytics import (
    GET_PHARMACY_PAGE_TRAFFIC,
    GET_PHARMACY_DRUG_TRENDS,
    GET_PHARMACY_ID
)

def get_low_stock_drugs(limit=3):

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(LOW_STOCK_DRUGS, (limit,))
        drugs = cur.fetchall()

        return drugs

    finally:
        cur.close()
        conn.close()

def get_frequently_searched_missing_drugs(threshold=1):
        conn = get_connection()
        cur = conn.cursor()

        try:

            cur.execute(
                GET_FREQUENTLY_SEARCHED_MISSING_DRUGS,
                (threshold,)
            )

            result = cur.fetchall()

            return result

        finally:
            cur.close()
            conn.close()

def get_pharmacy_analytics(pharmacy_name):

    conn = get_connection()
    cur = conn.cursor()

    try:

        # الحصول على pharmacy_id
        cur.execute(GET_PHARMACY_ID,(f"%{pharmacy_name}%",))
        pharmacy = cur.fetchone()

        if pharmacy is None:
            return None

        pharmacy_id = pharmacy["pharmacy_id"]

        # Page Traffic
        cur.execute(
            GET_PHARMACY_PAGE_TRAFFIC,
            (pharmacy_id,)
        )

        page_traffic = cur.fetchall()

        # Drug Trends
        cur.execute(
            GET_PHARMACY_DRUG_TRENDS,
            (pharmacy_id,)
        )

        drug_trends = cur.fetchall()

        return {

            "pharmacy_id": pharmacy_id,

            "pharmacy_name": pharmacy_name,

            "page_traffic": page_traffic,

            "drug_trends": drug_trends
        }

    finally:

        cur.close()
        conn.close()
     