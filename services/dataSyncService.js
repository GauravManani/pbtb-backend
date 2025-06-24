const logger = require("../config/logger"); // Import the logger
const dbUtility = require("./dbUtility");
const {
  dataEncryptionColumns,
  passwordEncryptionColumns,
} = require("./cryptoService");

const syncData = async (req, res) => {
  console.log("Here : " + JSON.stringify(req.body));
  const { caseId, data } = req.body;

  if (!data || typeof data !== "object") {
    logger.error("Invalid data structure: data is not an object");
    return res
      .status(400)
      .send("Invalid data structure: data is not an object");
  }

  try {
    for (const [key, value] of Object.entries(data)) {
      const tableName = key;

      if (typeof value !== "object" || Array.isArray(value)) {
        logger.error(`Invalid data structure for table ${tableName}`);
        continue;
      }

      const columns = Object.keys(value)
        .map((col) => col.toUpperCase())
        .join(", ");
      const placeholders = Object.keys(value)
        .map(() => "?")
        .join(", ");
      const updateSet = Object.keys(value)
        .map((col) => `${col.toUpperCase()} = ?`)
        .join(", ");

      const insertQuery = `
          INSERT INTO ${tableName} (${columns})
          VALUES (${placeholders})
      `;
      const updateQuery = `
          UPDATE ${tableName} SET ${updateSet}
          WHERE CASE_ID = ?
      `;
      const values = Object.values(value);
      const fields = Object.keys(value);

      const checkQuery = `SELECT CASE_ID FROM ${tableName} WHERE CASE_ID = ?`;

      const rows = await dbUtility.select(checkQuery, [caseId]);
      logger.info(
        `Check query executed for CASE_ID: ${caseId} in table ${tableName}`
      );
      if (rows.length > 0) {
        await dbUtility.update(
          updateQuery,
          [...values, caseId],
          fields,
          "data"
        );
        logger.info(
          `Record updated successfully for CASE_ID: ${caseId} in table ${tableName}`
        );
      } else {
        await dbUtility.insertOrUpdate(insertQuery, values, fields, "data");
        logger.info(
          `Record inserted successfully for CASE_ID: ${caseId} in table ${tableName}`
        );
      }
    }
    res.status(200).send("Data synced successfully");
  } catch (error) {
    logger.error(
      `Error syncing data for CASE_ID: ${caseId} - ${error.message}`
    );
    res.status(500).send("Error syncing data");
  }
};

const getDataById = async (req, res) => {
  const { caseId, tableName } = req.body;

  if (!caseId || !tableName) {
    logger.error(
      "Missing required parameters: caseId and tableName are required"
    );
    return res
      .status(400)
      .send("Missing required parameters: caseId and tableName are required");
  }

  try {
    const query = `SELECT * FROM ${tableName} WHERE CASE_ID = ?`;
    const fields = dataEncryptionColumns; // You may want to customize this per table
    const rows = await dbUtility.select(query, [caseId], fields, "data");

    console.log("Rows: ", rows);

    logger.info(
      `Data fetched successfully for CASE_ID: ${caseId} from table ${tableName}`
    );

    if (!rows || rows.length === 0) {
      return res.status(404).send("No data found for the given case ID");
    }

    res.status(200).json(rows[0]); // Sending the first matching record
  } catch (error) {
    logger.error(
      `Error fetching data for CASE_ID: ${caseId} from table ${tableName} - ${error.message}`
    );
    res.status(500).send("Error fetching data");
  }
};

module.exports = {
  syncData,
  getDataById,
};
