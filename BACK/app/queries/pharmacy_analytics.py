GET_PHARMACY_ID = """
SELECT
    pharmacy_id,
    name
FROM dim_pharmacy
WHERE LOWER(name) LIKE LOWER(%s)
LIMIT 1;
"""

GET_PHARMACY_PAGE_TRAFFIC = """
SELECT
    dt.date_key,
    dt.day_name,
    fpv.number_of_views

FROM fact_page_views fpv

JOIN dim_date dt
    ON fpv.date_key = dt.date_key

WHERE fpv.pharmacy_id = %s

ORDER BY dt.date_key;
"""

GET_PHARMACY_DRUG_TRENDS = """
SELECT
    dd.drug_id,
    dd.name AS drug_name,
    SUM(fdt.number_of_searches) AS total_searches

FROM fact_drug_trends fdt

JOIN dim_drug dd
    ON fdt.drug_id = dd.drug_id

JOIN dim_location dl
    ON fdt.location_id = dl.location_id

JOIN dim_pharmacy dp
    ON dp.city = dl.city
    AND dp.governorate = dl.governorate

WHERE
    dp.pharmacy_id = %s
    AND fdt.date_key >= CURRENT_DATE - INTERVAL '30 days'

GROUP BY
    dd.drug_id,
    dd.name

ORDER BY total_searches DESC;
"""