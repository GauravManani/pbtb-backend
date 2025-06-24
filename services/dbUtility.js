const db = require("./dbService");
const {
  encrypt,
  decrypt,
  dataEncryptionColumns,
  passwordEncryptionColumns,
} = require("./cryptoService");

const dbUtility = {
  createTable: async (query) => {
    await db.execute(query);
  },

  insertOrUpdate: async (query, values, fields = [], type = "data") => {
    // Encrypt values based on fields
    const encryptedValues = values.map((val, idx) => {
      if (fields.includes(fields[idx])) {
        return encrypt(val, type);
      }
      return val;
    });
    await db.execute(query, encryptedValues);
  },

  select: async (query, values = [], fields = [], type = "data") => {
    const [rows] = await db.execute(query, values);
    if (fields.length > 0) {
      return rows.map((row) => {
        const decryptedRow = { ...row };
        fields.forEach((field) => {
          if (row[field]) {
            decryptedRow[field] = decrypt(row[field], type);
          }
        });
        return decryptedRow;
      });
    }
    return rows;
  },

  update: async (query, values, fields = [], type = "data") => {
    const encryptedValues = values.map((val, idx) => {
      if (fields.includes(fields[idx])) {
        return encrypt(val, type);
      }
      return val;
    });
    await db.execute(query, encryptedValues);
  },

  delete: async (query, values = []) => {
    await db.execute(query, values);
  },
};

module.exports = dbUtility;
