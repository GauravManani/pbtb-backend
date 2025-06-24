const logger = require("../config/logger");
const db = require("./dbService");

const fetchLifeRecords = async (req, res) => {
  const type = req.params.type;

  if (!type) {
    logger.error("Missing required parameter: type");
    return res.status(400).send("Type is required");
  }

  const queryMap = {
    lifeGen: `
            SELECT 
                pd.case_id,
                pd.created_date,
                pd.full_name,
                pc.product
            FROM personal_details pd
            LEFT JOIN product_choice pc ON pd.case_id = pc.case_id
            WHERE pd.full_name IS NOT NULL`,
    lifeQuote: `
            SELECT 
                pd.case_id,
                pd.full_name,
                pc.product,
                bc.sum_covered
            FROM personal_details pd
            LEFT JOIN product_choice pc ON pd.case_id = pc.case_id
            LEFT JOIN benefit_choice bc ON pd.case_id = bc.case_id
            WHERE bc.sum_covered IS NOT NULL`,
    proposal: `
            SELECT l.*, p.* 
            FROM LIFE_INSURANCE l 
            LEFT JOIN PROPOSAL p ON l.CASE_ID = p.CASE_ID 
            WHERE l.CASE_ID = ?`,
    submission: `
            SELECT l.*, s.* 
            FROM LIFE_INSURANCE l 
            LEFT JOIN SUBMISSION s ON l.CASE_ID = s.CASE_ID 
            WHERE l.CASE_ID = ?`,
  };

  const query = queryMap[type];
  if (!query) {
    logger.error(`Invalid record type: ${type}`);
    return res.status(400).send("Invalid record type");
  }

  try {
    let rows;

    [rows] = await db.execute(query);
    logger.info(`Fetched all ${type} records`);

    if (rows.length > 0) {
      if (type === "lifeGen" || type === "lifeQuote") {
        // Return array of results for LifeGen
        const results = rows.map((row) => {
          const result = {};
          for (const key in row) {
            result[key.toLowerCase()] = row[key];
          }
          return result;
        });
        res.status(200).json(results);
      } else {
        // Return single object for other types
        const result = {};
        for (const key in rows[0]) {
          result[key.toLowerCase()] = rows[0][key];
        }
        res.status(200).json(result);
      }
    } else {
      res.status(404).send("Record not found");
    }
  } catch (error) {
    logger.error(`Error fetching ${type} records: ${error.message}`);
    res.status(500).send("Error fetching record");
  }
};

module.exports = {
  fetchLifeRecords,
};
