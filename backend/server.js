const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leetcode_capturer';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema and Model (keep existing)
const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  difficulty: { type: String, required: true },
  description: { type: String, default: '' },
  solution: { type: String, default: '' },
  testCases: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  userId: { type: String, default: 'anonymous' },
  userEmail: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

problemSchema.index({ title: 1 }); 
problemSchema.index({ url: 1 }); 
problemSchema.index({ difficulty: 1 });
problemSchema.index({ tags: 1 }); 
problemSchema.index({ url: 'text', title: 'text', description: 'text', solution: 'text', tags: 'text', difficulty: 'text' }); 
problemSchema.index({ difficulty: 1, tags: 1 }); 
problemSchema.index({ createdAt: -1 }); 

const Problem = mongoose.model('Problem', problemSchema);

// Middleware (keep existing)
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  const validApiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide API key in X-API-Key header or Authorization header'
    });
  }

  if (apiKey !== validApiKey) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid'
    });
  }

  next();
};

// Create API router
const apiRouter = express.Router();

// Logging middleware for API routes
apiRouter.use('/', (req, res, next) => {
  console.log(`endpoint: ${req.method} /api${req.originalUrl}; timestamp: ${new Date().toISOString()}`);
  next();
});

// Move all your existing routes to the apiRouter
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'LeetCode Capturer Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      'GET /api/problems': 'Get all problems (public)',
      'GET /api/problems?search=query': 'Search problems by title, description, or solution',
      'GET /api/problems?difficulty=easy&tags=array': 'Filter problems by difficulty and tags',
      'GET /api/problems/:id': 'Get specific problem (public)',
      'POST /api/problems': 'Create new problem (requires API key)',
      'GET /api/count': 'Get problem count (public)',
      'GET /api/stats': 'Get statistics (public)'
    }
  });
});

apiRouter.get('/problems', async (req, res) => {
  try {
    const { page = 1, limit = 50, difficulty, tags, userId, search } = req.query;
    const query = {};

    if (difficulty) query.difficulty = difficulty;
    if (userId) query.userId = userId;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    let problemsQuery = Problem.find(query).select('-__v'); 
    
    if (search) {
      problemsQuery = problemsQuery.select({ score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
    } else {
      problemsQuery = problemsQuery.sort({ createdAt: -1 });
    }
    
    const problems = await problemsQuery
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Problem.countDocuments(query);

    res.json({
      success: true,
      data: problems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      ...(search && { searchQuery: search }) 
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems',
      message: error.message
    });
  }
});

apiRouter.get('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).select('-__v');

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem',
      message: error.message
    });
  }
});

apiRouter.post('/problems', verifyApiKey, async (req, res) => {
  try {
    const normalizeLeetCodeUrl = (url) => {
      if (!url) return url;
      
      const leetcodeUrlRegex = /leetcode\.com\/problems\/([^\/\?]+)/;
      const match = url.match(leetcodeUrlRegex);
      
      if (match) {
        const problemSlug = match[1];
        return `https://leetcode.com/problems/${problemSlug}`;
      }
      
      return url;
    };

    const {
      title,
      url,
      difficulty,
      description = '',
      solution = '',
      testCases = [],
      tags = [],
      userEmail = ''
    } = req.body;

    const normalizedUrl = normalizeLeetCodeUrl(url);

    if (!title || !normalizedUrl || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'title, url, and difficulty are required'
      });
    }

    const existingProblem = await Problem.findOne({ url: normalizedUrl });
    if (existingProblem) {
      const problem = await Problem.findOneAndUpdate({ _id: existingProblem._id },
        {
          solution,
          title,
          url: normalizedUrl,
          difficulty,
          description,
          solution,
          testCases: Array.isArray(testCases) ? testCases : [],
          tags: Array.isArray(tags) ? tags : [],
          userEmail,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          new: true
        });
      res.status(201).json({
        success: true,
        message: 'Problem updated successfully',
        data: problem
      });
    } else {
      const problem = new Problem({
        title,
        url: normalizedUrl,
        difficulty,
        description,
        solution,
        testCases: Array.isArray(testCases) ? testCases : [],
        tags: Array.isArray(tags) ? tags : [],
        userEmail,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await problem.save();

      res.status(201).json({
        success: true,
        message: 'Problem saved successfully',
        data: problem
      });
    }

  } catch (error) {
    console.error('Error saving problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save problem',
      message: error.message
    });
  }
});

apiRouter.get('/count', async (req, res) => {
  try {
    const count = await Problem.countDocuments({ });

    res.json({
      success: true,
      data: {
        count
      }
    });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem count',
      message: error.message
    });
  }
});

apiRouter.get('/stats', async (req, res) => {
  try {
    const totalProblems = await Problem.countDocuments();
    const difficulties = await Problem.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);
    const topTags = await Problem.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalProblems,
        difficulties: difficulties.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topTags: topTags.map(tag => ({ tag: tag._id, count: tag.count }))
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Mount the API router with /api prefix
app.use('/api', apiRouter);

// Root endpoint (without /api prefix)
app.get('/', (req, res) => {
  res.json({
    message: 'LeetCode Capturer Backend',
    version: '1.0.0',
    status: 'running',
    apiEndpoint: '/api',
    documentation: 'Visit /api for API endpoints'
  });
});

// Error handlers
apiRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found',
    message: `Cannot ${req.method} /api${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;