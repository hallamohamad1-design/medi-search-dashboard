GET_PHARMACY_TRAFFIC_RANKING = """
SELECT
    dp.pharmacy_id,
    dp.name,
    SUM(fpv.number_of_views) AS total_views

FROM fact_page_views fpv

JOIN dim_pharmacy dp
    ON fpv.pharmacy_id = dp.pharmacy_id

WHERE fpv.date_key >= CURRENT_DATE - INTERVAL '30 days'

GROUP BY
    dp.pharmacy_id,
    dp.name

ORDER BY total_views DESC;
"""


GET_AREA_DRUG_TRENDS = """
SELECT
    dl.governorate,
    dl.city,
    dd.drug_id,
    dd.name AS drug_name,
    SUM(fdt.number_of_searches) AS total_searches

FROM fact_drug_trends fdt

JOIN dim_location dl
    ON fdt.location_id = dl.location_id

JOIN dim_drug dd
    ON fdt.drug_id = dd.drug_id

WHERE fdt.date_key >= CURRENT_DATE - INTERVAL '30 days'

GROUP BY
    dl.governorate,
    dl.city,
    dd.drug_id,
    dd.name

ORDER BY
    dl.governorate,
    dl.city,
    total_searches DESC;
"""


GET_TOP_SEARCHED_DRUGS = """
SELECT
    dd.drug_id,
    dd.name,
    SUM(fdt.number_of_searches) AS total_searches

FROM fact_drug_trends fdt

JOIN dim_drug dd
    ON fdt.drug_id = dd.drug_id

WHERE fdt.date_key >= CURRENT_DATE - INTERVAL '30 days'

GROUP BY
    dd.drug_id,
    dd.name

ORDER BY total_searches DESC;
"""

GET_MONTHLY_REPORT = """
SELECT
    dt.year,
    dt.month,
    dl.governorate,
    SUM(fdt.number_of_searches) AS total_searches

FROM fact_drug_trends fdt

JOIN dim_date dt
    ON fdt.date_key = dt.date_key

JOIN dim_location dl
    ON fdt.location_id = dl.location_id

GROUP BY
    dt.year,
    dt.month,
    dl.governorate

ORDER BY
    dt.year,
    dt.month,
    total_searches DESC;
"""
