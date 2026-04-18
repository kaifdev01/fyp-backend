const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
require('dotenv').config();

const jobs = [
  {
    title: 'Full Stack Developer for E-commerce Platform',
    description: 'We are looking for an experienced full stack developer to build a modern e-commerce platform. The project includes user authentication, product catalog, shopping cart, payment integration (Stripe), and admin dashboard. Tech stack: React, Node.js, MongoDB, Express. Must have experience with responsive design and RESTful APIs.',
    category: 'Web Development',
    subcategory: 'Full Stack Development',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'REST API', 'Stripe'],
    budget: { type: 'fixed', amount: 3500, currency: 'USD' },
    duration: '1-3-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Mobile App UI/UX Designer Needed',
    description: 'Looking for a talented UI/UX designer to create modern, intuitive designs for our fitness tracking mobile app. Deliverables include wireframes, high-fidelity mockups, and interactive prototypes. Must be proficient in Figma and have experience with iOS and Android design guidelines.',
    category: 'Design & Creative',
    subcategory: 'UI/UX Design',
    skills: ['Figma', 'UI Design', 'UX Design', 'Mobile Design', 'Prototyping', 'Adobe XD'],
    budget: { type: 'fixed', amount: 1200, currency: 'USD' },
    duration: '2-4-weeks',
    experienceLevel: 'intermediate',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Python Data Scientist for ML Model Development',
    description: 'Seeking an experienced data scientist to develop machine learning models for customer churn prediction. Project involves data preprocessing, feature engineering, model training, and deployment. Required skills: Python, scikit-learn, pandas, TensorFlow/PyTorch. Experience with AWS SageMaker is a plus.',
    category: 'Data Science & Analytics',
    subcategory: 'Machine Learning',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'scikit-learn', 'pandas', 'Data Analysis'],
    budget: { type: 'hourly', amount: 65, currency: 'USD' },
    duration: '1-3-months',
    experienceLevel: 'expert',
    projectType: 'ongoing',
    location: 'Remote'
  },
  {
    title: 'Content Writer for Tech Blog',
    description: 'We need a skilled content writer to create engaging blog posts about emerging technologies, software development, and digital transformation. Must produce 8-10 articles per month (1500-2000 words each). SEO knowledge required. Topics include AI, cloud computing, cybersecurity, and web development.',
    category: 'Writing & Translation',
    subcategory: 'Content Writing',
    skills: ['Content Writing', 'SEO', 'Technical Writing', 'Blog Writing', 'Research'],
    budget: { type: 'hourly', amount: 25, currency: 'USD' },
    duration: '3-6-months',
    experienceLevel: 'intermediate',
    projectType: 'ongoing',
    location: 'Remote'
  },
  {
    title: 'React Native Developer for Social Media App',
    description: 'Looking for a React Native developer to build a cross-platform social media application. Features include user profiles, posts, comments, likes, real-time chat, and push notifications. Must have experience with Firebase, Redux, and React Navigation. Clean code and documentation required.',
    category: 'Mobile Development',
    subcategory: 'React Native',
    skills: ['React Native', 'JavaScript', 'Firebase', 'Redux', 'Mobile Development', 'iOS', 'Android'],
    budget: { type: 'fixed', amount: 4500, currency: 'USD' },
    duration: '3-6-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'WordPress Website Development & Customization',
    description: 'Need a WordPress developer to create a professional business website with custom theme development. Requirements include responsive design, contact forms, blog section, SEO optimization, and speed optimization. Experience with Elementor and WooCommerce is preferred.',
    category: 'Web Development',
    subcategory: 'WordPress',
    skills: ['WordPress', 'PHP', 'HTML', 'CSS', 'JavaScript', 'Elementor', 'WooCommerce'],
    budget: { type: 'fixed', amount: 800, currency: 'USD' },
    duration: '2-4-weeks',
    experienceLevel: 'intermediate',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Digital Marketing Specialist for Startup',
    description: 'Startup seeking a digital marketing expert to develop and execute comprehensive marketing strategy. Responsibilities include social media management, Google Ads campaigns, email marketing, content strategy, and analytics reporting. Must have proven track record of increasing brand awareness and conversions.',
    category: 'Marketing & Sales',
    subcategory: 'Digital Marketing',
    skills: ['Digital Marketing', 'Social Media Marketing', 'Google Ads', 'SEO', 'Email Marketing', 'Analytics'],
    budget: { type: 'hourly', amount: 35, currency: 'USD' },
    duration: 'more-than-6-months',
    experienceLevel: 'intermediate',
    projectType: 'ongoing',
    location: 'Remote'
  },
  {
    title: 'Logo Design and Brand Identity Package',
    description: 'Looking for a creative graphic designer to create a complete brand identity package for our new tech startup. Deliverables include logo design (multiple concepts), color palette, typography, business cards, letterhead, and brand guidelines. Portfolio review required.',
    category: 'Design & Creative',
    subcategory: 'Graphic Design',
    skills: ['Logo Design', 'Graphic Design', 'Adobe Illustrator', 'Branding', 'Adobe Photoshop'],
    budget: { type: 'fixed', amount: 600, currency: 'USD' },
    duration: '1-2-weeks',
    experienceLevel: 'intermediate',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'DevOps Engineer for CI/CD Pipeline Setup',
    description: 'Need an experienced DevOps engineer to set up CI/CD pipelines for our microservices architecture. Tasks include Docker containerization, Kubernetes orchestration, Jenkins/GitHub Actions setup, monitoring with Prometheus/Grafana, and AWS infrastructure management. Security best practices required.',
    category: 'Engineering & Architecture',
    subcategory: 'DevOps',
    skills: ['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Jenkins', 'Linux'],
    budget: { type: 'hourly', amount: 75, currency: 'USD' },
    duration: '1-3-months',
    experienceLevel: 'expert',
    projectType: 'one-time',
    location: 'Remote'
  },
  {
    title: 'Video Editor for YouTube Channel',
    description: 'Seeking a talented video editor for our educational YouTube channel. Need someone to edit 4-6 videos per week (10-15 minutes each). Responsibilities include cutting footage, adding transitions, color grading, sound design, motion graphics, and thumbnails. Must be proficient in Adobe Premiere Pro or Final Cut Pro.',
    category: 'Design & Creative',
    subcategory: 'Video Editing',
    skills: ['Video Editing', 'Adobe Premiere Pro', 'After Effects', 'Color Grading', 'Motion Graphics'],
    budget: { type: 'hourly', amount: 30, currency: 'USD' },
    duration: 'more-than-6-months',
    experienceLevel: 'intermediate',
    projectType: 'ongoing',
    location: 'Remote'
  }
];

async function addJobs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a client user to assign jobs to
    const client = await User.findOne({ roles: 'client' });
    
    if (!client) {
      console.error('No client found. Please create a client user first.');
      process.exit(1);
    }

    console.log(`Using client: ${client.name} (${client.email})`);

    // Add clientId to all jobs
    const jobsWithClient = jobs.map(job => ({
      ...job,
      clientId: client._id,
      status: 'open',
      visibility: 'public'
    }));

    // Insert jobs
    const result = await Job.insertMany(jobsWithClient);
    console.log(`\n✅ Successfully added ${result.length} jobs to the database!`);
    
    result.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} - ${job.budget.type === 'fixed' ? `$${job.budget.amount}` : `$${job.budget.amount}/hr`}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error adding jobs:', error);
    process.exit(1);
  }
}

addJobs();
