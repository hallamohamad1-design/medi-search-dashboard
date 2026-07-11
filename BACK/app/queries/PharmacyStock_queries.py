LOW_STOCK_DRUGS = """
WITH latest_date AS (SELECT MAX(date_key) AS date_key FROM fact_inventory_snapshot)
SELECT dd.drug_id, dd.name, COUNT(*) FILTER (WHERE f.quantity > 0) AS pharmacies_in_stock
FROM fact_inventory_snapshot f
JOIN latest_date ld ON f.date_key = ld.date_key
JOIN dim_drug dd ON dd.drug_id = f.drug_id
GROUP BY dd.drug_id, dd.name
HAVING COUNT(*) FILTER (WHERE f.quantity > 0) < 3
ORDER BY pharmacies_in_stock ASC;
"""

GET_FREQUENTLY_SEARCHED_MISSING_DRUGS = """
WITH frequently_searched AS (

    SELECT
        fdt.drug_id,
        dl.city,
        dl.governorate,
        SUM(fdt.number_of_searches) AS total_searches

    FROM fact_drug_trends fdt

    JOIN dim_location dl
        ON fdt.location_id = dl.location_id

    WHERE fdt.date_key >= CURRENT_DATE - INTERVAL '30 days'

    GROUP BY
        fdt.drug_id,
        dl.city,
        dl.governorate

    HAVING SUM(fdt.number_of_searches) >= %s
),

latest_inventory AS (

    SELECT
        drug_id,
        pharmacy_id,
        quantity

    FROM fact_inventory_snapshot

    WHERE date_key = (
        SELECT MAX(date_key)
        FROM fact_inventory_snapshot
    )
)

SELECT

    dp.pharmacy_id,

    dp.name AS pharmacy_name,

    fs.drug_id,

    dd.name AS drug_name,

    fs.city,

    fs.governorate,

    fs.total_searches

FROM frequently_searched fs

JOIN dim_pharmacy dp
    ON dp.city = fs.city
    AND dp.governorate = fs.governorate
    AND dp.is_active = TRUE

JOIN dim_drug dd
    ON dd.drug_id = fs.drug_id

LEFT JOIN latest_inventory li
    ON li.drug_id = fs.drug_id
    AND li.pharmacy_id = dp.pharmacy_id

WHERE
    li.quantity IS NULL
    OR li.quantity = 0

ORDER BY
    fs.total_searches DESC;
"""