const express = require('express');
const router = express.Router();
const {
  skillsDatabase,
  getAllSkills,
  getSkillsByCategory,
  searchSkills,
  getPopularSkills
} = require('../utils/skillsDatabase');

// Get all skills
router.get('/all', (req, res) => {
  res.json({
    success: true,
    skills: getAllSkills()
  });
});

// Get popular skills
router.get('/popular', (req, res) => {
  res.json({
    success: true,
    skills: getPopularSkills()
  });
});

// Get skills by category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const skills = getSkillsByCategory(category);
  
  if (Object.keys(skills).length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }
  
  res.json({
    success: true,
    category,
    skills
  });
});

// Search skills
router.get('/search', (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters'
    });
  }
  
  const results = searchSkills(q);
  
  res.json({
    success: true,
    query: q,
    count: results.length,
    skills: results
  });
});

// Get all categories
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: Object.keys(skillsDatabase)
  });
});

// Get complete skills database structure
router.get('/database', (req, res) => {
  res.json({
    success: true,
    database: skillsDatabase
  });
});

module.exports = router;
