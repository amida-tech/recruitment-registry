SELECT COUNT(id), array_agg(id)
FROM registry_user
WHERE :subqueries;