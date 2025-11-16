# Fashion Try-On Scripts

This folder contains integration scripts for the Fashion Try-On API endpoints.

## Usage

### Running the Integration Demo

```bash
# Run the complete workflow demonstration
node scripts/fashion-tryon-integration.js
```

### Environment Variables Required

```bash
# FAL AI API Key for fashion try-on model (get from https://fal.ai/)
FAL_KEY=your_fal_api_key

# Gemini API Key for image polishing
GEMINI_API_KEY=your_gemini_api_key

# Remove.bg API Key for background removal
REMOVE_BG_API_KEY=your_remove_bg_api_key

# API Base URL (optional, defaults to localhost:3000)
API_BASE_URL=http://localhost:3000/api/v1
```

## Available Endpoints

### 1. Create Model
**POST** `/api/v1/fashion-tryon/models`

Create a fashion model from person images.

```json
{
  "imageUrls": ["https://example.com/person1.jpg", "https://example.com/person2.jpg"]
}
```

### 2. Try On Clothing
**POST** `/api/v1/fashion-tryon/try-on`

Apply clothing to an existing model and polish the result with Gemini.

```json
{
  "modelId": "https://example.com/person.jpg",
  "clothingImageUrl": "https://example.com/clothing.jpg",
  "gender": "female"
}
```

Note: `modelId` is now the direct image URL of the person, and `gender` is optional (defaults to "female").

### 3. Analyze Clothing
**POST** `/api/v1/fashion-tryon/analyze`

Analyze a clothing item, remove background, and get metadata.

```json
{
  "imageUrl": "https://example.com/clothing.jpg"
}
```

Returns:
```json
{
  "type": "upper body",
  "colour": "blue",
  "description": "Navy blue cotton t-shirt",
  "title": "Classic Navy Tee",
  "imageUrl": "original_url",
  "backgroundRemovedImageUrl": "processed_url"
}
```

## Integration Class

Use the `FashionTryonIntegration` class for programmatic access:

```javascript
const { FashionTryonIntegration } = require('./scripts/fashion-tryon-integration');

const integration = new FashionTryonIntegration();

// Create model
const model = await integration.createModel(['person.jpg']);

// Analyze clothing
const analysis = await integration.analyzeClothing('shirt.jpg');

// Try on clothing
const result = await integration.tryOnClothing(model.id, analysis.backgroundRemovedImageUrl);
```