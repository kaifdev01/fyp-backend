const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
require('dotenv').config();

const additionalJobs = [
  {
    title: 'Senior Backend Developer - Node.js & PostgreSQL',
    description: 'We need a senior backend developer to architect and build scalable APIs for our fintech platform. Must have 5+ years experience with Node.js, PostgreSQL, Redis, and microservices architecture. Knowledge of payment gateways and financial regulations is a plus.',
    category: 'Web Development',
    subcategory: 'Backend Development',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'Microservices', 'REST API', 'Docker'],
    budget: { type: 'hourly', amount: 80, currency: 'USD' },
    duration: 'more-than-6-months',
    experienceLevel: 'expert',
    projectType: 'ongoing',
    location: 'Remote'
  },
  {
    title: 'Flutter Developer for Healthcare Mobile App',
    description: 'Looking for Flutter developer to build a telemedicine app with video consultations, appointment booking, prescription management, and health records. Experience with WebRTC and healthcare compliance (HIPAA) required.',
    category: 'Mobile Development',
    subcategory: 'Flutter',
    skills: ['Flutter', 'Dart', 'Firebase', 'WebRTC', 'Mobile Development', 'REST API'],
    budget: { type: 'fixed', amount: 5500, currency: 'USD' },
    duration: '3-6-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Shopify Store Setup and Customization',
    description: 'Need help setting up a Shopify store for fashion brand. Tasks include theme customization, product upload, payment gateway setup, shipping configuration, and basic SEO. Experience with Liquid templating preferred.',
    category: 'Web Development',
    subcategory: 'E-commerce',
    skills: ['Shopify', 'Liquid', 'HTML', 'CSS', 'E-commerce', 'SEO'],
    budget: { type: 'fixed', amount: 650, currency: 'USD' },
    duration: '1-2-weeks',
    experienceLevel: 'beginner',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Data Entry Specialist for CRM Migration',
    description: 'We are migrating from Salesforce to HubSpot and need someone to transfer 5000+ customer records. Must ensure data accuracy, clean duplicates, and organize information properly. Attention to detail is critical.',
    category: 'Admin & Customer Support',
    subcategory: 'Data Entry',
    skills: ['Data Entry', 'Excel', 'CRM', 'Salesforce', 'HubSpot'],
    budget: { type: 'fixed', amount: 400, currency: 'USD' },
    duration: '1-2-weeks',
    experienceLevel: 'beginner',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'SEO Specialist for SaaS Website',
    description: 'Looking for SEO expert to improve organic rankings for our B2B SaaS platform. Need comprehensive SEO audit, keyword research, on-page optimization, technical SEO fixes, and link building strategy. Must provide monthly reports.',
    category: 'Marketing & Sales',
    subcategory: 'SEO',
    skills: ['SEO', 'Google Analytics', 'Keyword Research', 'Link Building', 'Content Strategy'],
    budget: { type: 'hourly', amount: 40, currency: 'USD' },
    duration: 'more-than-6-months',
    experienceLevel: 'intermediate',
    projectType: 'ongoing',
    location: 'Remote'
  },
  {
    title: '3D Product Modeling for E-commerce',
    description: 'Need 3D artist to create photorealistic product models for our furniture e-commerce site. Deliverables include 20 furniture pieces with multiple angles and AR-ready formats. Proficiency in Blender or 3ds Max required.',
    category: 'Design & Creative',
    subcategory: '3D Modeling',
    skills: ['3D Modeling', 'Blender', '3ds Max', 'Product Visualization', 'Rendering'],
    budget: { type: 'fixed', amount: 2000, currency: 'USD' },
    duration: '1-3-months',
    experienceLevel: 'intermediate',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Python Automation Script for Web Scraping',
    description: 'Need Python developer to create web scraping scripts to collect product data from competitor websites. Must handle pagination, CAPTCHA, and store data in CSV/database. Experience with BeautifulSoup, Scrapy, or Selenium required.',
    category: 'Data Science & Analytics',
    subcategory: 'Web Scraping',
    skills: ['Python', 'Web Scraping', 'BeautifulSoup', 'Selenium', 'Scrapy', 'Data Analysis'],
    budget: { type: 'fixed', amount: 800, currency: 'USD' },
    duration: '2-4-weeks',
    experienceLevel: 'intermediate',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Virtual Assistant for Email Management',
    description: 'Seeking reliable virtual assistant to manage emails, schedule meetings, handle customer inquiries, and maintain calendar. Must be available 20 hours/week during EST business hours. Excellent English communication required.',
    category: 'Admin & Customer Support',
    subcategory: 'Virtual Assistant',
    skills: ['Virtual Assistant', 'Email Management', 'Customer Service', 'Scheduling', 'Communication'],
    budget: { type: 'hourly', amount: 15, currency: 'USD' },
    duration: 'more-than-6-months',
    experienceLevel: 'beginner',
    projectType: 'ongoing',
    location: 'Remote'
  },
  {
    title: 'Angular Developer for Enterprise Dashboard',
    description: 'Looking for Angular expert to build complex enterprise dashboard with real-time data visualization, user management, and reporting features. Must have experience with Angular 15+, RxJS, NgRx, and Chart.js.',
    category: 'Web Development',
    subcategory: 'Frontend Development',
    skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Chart.js', 'HTML', 'CSS'],
    budget: { type: 'hourly', amount: 60, currency: 'USD' },
    duration: '3-6-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Social Media Manager for Tech Startup',
    description: 'Tech startup needs social media manager to handle LinkedIn, Twitter, and Instagram. Responsibilities include content creation, community engagement, influencer outreach, and analytics reporting. Must understand B2B tech marketing.',
    category: 'Marketing & Sales',
    subcategory: 'Social Media',
    skills: ['Social Media Marketing', 'Content Creation', 'LinkedIn', 'Twitter', 'Instagram', 'Analytics'],
    budget: { type: 'hourly', amount: 30, currency: 'USD' },
    duration: 'more-than-6-months',
    experienceLevel: 'intermediate',
    projectType: 'ongoing',
    location: 'Remote'
  },
  {
    title: 'Blockchain Developer for NFT Marketplace',
    description: 'Need experienced blockchain developer to build NFT marketplace on Ethereum. Features include minting, buying/selling, wallet integration (MetaMask), and smart contracts. Solidity and Web3.js expertise required.',
    category: 'Web Development',
    subcategory: 'Blockchain',
    skills: ['Blockchain', 'Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts', 'NFT'],
    budget: { type: 'fixed', amount: 8000, currency: 'USD' },
    duration: '3-6-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Copywriter for Landing Pages',
    description: 'Looking for persuasive copywriter to write high-converting landing pages for our SaaS products. Need 5 landing pages with compelling headlines, benefit-focused copy, and strong CTAs. Portfolio of conversion-focused work required.',
    category: 'Writing & Translation',
    subcategory: 'Copywriting',
    skills: ['Copywriting', 'Content Writing', 'SEO', 'Marketing', 'Conversion Optimization'],
    budget: { type: 'fixed', amount: 900, currency: 'USD' },
    duration: '2-4-weeks',
    experienceLevel: 'intermediate',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'iOS Developer for Fitness Tracking App',
    description: 'Need native iOS developer to build fitness tracking app with HealthKit integration, workout plans, progress tracking, and social features. Swift and SwiftUI experience required. App Store submission included.',
    category: 'Mobile Development',
    subcategory: 'iOS Development',
    skills: ['iOS', 'Swift', 'SwiftUI', 'HealthKit', 'Core Data', 'REST API'],
    budget: { type: 'fixed', amount: 6000, currency: 'USD' },
    duration: '3-6-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Illustration Artist for Children\'s Book',
    description: 'Seeking talented illustrator for 24-page children\'s book. Need colorful, engaging illustrations that appeal to ages 4-8. Must provide character designs, scene illustrations, and cover art. Digital format required.',
    category: 'Design & Creative',
    subcategory: 'Illustration',
    skills: ['Illustration', 'Digital Art', 'Character Design', 'Adobe Illustrator', 'Procreate'],
    budget: { type: 'fixed', amount: 1500, currency: 'USD' },
    duration: '1-3-months',
    experienceLevel: 'intermediate',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'QA Tester for Mobile Game',
    description: 'Looking for QA tester to test mobile game across iOS and Android devices. Must identify bugs, test gameplay mechanics, check performance, and document issues. Experience with game testing and bug tracking tools required.',
    category: 'Engineering & Architecture',
    subcategory: 'QA Testing',
    skills: ['QA Testing', 'Mobile Testing', 'Bug Tracking', 'Game Testing', 'JIRA'],
    budget: { type: 'hourly', amount: 25, currency: 'USD' },
    duration: '1-3-months',
    experienceLevel: 'beginner',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Laravel Developer for CRM System',
    description: 'Need Laravel developer to build custom CRM system with contact management, sales pipeline, email integration, and reporting. Must have experience with Laravel 10, MySQL, and Vue.js for frontend components.',
    category: 'Web Development',
    subcategory: 'PHP Development',
    skills: ['Laravel', 'PHP', 'MySQL', 'Vue.js', 'REST API', 'CRM'],
    budget: { type: 'fixed', amount: 4000, currency: 'USD' },
    duration: '3-6-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Podcast Editor and Producer',
    description: 'Weekly podcast needs editor to handle audio editing, noise reduction, intro/outro music, show notes, and episode publishing. Must deliver 4 episodes per month. Experience with Audacity or Adobe Audition required.',
    category: 'Design & Creative',
    subcategory: 'Audio Editing',
    skills: ['Audio Editing', 'Podcast Production', 'Adobe Audition', 'Sound Design', 'Mixing'],
    budget: { type: 'hourly', amount: 35, currency: 'USD' },
    duration: 'more-than-6-months',
    experienceLevel: 'intermediate',
    projectType: 'ongoing',
    location: 'Remote'
  },
  {
    title: 'Excel Expert for Financial Modeling',
    description: 'Need Excel expert to create complex financial models with forecasting, scenario analysis, and automated reporting. Must be proficient in advanced formulas, pivot tables, macros, and VBA. CPA or finance background preferred.',
    category: 'Accounting & Finance',
    subcategory: 'Financial Modeling',
    skills: ['Excel', 'Financial Modeling', 'VBA', 'Data Analysis', 'Forecasting'],
    budget: { type: 'fixed', amount: 1200, currency: 'USD' },
    duration: '2-4-weeks',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Unity Game Developer for 2D Platformer',
    description: 'Looking for Unity developer to create 2D platformer game with 15 levels, character animations, power-ups, and boss fights. Must have experience with Unity 2D, C#, and game physics. Mobile optimization required.',
    category: 'Engineering & Architecture',
    subcategory: 'Game Development',
    skills: ['Unity', 'C#', 'Game Development', '2D Animation', 'Mobile Games'],
    budget: { type: 'fixed', amount: 5000, currency: 'USD' },
    duration: '3-6-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Spanish Translator for Marketing Materials',
    description: 'Need native Spanish translator to translate marketing materials from English to Spanish. Content includes website copy, brochures, email campaigns, and social media posts. Must understand marketing terminology and cultural nuances.',
    category: 'Writing & Translation',
    subcategory: 'Translation',
    skills: ['Spanish Translation', 'English to Spanish', 'Marketing Translation', 'Localization'],
    budget: { type: 'hourly', amount: 28, currency: 'USD' },
    duration: '1-3-months',
    experienceLevel: 'intermediate',
    projectType: 'ongoing',
    location: 'Remote'
  }
];

async function addMoreJobs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find client user
    const client = await User.findOne({ roles: 'client' });
    
    if (!client) {
      console.error('No client found.');
      process.exit(1);
    }

    console.log(`Using client: ${client.name} (${client.email})`);

    // Add clientId to all jobs
    const jobsWithClient = additionalJobs.map(job => ({
      ...job,
      clientId: client._id,
      status: 'open',
      visibility: 'public'
    }));

    // Insert jobs
    const result = await Job.insertMany(jobsWithClient);
    console.log(`\n✅ Successfully added ${result.length} more jobs to the database!`);
    
    console.log('\nNew jobs added:');
    result.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} - ${job.budget.type === 'fixed' ? `$${job.budget.amount}` : `$${job.budget.amount}/hr`}`);
    });

    // Get total job count
    const totalJobs = await Job.countDocuments();
    console.log(`\n📊 Total jobs in database: ${totalJobs}`);

    process.exit(0);
  } catch (error) {
    console.error('Error adding jobs:', error);
    process.exit(1);
  }
}

addMoreJobs();
