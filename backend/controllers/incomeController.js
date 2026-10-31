import incomeModel from "../models/incomeModel.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import getDateRange from "../utils/dateFilter.js";

// folder where the generated excel files are saved: backend/exports
const exportDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "exports");


// add income
const addIncome = async (req, res) => {
  const { description, amount, category, date } = req.body;
  const userId = req.userId;

  try {
   if(!description || !amount || !category || !date) {
    return res.status(400).json({ message: "All fields are required" });
   }
    const newIncome = new incomeModel({
      description,
      amount,
      category,
      date: new Date(date),
      userId
    });

    const savedIncome = await newIncome.save();
    res.status(201).json({savedIncome, message: "Income added successfully", success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// to get income
const getIncome = async (req, res) => {
  const userId = req.userId;

  try {
    const income = await incomeModel.find({ userId }).sort({ date: -1 });
    res.status(200).json(income);
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

// TO UPDATE INCOME

const updateIncome = async (req, res) => {
  const { id } = req.params;
  const { description, amount, category, date } = req.body;
  const userId = req.userId;

  try {
    const income = await incomeModel.findById(id);
    if (!income) {
      return res.status(404).json({ message: "Income not found", success: false });
    }

    if (income.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    income.description = description;
    income.amount = amount;
    income.category = category;
    income.date = new Date(date);

    const updatedIncome = await income.save();
    res.status(200).json({ updatedIncome, message: "Income updated successfully", success: true });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

// to delete income

const deleteIncome = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const income = await incomeModel.findById(id);
    if (!income) {
      return res.status(404).json({ message: "Income not found", success: false });
    }

    if (income.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }

    await income.deleteOne();
    res.status(200).json({ message: "Income deleted successfully", success: true });
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
};

// to download data in excel sheet

const downloadIncomeData = async (req, res) => {
  const userId = req.userId;
  try {
    const incomeData = await incomeModel.find({ userId }).sort({ date: -1 });
    const plainData = incomeData.map((income) => ({
      description: income.description,
      amount: income.amount,
      category: income.category,
      date: income.date.toISOString().split('T')[0],
    }));

    const worksheet = XLSX.utils.json_to_sheet(plainData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Income Data");

    // create the excel file on the server (one file per user, so users never get each other's data)
    fs.mkdirSync(exportDir, { recursive: true });
    const filePath = path.join(exportDir, `income_${userId}.xlsx`);
    XLSX.writeFile(workbook, filePath);

    // send the file that was just created
    res.download(filePath, "income_data.xlsx", (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: "Error downloading the file", success: false });
      }
    });
    
  } catch (error) {
    res.status(400).json({ message: error.message, success: false });
  }
}


// to get income overview 

const getIncomeOverview = async (req, res) => {
  try {
    const userId = req.userId;
  const {range = "monthly"} = req.query;
  const { start, end } = getDateRange(range);

  const incomes = await incomeModel.find({
    userId,
    date: { $gte: start, $lt: end },
  }).sort({ date: -1 });

  const totalIncome = incomes.reduce((total, income) => total + income.amount, 0);  
  const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
  const numberoftransactions = incomes.length;

  const recenttransactions = incomes.slice(0, 5).map((income) => ({
    description: income.description,
    amount: income.amount,
    category: income.category,
    date: income.date.toISOString().split('T')[0],
  }));

  res.status(200).json({
    success: true,
    data: {
      totalIncome,
      averageIncome,
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
  addIncome,
  getIncome,
    updateIncome,
    deleteIncome,
    downloadIncomeData,
    getIncomeOverview
};
