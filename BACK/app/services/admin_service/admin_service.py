from database import get_connection

from queries.admin_analytics import (
    GET_PHARMACY_TRAFFIC_RANKING,
    GET_AREA_DRUG_TRENDS,
    GET_TOP_SEARCHED_DRUGS,
    GET_MONTHLY_REPORT
)

def get_admin_analytics():

    conn = get_connection()
    cur = conn.cursor()

    try:

        cur.execute(GET_PHARMACY_TRAFFIC_RANKING)
        pharmacy_ranking = cur.fetchall()

        cur.execute(GET_AREA_DRUG_TRENDS)
        area_trends = cur.fetchall()

        cur.execute(GET_TOP_SEARCHED_DRUGS)
        top_drugs = cur.fetchall()

        cur.execute(GET_MONTHLY_REPORT)
        monthly_report = cur.fetchall()
    
        return {

            "pharmacy_ranking": pharmacy_ranking,

            "area_drug_trends": area_trends,

            "top_searched_drugs": top_drugs,

            "monthly_report": monthly_report
            }

    finally:

        cur.close()
        conn.close()
