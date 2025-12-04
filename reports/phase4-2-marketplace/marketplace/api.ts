// Marketplace REST API
import express from 'express';

const router = express.Router();

// GET /plugins - List all plugins
router.get('/plugins', async (req, res) => {
  const { category, search, sort, limit = 50 } = req.query;
  
  let plugins = await db.plugins.findMany({
    where: {
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } }
        ]
      })
    },
    include: {
      author: true,
      stats: true,
      reviews: true
    },
    orderBy: sort === 'downloads' 
      ? { downloads: 'desc' }
      : { rating: 'desc' },
    take: Number(limit)
  });
  
  res.json({ plugins, total: plugins.length });
});

// GET /plugins/:id - Get plugin details
router.get('/plugins/:id', async (req, res) => {
  const plugin = await db.plugins.findUnique({
    where: { id: req.params.id },
    include: {
      author: true,
      versions: true,
      reviews: { take: 10, orderBy: { createdAt: 'desc' } },
      stats: true
    }
  });
  
  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }
  
  res.json(plugin);
});

// POST /plugins - Publish new plugin
router.post('/plugins', authenticate, async (req, res) => {
  const { name, description, category, version, packageUrl } = req.body;
  
  // Validate plugin package
  const validation = await validatePlugin(packageUrl);
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }
  
  const plugin = await db.plugins.create({
    data: {
      name,
      description,
      category,
      authorId: req.user.id,
      versions: {
        create: {
          version,
          packageUrl,
          changelog: req.body.changelog
        }
      }
    }
  });
  
  res.status(201).json(plugin);
});

// POST /plugins/:id/install - Track installation
router.post('/plugins/:id/install', async (req, res) => {
  await db.plugins.update({
    where: { id: req.params.id },
    data: { downloads: { increment: 1 } }
  });
  
  res.json({ success: true });
});

// POST /plugins/:id/reviews - Add review
router.post('/plugins/:id/reviews', authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  
  const review = await db.reviews.create({
    data: {
      pluginId: req.params.id,
      userId: req.user.id,
      rating,
      comment
    }
  });
  
  // Update plugin average rating
  await updatePluginRating(req.params.id);
  
  res.status(201).json(review);
});

export default router;
