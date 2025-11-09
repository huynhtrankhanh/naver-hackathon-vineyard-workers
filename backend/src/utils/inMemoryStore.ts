/**
 * In-memory data store for when MongoDB is not available
 * This allows the API to work in demo mode
 */
import mongoose from 'mongoose';

interface InMemoryData {
  transactions: any[];
  goals: any[];
  budgets: any[];
  savingsPlans: any[];
}

const inMemoryStore: InMemoryData = {
  transactions: [
    { 
      _id: '1', 
      title: 'Salary', 
      category: 'Income', 
      amount: 15000000, 
      date: new Date('2025-11-01'), 
      type: 'income',
      userId: 'default' 
    },
    { 
      _id: '2', 
      title: 'Highlands Coffee', 
      category: 'Food & Drinks', 
      amount: -52000, 
      date: new Date(), 
      type: 'expense',
      userId: 'default' 
    },
    { 
      _id: '3', 
      title: 'GrabBike', 
      category: 'Transport', 
      amount: -32000, 
      date: new Date(Date.now() - 86400000), 
      type: 'expense',
      userId: 'default' 
    }
  ],
  goals: [
    { _id: '1', name: 'Buy a laptop', target: 12000000, current: 4200000, priority: 'high', userId: 'default' },
    { _id: '2', name: 'Trip to Da Nang', target: 6000000, current: 1080000, priority: 'medium', userId: 'default' }
  ],
  budgets: [
    { _id: '1', category: 'Food & Drinks', limit: 2000000, spent: 850000, month: '2025-11', userId: 'default' },
    { _id: '2', category: 'Transport', limit: 500000, spent: 230000, month: '2025-11', userId: 'default' },
    { _id: '3', category: 'Shopping', limit: 1000000, spent: 650000, month: '2025-11', userId: 'default' }
  ],
  savingsPlans: []
};

let idCounter = 100;

export const inMemory = {
  // Check if MongoDB is available
  isConnected: () => {
    return mongoose.connection.readyState === 1;
  },

  // Generate unique ID
  generateId: () => {
    return String(idCounter++);
  },

  // Get all items from a collection
  find: (collection: keyof InMemoryData) => {
    return [...inMemoryStore[collection]];
  },

  // Find one item
  findOne: (collection: keyof InMemoryData, id: string) => {
    return inMemoryStore[collection].find((item: any) => item._id === id);
  },

  // Create item
  create: (collection: keyof InMemoryData, data: any) => {
    const newItem = { ...data, _id: inMemory.generateId(), createdAt: new Date(), updatedAt: new Date() };
    inMemoryStore[collection].push(newItem);
    return newItem;
  },

  // Update item
  update: (collection: keyof InMemoryData, id: string, data: any) => {
    const index = inMemoryStore[collection].findIndex((item: any) => item._id === id);
    if (index === -1) return null;
    inMemoryStore[collection][index] = { 
      ...inMemoryStore[collection][index], 
      ...data, 
      updatedAt: new Date() 
    };
    return inMemoryStore[collection][index];
  },

  // Delete item
  delete: (collection: keyof InMemoryData, id: string) => {
    const index = inMemoryStore[collection].findIndex((item: any) => item._id === id);
    if (index === -1) return null;
    const deleted = inMemoryStore[collection][index];
    inMemoryStore[collection].splice(index, 1);
    return deleted;
  }
};
