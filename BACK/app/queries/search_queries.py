GET_DRUG_ID = """
SELECT drug_id
FROM dim_drug
WHERE LOWER(name)=LOWER(%s);
"""

GET_DRUG_ANALYTICS = """
WITH latest_date AS (
    SELECT MAX(date_key) AS date_key
    FROM fact_inventory_snapshot
),

drug_snapshot AS (

    SELECT
        f.pharmacy_id,
        f.price,
        f.quantity

    FROM fact_inventory_snapshot f

    JOIN latest_date ld
    ON f.date_key=ld.date_key

    WHERE f.drug_id=%s
)

SELECT

ROUND(AVG(price)::numeric,2) AS average_price,

MAX(price) AS highest_price,

MIN(price) AS lowest_price,

COUNT(*) FILTER
(
WHERE quantity>0
) AS pharmacies_in_stock,

COUNT(*) AS pharmacies_carrying_drug,

ROUND(

100.0*

COUNT(*) FILTER
(
WHERE quantity>0
)

/

NULLIF(COUNT(*),0)

,1)

AS availability_percentage

FROM drug_snapshot;
"""