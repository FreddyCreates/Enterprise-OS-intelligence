/**
 * THE TOOLS — three free, domain-specific AI tools. Free download.
 * No API key. No subscription. No data leaves the user\'s machine.
 *
 * Source of truth: ../releases/CHECKSUMS.sha256
 * The values below are mirrored from that file. CI re-verifies them on every
 * build (see scripts/verify-checksums.mjs).
 */

export const tools = [
  {
    id: 'paralegal-ai',
    title: 'paralegal-ai',
    audience: 'for legal professionals',
    version: '0.1.0-alpha',
    package: '@medina/paralegal-ai',
    description:
      'Contract intelligence. Risk extraction, redlining language, version diffing, in-document Q&A. Operates locally — no cloud, no telemetry.',
    methods: [
      { sig: 'ai.analyze(contractText)',                    note: 'Full risk report: score, critical issues, precedents' },
      { sig: 'ai.risks(contractText)',                      note: 'Just the clauses that can hurt the client' },
      { sig: "ai.draft('ip-carveout')",                     note: 'Ready-to-send redline language' },
      { sig: 'ai.compare(v1, v2)',                          note: 'What changed between versions' },
      { sig: "ai.ask('Who bears liability if late?', text)", note: 'Plain-language Q&A grounded in the document' },
    ],
    file:     'paralegal-ai-v0.1.0-alpha.zip',
    sha256:   '28754295abe3b49e5c266f8dffec818a796e66b2303044a53469f19411f4d1ad',
  },
  {
    id: 'analyst-ai',
    title: 'analyst-ai',
    audience: 'for business analysts and operations',
    version: '0.1.0-alpha',
    package: '@medina/analyst-ai',
    description:
      'Report intelligence. Brief generation, action extraction, multi-period trend analysis, sentiment and urgency scoring, period-over-period comparison.',
    methods: [
      { sig: 'ai.brief(reportText)',                        note: 'Summary, actions, risks, decisions, metrics' },
      { sig: "ai.extract(reportText, 'actions')",           note: 'Action items only' },
      { sig: 'ai.trends([q1, q2, q3])',                     note: 'Cross-period patterns' },
      { sig: 'ai.score(reportText)',                        note: 'Sentiment + urgency score' },
      { sig: 'ai.compare(reportA, reportB)',                note: 'What shifted between periods' },
    ],
    file:     'analyst-ai-v0.1.0-alpha.zip',
    sha256:   '7f3111e5a496de1f78fbd5148138e76527c12044fe59fb2f0472093222af469a',
  },
  {
    id: 'student-ai',
    title: 'student-ai',
    audience: 'for students',
    version: '0.1.0-alpha',
    package: '@medina/student-ai',
    description:
      'Study intelligence. Chapter summaries, quizzes graded by difficulty, flashcards pulled from the source text, outline mapping, plain-language explanation grounded in the material.',
    methods: [
      { sig: 'ai.study(chapterText)',                       note: 'Summary, key points, vocabulary, read time' },
      { sig: 'ai.quiz(chapterText, 5)',                     note: '5 questions with hints, graded by difficulty' },
      { sig: 'ai.flashcards(chapterText, 8)',               note: 'Term → explanation, pulled from the text' },
      { sig: 'ai.outline(chapterText)',                     note: 'The structure of the argument, mapped' },
      { sig: "ai.explain('what is entropy?', text)",        note: 'Plain language, grounded in the chapter' },
    ],
    file:     'student-ai-v0.1.0-alpha.zip',
    sha256:   '582843a7182f94ee5501b98ea2fa5dca6dc3e353e886e13fc79d792a0afe12dd',
  },
];
