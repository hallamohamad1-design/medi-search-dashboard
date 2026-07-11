from database import get_connection
from queries.search_queries import GET_DRUG_ID
from queries.search_queries import GET_DRUG_ANALYTICS


def get_drug_statistics(drug_name):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(GET_DRUG_ID, (drug_name,))

    drug = cur.fetchone()

    if drug is None:
        cur.close()
        conn.close()

        return None

    drug_id = drug["drug_id"]

    cur.execute(GET_DRUG_ANALYTICS, (drug_id,))

    result = cur.fetchone()

    cur.close()
    conn.close()

    return {
        "drug_name": drug_name,
        "drug_id": drug_id,
        "statistics": result
    }