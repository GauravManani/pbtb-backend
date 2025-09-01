const logger = require("../config/logger");
const db = require("./dbService");
const {
  decrypt,
  dataEncryptionColumns,
  passwordEncryptionColumns,
} = require("./cryptoService");

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

  // Mapping of which columns to decrypt for each type
  const decryptConfig = {
    lifeGen: { fields: dataEncryptionColumns, type: "data" },
    lifeQuote: { fields: dataEncryptionColumns, type: "data" },
    proposal: { fields: dataEncryptionColumns, type: "data" },
    submission: { fields: dataEncryptionColumns, type: "data" },
    // Add more types and configs as needed
  };

  try {
    let rows;
    [rows] = await db.execute(query);
    logger.info(`Fetched all ${type} records`);

    const config = decryptConfig[type] || { fields: [], type: "data" };

    // Decrypt relevant fields in each row
    const decryptRow = (row) => {
      const result = {};
      for (const key in row) {
        let value = row[key];
        if (config.fields.includes(key.toLowerCase()) && value) {
          value = decrypt(value, config.type);
        }
        result[key.toLowerCase()] = value;
      }
      return result;
    };

    if (rows.length > 0) {
      if (type === "lifeGen" || type === "lifeQuote") {
        // Return array of results for LifeGen
        const results = rows.map(decryptRow);
        res.status(200).json(results);
      } else {
        // Return single object for other types
        const result = decryptRow(rows[0]);
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
