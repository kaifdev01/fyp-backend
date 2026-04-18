// Comprehensive Skills Database - 500+ Skills Organized by Categories

const skillsDatabase = {
  'Web Development': {
    'Frontend': [
      'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 
      'Next.js', 'Nuxt.js', 'Svelte', 'jQuery', 'Bootstrap', 'Tailwind CSS',
      'Material-UI', 'Sass', 'Less', 'Webpack', 'Vite', 'Redux', 'MobX',
      'React Native', 'Flutter Web', 'Ember.js', 'Backbone.js', 'Alpine.js'
    ],
    'Backend': [
      'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'FastAPI',
      'PHP', 'Laravel', 'Symfony', 'CodeIgniter', 'Ruby', 'Ruby on Rails',
      'Java', 'Spring Boot', 'C#', '.NET', 'ASP.NET', 'Go', 'Gin', 'Echo',
      'Rust', 'Actix', 'Elixir', 'Phoenix', 'Scala', 'Play Framework'
    ],
    'Full Stack': [
      'MERN Stack', 'MEAN Stack', 'LAMP Stack', 'JAMstack', 'Serverless',
      'Microservices', 'RESTful API', 'GraphQL', 'WebSockets', 'gRPC'
    ],
    'CMS': [
      'WordPress', 'Drupal', 'Joomla', 'Magento', 'Shopify', 'WooCommerce',
      'PrestaShop', 'OpenCart', 'Contentful', 'Strapi', 'Ghost', 'Webflow'
    ]
  },

  'Mobile Development': {
    'iOS': [
      'Swift', 'Objective-C', 'SwiftUI', 'UIKit', 'Xcode', 'CocoaPods',
      'Carthage', 'Core Data', 'ARKit', 'HealthKit', 'MapKit'
    ],
    'Android': [
      'Kotlin', 'Java', 'Android Studio', 'Jetpack Compose', 'XML Layouts',
      'Room Database', 'Retrofit', 'Dagger', 'Hilt', 'Firebase'
    ],
    'Cross-Platform': [
      'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Cordova', 'PhoneGap',
      'NativeScript', 'Capacitor', 'Expo', 'Unity Mobile'
    ]
  },

  'Design & Creative': {
    'UI/UX Design': [
      'Figma', 'Adobe XD', 'Sketch', 'InVision', 'Axure', 'Balsamiq',
      'Framer', 'Principle', 'ProtoPie', 'Marvel', 'Zeplin', 'Abstract',
      'User Research', 'Wireframing', 'Prototyping', 'Usability Testing',
      'Information Architecture', 'Interaction Design', 'Design Systems'
    ],
    'Graphic Design': [
      'Adobe Photoshop', 'Adobe Illustrator', 'Adobe InDesign', 'CorelDRAW',
      'Affinity Designer', 'Canva', 'GIMP', 'Inkscape', 'Logo Design',
      'Brand Identity', 'Print Design', 'Packaging Design', 'Typography'
    ],
    'Motion Graphics': [
      'Adobe After Effects', 'Adobe Premiere Pro', 'Final Cut Pro',
      'DaVinci Resolve', 'Cinema 4D', 'Blender', 'Maya', '3ds Max',
      'Motion Design', 'Video Editing', 'Animation', 'Visual Effects'
    ],
    '3D Design': [
      'Blender', 'Maya', 'Cinema 4D', '3ds Max', 'ZBrush', 'Substance Painter',
      'Houdini', 'SketchUp', 'Rhino', 'AutoCAD', '3D Modeling', '3D Animation'
    ]
  },

  'Data Science & Analytics': {
    'Data Science': [
      'Python', 'R', 'Julia', 'Machine Learning', 'Deep Learning',
      'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas',
      'NumPy', 'SciPy', 'Natural Language Processing', 'Computer Vision',
      'Neural Networks', 'Statistical Analysis', 'Data Mining'
    ],
    'Data Analytics': [
      'SQL', 'Excel', 'Power BI', 'Tableau', 'Google Analytics',
      'Looker', 'Qlik', 'Data Visualization', 'Business Intelligence',
      'Statistical Modeling', 'Predictive Analytics', 'A/B Testing'
    ],
    'Big Data': [
      'Hadoop', 'Spark', 'Kafka', 'Hive', 'Pig', 'HBase', 'Cassandra',
      'MongoDB', 'Redis', 'Elasticsearch', 'Data Warehousing', 'ETL'
    ]
  },

  'DevOps & Cloud': {
    'Cloud Platforms': [
      'AWS', 'Azure', 'Google Cloud', 'DigitalOcean', 'Heroku', 'Vercel',
      'Netlify', 'Firebase', 'Supabase', 'Railway', 'Render'
    ],
    'DevOps Tools': [
      'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI/CD', 'GitHub Actions',
      'CircleCI', 'Travis CI', 'Ansible', 'Terraform', 'Vagrant',
      'Chef', 'Puppet', 'Prometheus', 'Grafana', 'ELK Stack'
    ],
    'Version Control': [
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial'
    ]
  },

  'Database': {
    'SQL Databases': [
      'MySQL', 'PostgreSQL', 'SQL Server', 'Oracle', 'SQLite', 'MariaDB'
    ],
    'NoSQL Databases': [
      'MongoDB', 'Cassandra', 'Redis', 'Couchbase', 'DynamoDB',
      'Firebase Realtime Database', 'Neo4j', 'ArangoDB'
    ]
  },

  'Marketing & Sales': {
    'Digital Marketing': [
      'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Instagram Marketing',
      'LinkedIn Marketing', 'Twitter Marketing', 'TikTok Marketing',
      'Email Marketing', 'Content Marketing', 'Influencer Marketing',
      'Affiliate Marketing', 'Growth Hacking', 'Marketing Automation'
    ],
    'Social Media': [
      'Social Media Management', 'Community Management', 'Social Media Strategy',
      'Hootsuite', 'Buffer', 'Sprout Social', 'Later', 'Canva'
    ],
    'Analytics': [
      'Google Analytics', 'Google Tag Manager', 'Facebook Pixel',
      'Mixpanel', 'Amplitude', 'Hotjar', 'Crazy Egg', 'SEMrush', 'Ahrefs'
    ]
  },

  'Writing & Translation': {
    'Content Writing': [
      'Blog Writing', 'Article Writing', 'Copywriting', 'Technical Writing',
      'Creative Writing', 'Ghostwriting', 'SEO Writing', 'Product Descriptions',
      'Press Releases', 'White Papers', 'Case Studies', 'eBook Writing'
    ],
    'Translation': [
      'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
      'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
      'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Polish', 'Turkish'
    ],
    'Editing': [
      'Proofreading', 'Copy Editing', 'Line Editing', 'Developmental Editing',
      'Fact Checking', 'Grammar', 'Style Guide', 'AP Style', 'Chicago Style'
    ]
  },

  'Business & Consulting': {
    'Business Strategy': [
      'Business Planning', 'Market Research', 'Competitive Analysis',
      'SWOT Analysis', 'Business Model Canvas', 'Financial Modeling',
      'Pitch Deck Creation', 'Investor Relations', 'Strategic Planning'
    ],
    'Project Management': [
      'Agile', 'Scrum', 'Kanban', 'Waterfall', 'JIRA', 'Trello', 'Asana',
      'Monday.com', 'Basecamp', 'MS Project', 'PMP', 'Prince2'
    ],
    'HR & Recruiting': [
      'Recruitment', 'Talent Acquisition', 'HR Management', 'Payroll',
      'Employee Relations', 'Performance Management', 'Training & Development'
    ]
  },

  'Legal & Finance': {
    'Legal': [
      'Contract Law', 'Corporate Law', 'Intellectual Property', 'Legal Research',
      'Legal Writing', 'Compliance', 'Trademark', 'Patent', 'Copyright'
    ],
    'Accounting & Finance': [
      'Bookkeeping', 'QuickBooks', 'Xero', 'Accounting', 'Financial Analysis',
      'Tax Preparation', 'Payroll', 'Budgeting', 'Financial Planning',
      'Investment Analysis', 'Risk Management', 'Auditing'
    ]
  },

  'Customer Support': {
    'Support': [
      'Customer Service', 'Technical Support', 'Help Desk', 'Live Chat',
      'Email Support', 'Phone Support', 'Zendesk', 'Freshdesk', 'Intercom',
      'Salesforce', 'HubSpot', 'Zoho', 'Troubleshooting', 'CRM'
    ]
  },

  'Engineering & Architecture': {
    'CAD & Design': [
      'AutoCAD', 'SolidWorks', 'CATIA', 'Revit', 'SketchUp', 'Rhino',
      'ArchiCAD', 'Civil 3D', 'Fusion 360', 'Inventor', 'ANSYS'
    ],
    'Engineering': [
      'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
      'Chemical Engineering', 'Structural Engineering', 'HVAC Design',
      'MEP Design', 'BIM', 'FEA Analysis', 'CFD Analysis'
    ]
  },

  'Game Development': {
    'Game Engines': [
      'Unity', 'Unreal Engine', 'Godot', 'GameMaker', 'CryEngine',
      'Construct', 'RPG Maker', 'Cocos2d', 'Phaser'
    ],
    'Game Design': [
      'Game Design', 'Level Design', 'Character Design', 'Game Mechanics',
      'Game Art', '2D Animation', '3D Animation', 'Sound Design', 'Music Composition'
    ]
  },

  'Blockchain & Crypto': {
    'Blockchain': [
      'Solidity', 'Ethereum', 'Smart Contracts', 'Web3.js', 'Truffle',
      'Hardhat', 'Bitcoin', 'Hyperledger', 'Polygon', 'Binance Smart Chain',
      'NFT Development', 'DeFi', 'DAO', 'Cryptocurrency'
    ]
  },

  'AI & Machine Learning': {
    'AI/ML': [
      'Artificial Intelligence', 'Machine Learning', 'Deep Learning',
      'Neural Networks', 'Computer Vision', 'NLP', 'Reinforcement Learning',
      'TensorFlow', 'PyTorch', 'OpenCV', 'YOLO', 'GPT', 'LLM', 'ChatGPT API'
    ]
  },

  'Cybersecurity': {
    'Security': [
      'Penetration Testing', 'Ethical Hacking', 'Network Security',
      'Application Security', 'Cloud Security', 'Cryptography',
      'Security Auditing', 'Vulnerability Assessment', 'SIEM',
      'Firewall', 'IDS/IPS', 'Security Compliance', 'ISO 27001'
    ]
  },

  'Other Skills': {
    'Soft Skills': [
      'Communication', 'Leadership', 'Problem Solving', 'Critical Thinking',
      'Time Management', 'Teamwork', 'Adaptability', 'Creativity'
    ],
    'Tools': [
      'Microsoft Office', 'Google Workspace', 'Slack', 'Zoom', 'Teams',
      'Notion', 'Evernote', 'Dropbox', 'OneDrive', 'Google Drive'
    ]
  }
};

// Flatten all skills into a single array
const getAllSkills = () => {
  const allSkills = [];
  Object.values(skillsDatabase).forEach(category => {
    Object.values(category).forEach(subcategory => {
      allSkills.push(...subcategory);
    });
  });
  return [...new Set(allSkills)].sort();
};

// Get skills by category
const getSkillsByCategory = (category) => {
  return skillsDatabase[category] || {};
};

// Search skills
const searchSkills = (query) => {
  const allSkills = getAllSkills();
  const lowerQuery = query.toLowerCase();
  return allSkills.filter(skill => 
    skill.toLowerCase().includes(lowerQuery)
  );
};

// Get popular skills (top 50)
const getPopularSkills = () => {
  return [
    'JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS', 'TypeScript',
    'Java', 'PHP', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'Angular',
    'Vue.js', 'C#', '.NET', 'Ruby', 'Go', 'Swift', 'Kotlin', 'Flutter',
    'React Native', 'Django', 'Flask', 'Laravel', 'Spring Boot', 'Express.js',
    'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API', 'Microservices',
    'Kubernetes', 'CI/CD', 'Agile', 'Scrum', 'UI/UX Design', 'Figma',
    'Adobe Photoshop', 'Adobe Illustrator', 'SEO', 'Digital Marketing',
    'Content Writing', 'Data Analysis', 'Machine Learning', 'TensorFlow'
  ];
};

module.exports = {
  skillsDatabase,
  getAllSkills,
  getSkillsByCategory,
  searchSkills,
  getPopularSkills
};
