/**
 * In-Memory Fallback Database Store for Local Development / Offline Testing
 */
const { INITIAL_DATA } = require('../seed/initialData.cjs');
const bcrypt = require('bcryptjs');

class MemoryQuery {
  constructor(promiseOrArray) {
    this.promiseOrArray = Promise.resolve(promiseOrArray);
  }
  sort(sortObj) {
    this.promiseOrArray = this.promiseOrArray.then(items => {
      if (!sortObj) return items;
      const keys = Object.keys(sortObj);
      if (keys.length === 0) return items;
      const key = keys[0];
      const order = sortObj[key]; // 1 or -1
      return [...items].sort((a, b) => {
        const valA = a[key] !== undefined ? a[key] : '';
        const valB = b[key] !== undefined ? b[key] : '';
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
    });
    return this;
  }
  skip(n) {
    this.promiseOrArray = this.promiseOrArray.then(items => items.slice(n));
    return this;
  }
  limit(n) {
    this.promiseOrArray = this.promiseOrArray.then(items => items.slice(0, n));
    return this;
  }
  select() { return this; }
  then(onFulfilled, onRejected) {
    return this.promiseOrArray.then(onFulfilled, onRejected);
  }
  catch(onRejected) {
    return this.promiseOrArray.catch(onRejected);
  }
}

class MemoryModel {
  constructor(collectionName, initialItems = []) {
    this.collectionName = collectionName;
    this.items = initialItems.map((item, index) => ({
      _id: item._id || String(index + 1).padStart(5, '0') + Math.random().toString(36).substring(2, 7),
      id: item.id || item._id || String(index + 1).padStart(5, '0') + Math.random().toString(36).substring(2, 7),
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString()
    }));
  }

  find(query = {}) {
    const filtered = this.items.filter(item => matchQuery(item, query));
    return new MemoryQuery(filtered.map(cloneWithId));
  }

  async findOne(query = {}) {
    const found = this.items.find(item => matchQuery(item, query));
    return found ? cloneWithId(found) : null;
  }

  async findById(id) {
    const found = this.items.find(item => item._id === id || item.id === id);
    return found ? cloneWithId(found) : null;
  }

  async countDocuments(query = {}) {
    const filtered = this.items.filter(item => matchQuery(item, query));
    return filtered.length;
  }

  async create(data) {
    const newItem = {
      _id: Math.random().toString(36).substring(2, 9),
      id: Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.items.push(newItem);
    return cloneWithId(newItem);
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const index = this.items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    const current = this.items[index];
    let updatedData = { ...current };

    if (update && update.$set) {
      updatedData = { ...updatedData, ...update.$set, updatedAt: new Date().toISOString() };
    } else if (update) {
      updatedData = { ...updatedData, ...update, updatedAt: new Date().toISOString() };
    }

    this.items[index] = updatedData;
    return cloneWithId(updatedData);
  }

  async findByIdAndDelete(id) {
    const index = this.items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const removed = this.items.splice(index, 1)[0];
    return cloneWithId(removed);
  }

  async deleteOne(query = {}) {
    const index = this.items.findIndex(item => matchQuery(item, query));
    if (index === -1) return { deletedCount: 0 };
    this.items.splice(index, 1);
    return { deletedCount: 1 };
  }

  async deleteMany(query = {}) {
    const beforeCount = this.items.length;
    this.items = this.items.filter(item => !matchQuery(item, query));
    return { deletedCount: beforeCount - this.items.length };
  }

  async insertMany(docs) {
    const newDocs = docs.map(doc => ({
      _id: doc._id || Math.random().toString(36).substring(2, 9),
      id: doc.id || doc._id || Math.random().toString(36).substring(2, 9),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString()
    }));
    this.items.push(...newDocs);
    return newDocs.map(cloneWithId);
  }
}

function matchQuery(item, query) {
  if (!query) return true;
  for (const key of Object.keys(query)) {
    if (key === '$or') {
      const orMatched = query.$or.some(subQuery => matchQuery(item, subQuery));
      if (!orMatched) return false;
      continue;
    }
    const val = query[key];
    if (val && typeof val === 'object' && val.$ne !== undefined) {
      if (item[key] === val.$ne) return false;
    } else if (val instanceof RegExp) {
      if (!val.test(item[key] || '')) return false;
    } else if (item[key] !== val) {
      return false;
    }
  }
  return true;
}

function cloneWithId(item) {
  const cloned = JSON.parse(JSON.stringify(item));
  if (cloned._id && !cloned.id) cloned.id = cloned._id;
  if (cloned.id && !cloned._id) cloned._id = cloned.id;
  cloned.save = async function() { return cloned; };
  return cloned;
}

const desligamentoStore = new MemoryModel('Desligamento', INITIAL_DATA);
const userStore = new MemoryModel('User', [
  { _id: 'usr1', id: 'usr1', name: 'Admin DesliGest', email: 'admin@desligest.com', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
  { _id: 'usr2', id: 'usr2', name: 'Ana Lima (RH)', email: 'ana.lima@desligest.com', password: bcrypt.hashSync('senha123', 10), role: 'hr' }
]);
const linkStore = new MemoryModel('Link', [
  { _id: 'lnk1', id: 'lnk1', label: 'Portal eSocial', url: 'https://esocial.gov.br', category: 'Portais', description: 'Envio de eventos trabalhistas' },
  { _id: 'lnk2', id: 'lnk2', label: 'Calculadora CLT', url: 'https://trabalho.gov.br', category: 'Cálculos', description: 'Referência legal de rescisões' }
]);

module.exports = { desligamentoStore, userStore, linkStore, MemoryModel, MemoryQuery };
