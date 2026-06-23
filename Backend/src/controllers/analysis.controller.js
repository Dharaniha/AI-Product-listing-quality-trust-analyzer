import * as analysisService from '../services/analysis.service.js';

export async function runAnalysis(req, res) {
  const result = await analysisService.runAnalysis(
    req.user.email,
    req.body,
    req.files || []
  );
  res.json(result);
}

export async function getHistory(req, res) {
  const history = await analysisService.getHistory(req.user.email);
  res.json({ success: true, data: history });
}

export async function deleteAnalysis(req, res) {
  await analysisService.removeAnalysis(req.user.email, req.params.id);
  res.json({ success: true, message: 'Analysis deleted' });
}

export async function clearHistory(req, res) {
  await analysisService.clearHistory(req.user.email);
  res.json({ success: true, message: 'History cleared' });
}