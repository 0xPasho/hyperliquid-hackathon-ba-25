// Using built-in fetch (Node.js 18+)

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

class FashionTryonIntegration {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async createModel(imageUrls) {
    const response = await fetch(`${this.baseUrl}/fashion-tryon/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create model');
    }

    return result.data;
  }

  async tryOnClothing(modelId, clothingImageUrl, gender = 'female') {
    const response = await fetch(`${this.baseUrl}/fashion-tryon/try-on`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId, clothingImageUrl, gender }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to try on clothing');
    }

    return result.data;
  }

  async analyzeClothing(imageUrl) {
    const response = await fetch(`${this.baseUrl}/fashion-tryon/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze clothing');
    }

    return result.data;
  }
}

async function demonstrateWorkflow() {
  const integration = new FashionTryonIntegration();

  try {
    console.log('🚀 Starting Fashion Try-On Demo...');
    console.log(`📡 API URL: ${integration.baseUrl}`);
    console.log('⚠️  Make sure your API server is running with: npm run dev\n');
    
    console.log('📸 Sample images we will use:');
    const personImages = [
      'https://images.easelai.com/tryon/woman.webp',
      'https://thumbs.dreamstime.com/b/silhouette-figure-standing-feet-apart-issilhouette-human-arms-slightly-bent-sides-completely-black-featureless-382701591.jpg',
    ];
    const clothingImage = 'https://ae-pic-a1.aliexpress-media.com/kf/S1cf928fa7e1b4172978db31b6f21337ap.jpg_960x960q75.jpg_.avif';
    
    console.log('👤 Person images:', personImages);
    console.log('👔 Clothing image:', clothingImage);
    console.log('');
    
    console.log('1️⃣  Creating a model from person images...');
    const model = await integration.createModel(personImages);
    console.log('✅ Model created successfully!');
    console.log('📋 Model details:', JSON.stringify(model, null, 2));
    console.log('');

    console.log('2️⃣  Analyzing clothing item...');
    const clothingAnalysis = await integration.analyzeClothing(clothingImage);
    console.log('✅ Clothing analysis complete!');
    console.log('📋 Analysis results:', JSON.stringify(clothingAnalysis, null, 2));
    console.log('');

    console.log('3️⃣  Trying on the clothing...');
    console.log('🔗 Using model image:', model.modelUrl);
    console.log('🔗 Using clothing image:', clothingAnalysis.backgroundRemovedImageUrl);
    
    const tryOnResult = await integration.tryOnClothing(
      model.modelUrl,
      clothingAnalysis.backgroundRemovedImageUrl,
      'female'
    );
    console.log('✅ Try-on complete!');
    console.log('📋 Try-on results:', JSON.stringify(tryOnResult, null, 2));
    console.log('');

    console.log('🎉 Workflow completed successfully!');
    console.log('');
    console.log('📸 FINAL IMAGE URLS:');
    console.log('🖼️  Original result:', tryOnResult.resultImageUrl);
    console.log('✨ Polished result:', tryOnResult.polishedImageUrl);
    
    return {
      model,
      clothingAnalysis,
      tryOnResult,
    };

  } catch (error) {
    console.error('❌ Workflow failed:', error);
    if (error.message) {
      console.error('📝 Error message:', error.message);
    }
    throw error;
  }
}

if (require.main === module) {
  demonstrateWorkflow()
    .then(() => console.log('Demo completed'))
    .catch(console.error);
}

module.exports = {
  FashionTryonIntegration,
  demonstrateWorkflow
};