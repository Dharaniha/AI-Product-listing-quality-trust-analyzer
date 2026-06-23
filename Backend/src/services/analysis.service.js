import * as repo from '../repositories/data.repository.js';
import { runFullAnalysis } from './ai/trustEngine.service.js';
import { ApiError } from '../utils/apiError.js';
import { supabase } from '../config/supabase.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3001';

async function uploadImages(files) {
  if (!files || files.length === 0) return [];

  const urls = await Promise.all(files.map(async (file) => {
    const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;

    const { error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('❌ Image upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('listing-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }));

  return urls.filter(Boolean);
}

export async function runAnalysis(userId, formData, files) {
  console.log('formData received:', JSON.stringify(formData));
  console.log('files received:', files?.length, files?.map(f => f?.originalname));

  // Upload images to Supabase Storage
  const imageUrls = await uploadImages(files);
  console.log('📸 Uploaded image URLs:', imageUrls);

  // Run existing JS scoring engine
  const result = runFullAnalysis(formData);

  // Call AI service with text + image URLs
  try {
    const aiRes = await fetch(`${AI_SERVICE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.productName || 'Untitled',
        description: formData.description || '',
        imageUrls,
      }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();

      result.aiScore = aiData.score;
      result.aiSummary = aiData.summary;
      result.aiTrustFlags = aiData.trust_flags || [];

      const aiSuggestions = (aiData.suggestions || []).map((text, i) => ({
        id: `ai_${i}`,
        text,
        priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
        category: 'ai',
      }));

      result.suggestions = [...aiSuggestions, ...(result.suggestions || [])];

      result.descriptionQuality = Math.round(
        (result.descriptionQuality + aiData.score * 10) / 2
      );

      result.trustScore = Math.round(
        result.completeness * 0.4 +
        result.descriptionQuality * 0.3 +
        (100 - result.duplicateRisk) * 0.2 +
        (100 - result.suspiciousRisk) * 0.1
      );
    }
  } catch (err) {
    console.warn('AI service unavailable, using fallback scoring:', err.message);
  }

  await repo.saveListing(userId, formData, imageUrls);
  await repo.saveAnalysis(userId, formData, result);
  return result;
}

export async function getHistory(userId) {
  return repo.getAnalysisHistory(userId);
}

export async function removeAnalysis(userId, id) {
  const deleted = await repo.deleteAnalysis(userId, id);
  if (!deleted) throw new ApiError(404, 'Analysis not found');
  return true;
}

export async function clearHistory(userId) {
  await repo.clearAnalysisHistory(userId);
  return true;
}