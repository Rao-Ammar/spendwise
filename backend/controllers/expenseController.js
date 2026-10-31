import expenseModel from "../models/expenseModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import getDateRange from "../utils/dateFilter.js";

// folder where the generated excel files are saved: backend/exports
const exportDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "exports");


// add expense
const addExpense = async (req, res) => {
  const { description, amount, category, date } = req.body;
  const userId = req.userId;

  try {
   if(!description || !amount || !category || !date) {
    return res.status(400).json({ message: "All fields are required" });
   }
    const newExpense = new expenseModel({
      description,
      amount,
      category,
      date: new Date(date),
      userId
    });

    const savedExpense = await newExpense.save();
    res.status(201).json({savedExpense, message: "Expense added successfully", success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// to get expense
const getExpense = async (req, res) => {
  const userId = req.userId;

  try {
    const expense = await expenseModel.find({ userId }).sort({ date: -1 });
    res.status(200).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

// TO UPDATE EXPENSE

const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { description, amount, category, date } = req.body;
  const userId = req.userId;

  try {
    const expense = await expenseModel.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found", success: false });
    }

    if (expense.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    expense.description = description;
    expense.amount = amount;
    expense.category = category;
    expense.date = new Date(date);

    const updatedExpense = await expense.save();
    res.status(200).json({ updatedExpense, message: "Expense updated successfully", success: true });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

// to delete expense

const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const expense = await expenseModel.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found", success: false });
    }

    if (expense.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    await expense.deleteOne();
    res.status(200).json({ message: "Expense deleted successfully", success: true });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

// to download data in excel sheet

const downloadExpenseData = async (req, res) => {
  const userId = req.userId;
  try {
    const expenseData = await expenseModel.find({ userId }).sort({ date: -1 });
    const plainData = expenseData.map((expense) => ({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.toISOString().split('T')[0],
    }));

    const worksheet = XLSX.utils.json_to_sheet(plainData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Data");

    // create the excel file on the server (one file per user, so users never get each other's data)
    fs.mkdirSync(exportDir, { recursive: true });
    const filePath = path.join(exportDir, `expense_${userId}.xlsx`);
    XLSX.writeFile(workbook, filePath);

    // send the file that was just created
    res.download(filePath, "expense_data.xlsx", (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: "Error downloading the file", success: false });
      }
    });
    
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
}


// to get expense overview 

const getExpenseOverview = async (req, res) => {
  try {
    const userId = req.userId;
  const {range = "monthly"} = req.query;
  const { start, end } = getDateRange(range);

  const expenses = await expenseModel.find({
    userId,
    date: { $gte: start, $lt: end },
  }).sort({ date: -1 });

  const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);  
  const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
  const numberoftransactions = expenses.length;

  const recenttransactions = expenses.slice(0, 5).map((expense) => ({
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    date: expense.date.toISOString().split('T')[0],
  }));

  res.status(200).json({
    success: true,
    data: {
      totalExpense,
      averageExpense,
        numberoftransactions,
        recenttransactions,
        range
    },
  });
  }
 

    catch (error) {
      res.status(400).json({ message: error.message, success: false });
    }
  };

export {
  addExpense,
  getExpense,
    updateExpense,
    deleteExpense,
    downloadExpenseData,
    getExpenseOverview
};
