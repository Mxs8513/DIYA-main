/**
 * AI Workflow Service
 * Modular AI functions for routing, classification, confidence scoring,
 * cluster detection, and intervention generation.
 */

const Anthropic = require('@anthropic-ai/sdk');

let anthropic = null;
let db = null;

function init(database, apiKey) {
  db = database;
  if (apiKey) anthropic = new Anthropic({ apiKey });
}

// ─── Text Similarity (Jaccard on tokens, no embedding needed) ────────────────
function tokenize(text) {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
  );
}

function jaccardSimilarity(a, b) {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

// ─── detectDuplicateQuestion ─────────────────────────────────────────────────
async function detectDuplicateQuestion(questionText, groupId, threshold = 0.45) {
  const existing = db.prepare(`
    SELECT fq.id, fq.title, fq.body, fq.ai_status, fq.ai_answer,
           aa.answer as approved_answer, aa.id as approved_answer_id
    FROM forum_questions fq
    LEFT JOIN approved_answers aa ON aa.group_id = fq.group_id AND aa.source_question_id = fq.id
    WHERE fq.group_id = ?
    ORDER BY fq.created_at DESC LIMIT 80
  `).all(groupId);

  let bestMatch = null;
  let bestScore = 0;

  for (const q of existing) {
    const combined = `${q.title} ${q.body}`;
    const score = jaccardSimilarity(questionText, combined);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = q;
    }
  }

  if (bestScore >= threshold && bestMatch) {
    return {
      isDuplicate: true,
      similarity: bestScore,
      matchedQuestionId: bestMatch.id,
      matchedTitle: bestMatch.title,
      hasApprovedAnswer: !!bestMatch.approved_answer,
      approvedAnswer: bestMatch.approved_answer || bestMatch.ai_answer,
    };
  }
  return { isDuplicate: false, similarity: bestScore };
}

// ─── classifyTopic ───────────────────────────────────────────────────────────
const TOPIC_CATEGORIES = [
  'Recursion & Iteration', 'Data Structures', 'Algorithms',
  'Object-Oriented Programming', 'Debugging & Testing',
  'Development Environment', 'Exam Preparation',
  'Projects & Assignments', 'Theory & Concepts',
  'Syntax & Language', 'Memory & Performance', 'Other'
];

async function classifyTopic(questionText) {
  if (!anthropic) {
    const lower = questionText.toLowerCase();
    if (lower.includes('recurs') || lower.includes('loop') || lower.includes('iterati')) return 'Recursion & Iteration';
    if (lower.includes('array') || lower.includes('list') || lower.includes('tree') || lower.includes('stack') || lower.includes('queue')) return 'Data Structures';
    if (lower.includes('sort') || lower.includes('search') || lower.includes('complex') || lower.includes('big o')) return 'Algorithms';
    if (lower.includes('class') || lower.includes('object') || lower.includes('inherit') || lower.includes('polymor')) return 'Object-Oriented Programming';
    if (lower.includes('debug') || lower.includes('test') || lower.includes('error') || lower.includes('bug')) return 'Debugging & Testing';
    if (lower.includes('project') || lower.includes('assignment') || lower.includes('homework') || lower.includes('submit')) return 'Projects & Assignments';
    if (lower.includes('exam') || lower.includes('midterm') || lower.includes('final') || lower.includes('quiz')) return 'Exam Preparation';
    if (lower.includes('install') || lower.includes('setup') || lower.includes('environment') || lower.includes('ide')) return 'Development Environment';
    return 'Other';
  }

  try {
    const start = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `Classify this academic question into exactly one of these categories. Return only the category name, nothing else.

Categories: ${TOPIC_CATEGORIES.join(', ')}

Question: "${questionText.slice(0, 400)}"`,
      }],
    });
    logMetric('classifyTopic', 'claude-haiku-4-5-20251001', Date.now() - start, true, null, message.usage?.input_tokens + message.usage?.output_tokens);
    const result = message.content[0].text.trim();
    return TOPIC_CATEGORIES.includes(result) ? result : 'Other';
  } catch (err) {
    logMetric('classifyTopic', 'claude-haiku-4-5-20251001', 0, false, err.message, 0);
    return 'Other';
  }
}

// ─── generateAnswerDraft ─────────────────────────────────────────────────────
async function generateAnswerDraft(title, body, topic, ragChunks = []) {
  if (!anthropic) return null;

  const hasRAG = ragChunks && ragChunks.length > 0;
  const ragSection = hasRAG
    ? `\n\nRELEVANT COURSE MATERIALS (retrieved from uploaded documents):\n${ragChunks.map((c, i) => `[${i + 1}] (from "${c.filename}"): ${c.text.slice(0, 600)}`).join('\n\n')}\n\nUse the above course materials to ground your answer. Cite the source file name when referencing them.`
    : '';

  try {
    const start = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `You are an academic assistant helping students in a ${topic || 'computer science'} course.
Answer this student question clearly and educationally. Be concise (2-4 paragraphs).${ragSection}

Question: ${title}
${body || ''}`,
      }],
    });
    logMetric('generateAnswerDraft', 'claude-haiku-4-5-20251001', Date.now() - start, true, null, message.usage?.input_tokens + message.usage?.output_tokens);
    return message.content[0].text;
  } catch (err) {
    logMetric('generateAnswerDraft', 'claude-haiku-4-5-20251001', 0, false, err.message, 0);
    return null;
  }
}

// ─── scoreAIConfidence ───────────────────────────────────────────────────────
async function scoreAIConfidence(question, answer) {
  if (!anthropic || !answer) return 0.7;
  try {
    const start = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `Rate the confidence of this AI-generated answer on a scale of 0.0 to 1.0.
Consider: accuracy, completeness, clarity, and whether the question is well-defined.
Return only JSON: {"confidence": 0.85, "reason": "brief reason"}

Question: "${question.slice(0, 300)}"
Answer: "${answer.slice(0, 500)}"`,
      }],
    });
    logMetric('scoreAIConfidence', 'claude-haiku-4-5-20251001', Date.now() - start, true, null, message.usage?.input_tokens + message.usage?.output_tokens);
    try {
      const text = message.content[0].text.trim();
      const json = JSON.parse(text.startsWith('{') ? text : text.slice(text.indexOf('{')));
      return Math.min(1, Math.max(0, json.confidence || 0.7));
    } catch {
      return 0.7;
    }
  } catch (err) {
    logMetric('scoreAIConfidence', 'claude-haiku-4-5-20251001', 0, false, err.message, 0);
    return 0.7;
  }
}

// ─── detectConfusionClusters ─────────────────────────────────────────────────
async function detectAndUpdateClusters(groupId) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentQuestions = db.prepare(`
    SELECT topic FROM forum_questions
    WHERE group_id = ? AND created_at > ? AND topic IS NOT NULL AND topic != 'Other'
  `).all(groupId, cutoff);

  const topicCounts = {};
  for (const q of recentQuestions) {
    topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
  }

  for (const [topic, count] of Object.entries(topicCounts)) {
    const severity = count >= 10 ? 'critical' : count >= 6 ? 'high' : count >= 3 ? 'medium' : 'low';
    const existing = db.prepare('SELECT * FROM confusion_clusters WHERE group_id = ? AND topic = ?').get(groupId, topic);

    if (existing) {
      db.prepare(`UPDATE confusion_clusters SET question_count = ?, severity = ?, last_seen = datetime('now')
                  WHERE id = ?`).run(count, severity, existing.id);
    } else {
      db.prepare(`INSERT INTO confusion_clusters (group_id, topic, question_count, severity)
                  VALUES (?, ?, ?, ?)`).run(groupId, topic, count, severity);
    }
  }

  return topicCounts;
}

// ─── recommendIntervention ───────────────────────────────────────────────────
async function recommendIntervention(cluster) {
  if (!anthropic) {
    return {
      type: 'review_session',
      title: `Review Session: ${cluster.topic}`,
      content: `Consider hosting a 45-minute review session focused on ${cluster.topic}. ${cluster.question_count} students have asked related questions in the past week.`,
      urgency: cluster.severity,
    };
  }

  try {
    const start = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are helping a professor manage a class where ${cluster.question_count} students are confused about "${cluster.topic}" (severity: ${cluster.severity}).

Suggest an intervention. Return JSON only:
{
  "type": "review_session|announcement|office_hours|resource",
  "title": "Short action title",
  "content": "2-3 sentence explanation and recommended action for the professor",
  "urgency": "low|medium|high|critical"
}`,
      }],
    });
    logMetric('recommendIntervention', 'claude-haiku-4-5-20251001', Date.now() - start, true, null, 0);
    const text = message.content[0].text.trim();
    return JSON.parse(text.startsWith('{') ? text : text.slice(text.indexOf('{')));
  } catch (err) {
    logMetric('recommendIntervention', 'claude-haiku-4-5-20251001', 0, false, err.message, 0);
    return {
      type: 'review_session',
      title: `Address: ${cluster.topic}`,
      content: `${cluster.question_count} students have questions about ${cluster.topic}. Consider a review session or targeted announcement.`,
      urgency: cluster.severity,
    };
  }
}

// ─── generateProfessorAnnouncement ───────────────────────────────────────────
async function generateProfessorAnnouncement(topic, insights) {
  if (!anthropic) return `Dear class, I've noticed several questions about ${topic}. I'll address this in our next session.`;
  try {
    const start = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{
        role: 'user',
        content: `Draft a professional professor announcement to the class about ${topic}.
Context: ${insights}
Keep it under 150 words, warm but professional, actionable.`,
      }],
    });
    logMetric('generateAnnouncement', 'claude-haiku-4-5-20251001', Date.now() - start, true, null, 0);
    return message.content[0].text;
  } catch (err) {
    logMetric('generateAnnouncement', 'claude-haiku-4-5-20251001', 0, false, err.message, 0);
    return `Dear class, I've noticed several questions about ${topic}. I'll address this comprehensively in our upcoming sessions.`;
  }
}

// ─── summarizeDiscussionThread ───────────────────────────────────────────────
async function summarizeDiscussionThread(question, replies) {
  if (!anthropic || replies.length < 2) return null;
  const thread = [question, ...replies.map(r => r.body)].join('\n\n');
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Summarize this discussion thread in 2-3 sentences, capturing the key question and resolution:\n\n${thread.slice(0, 2000)}`,
      }],
    });
    return message.content[0].text;
  } catch {
    return null;
  }
}

// ─── explainHomeworkMistake ──────────────────────────────────────────────────
async function explainHomeworkMistake(rubricSection, studentWork, feedback) {
  if (!anthropic) return feedback;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Explain this student's mistake clearly and constructively. Be educational, not just critical.
Rubric criterion: ${rubricSection}
Student's work: ${studentWork.slice(0, 500)}
Issue: ${feedback}

Provide a clear 2-3 sentence explanation with a concrete fix suggestion.`,
      }],
    });
    return message.content[0].text;
  } catch {
    return feedback;
  }
}

// ─── Full Workflow Router ─────────────────────────────────────────────────────
async function routeQuestion(questionId, groupId, title, body) {
  const fullText = `${title} ${body}`;
  const result = {
    questionId,
    routing_decision: 'normal',
    topic: 'Other',
    confidence_score: null,
    duplicate_of: null,
    escalation_reason: null,
    auto_answer: null,
    rag_sources: [],
  };

  // 1. Classify topic
  result.topic = await classifyTopic(fullText);
  db.prepare('UPDATE forum_questions SET topic = ? WHERE id = ?').run(result.topic, questionId);

  // 2. Check for duplicates (only check existing questions, not current)
  const dupCheck = await detectDuplicateQuestion(fullText, groupId);
  if (dupCheck.isDuplicate && dupCheck.matchedQuestionId !== questionId) {
    result.routing_decision = 'duplicate';
    result.duplicate_of = dupCheck.matchedQuestionId;
    if (dupCheck.hasApprovedAnswer) {
      result.auto_answer = dupCheck.approvedAnswer;
      db.prepare('UPDATE forum_questions SET ai_answer = ?, ai_status = ?, routing_decision = ?, topic = ?, duplicate_of = ? WHERE id = ?')
        .run(dupCheck.approvedAnswer, 'verified', 'duplicate', result.topic, dupCheck.matchedQuestionId, questionId);
      // Increment usage count on approved answer
      db.prepare('UPDATE approved_answers SET usage_count = usage_count + 1 WHERE source_question_id = ? AND group_id = ?')
        .run(dupCheck.matchedQuestionId, groupId);
    } else {
      db.prepare('UPDATE forum_questions SET routing_decision = ?, topic = ?, duplicate_of = ? WHERE id = ?')
        .run('duplicate', result.topic, dupCheck.matchedQuestionId, questionId);
    }

    await recordWorkflowItem(questionId, groupId, result);
    await detectAndUpdateClusters(groupId);
    return result;
  }

  // 3. RAG retrieval — find relevant course material chunks
  let ragChunks = [];
  try {
    const rag = require('./rag');
    ragChunks = await rag.retrieve(db, groupId, fullText, 4);
    if (ragChunks.length > 0) {
      result.rag_sources = [...new Set(ragChunks.map(c => c.filename))];
    }
  } catch (ragErr) {
    // RAG is optional — if model not loaded yet or no docs, continue without it
  }

  // 4. Generate AI answer (with RAG context injected if available)
  const answer = await generateAnswerDraft(title, body, result.topic, ragChunks);
  if (answer) {
    const ragSourcesJson = result.rag_sources.length > 0 ? JSON.stringify(result.rag_sources) : null;
    db.prepare('UPDATE forum_questions SET ai_answer = ?, ai_status = ?, rag_sources = ? WHERE id = ?').run(answer, 'pending', ragSourcesJson, questionId);

    // 5. Score confidence
    result.confidence_score = await scoreAIConfidence(fullText, answer);
    db.prepare('UPDATE forum_questions SET confidence_score = ? WHERE id = ?').run(result.confidence_score, questionId);

    if (result.confidence_score < 0.55) {
      result.routing_decision = 'low_confidence';
      result.escalation_reason = `AI confidence score ${(result.confidence_score * 100).toFixed(0)}% is below threshold`;
      db.prepare('UPDATE forum_questions SET routing_decision = ?, escalation_reason = ? WHERE id = ?')
        .run('low_confidence', result.escalation_reason, questionId);
    } else {
      result.routing_decision = 'normal';
    }
  } else {
    result.routing_decision = 'escalated';
    result.escalation_reason = 'AI answer generation unavailable';
    db.prepare('UPDATE forum_questions SET routing_decision = ?, escalation_reason = ? WHERE id = ?')
      .run('escalated', result.escalation_reason, questionId);
  }

  // 6. Update confusion clusters
  await detectAndUpdateClusters(groupId);

  // 7. Record workflow item
  await recordWorkflowItem(questionId, groupId, result);

  return result;
}

async function recordWorkflowItem(questionId, groupId, result) {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO workflow_items (question_id, group_id, status, routing_decision, duplicate_of, confidence_score, topic, escalation_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      questionId, groupId,
      result.routing_decision === 'escalated' || result.routing_decision === 'low_confidence' ? 'escalated' : 'processed',
      result.routing_decision,
      result.duplicate_of || null,
      result.confidence_score || null,
      result.topic,
      result.escalation_reason || null
    );
  } catch (err) {
    console.error('Workflow item record failed:', err.message);
  }
}

// ─── Observability Logging ───────────────────────────────────────────────────
function logMetric(requestType, model, latencyMs, success, errorMessage, tokensUsed, groupId = null) {
  try {
    db.prepare(`
      INSERT INTO ai_metrics (request_type, model, latency_ms, success, error_message, tokens_used, group_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(requestType, model, latencyMs, success ? 1 : 0, errorMessage, tokensUsed || 0, groupId);
  } catch { /* non-fatal */ }
}

// ─── Intervention Outcome Tracking ──────────────────────────────────────────
async function trackInterventionOutcome(interventionId, groupId, topic) {
  const countAfter = db.prepare(`
    SELECT COUNT(*) as count FROM forum_questions
    WHERE group_id = ? AND topic = ? AND created_at > (
      SELECT created_at FROM interventions WHERE id = ?
    )
  `).get(groupId, topic, interventionId);

  const intervention = db.prepare('SELECT * FROM interventions WHERE id = ?').get(interventionId);
  if (!intervention) return null;

  const before = intervention.outcome_before || 0;
  const after = countAfter?.count || 0;
  const effectiveness = before > 0 ? Math.max(0, ((before - after) / before) * 100) : 0;

  db.prepare('UPDATE interventions SET outcome_after = ?, effectiveness = ? WHERE id = ?')
    .run(after, effectiveness, interventionId);

  return { before, after, effectiveness };
}

module.exports = {
  init,
  detectDuplicateQuestion,
  classifyTopic,
  generateAnswerDraft,
  scoreAIConfidence,
  detectAndUpdateClusters,
  recommendIntervention,
  generateProfessorAnnouncement,
  summarizeDiscussionThread,
  explainHomeworkMistake,
  routeQuestion,
  logMetric,
  trackInterventionOutcome,
  TOPIC_CATEGORIES,
};
