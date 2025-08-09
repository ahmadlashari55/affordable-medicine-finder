const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}
function writeDB(obj) {
  fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf8');
}
module.exports = {
  readDB,
  writeDB,
  getAll(collection) {
    const db = readDB();
    return db[collection] || [];
  },
  find(collection, predicate) {
    const arr = this.getAll(collection);
    return arr.find(predicate);
  },
  findIndex(collection, predicate) {
    const arr = this.getAll(collection);
    return arr.findIndex(predicate);
  },
  saveItem(collection, item) {
    const db = readDB();
    db[collection] = db[collection] || [];
    db[collection].push(item);
    writeDB(db);
    return item;
  },
  updateItem(collection, id, patch) {
    const db = readDB();
    db[collection] = db[collection] || [];
    const i = db[collection].findIndex(x => x.id === id);
    if (i === -1) return null;
    db[collection][i] = { ...db[collection][i], ...patch };
    writeDB(db);
    return db[collection][i];
  },
  setDB(db) { writeDB(db); }
};
