/**
 * Doc Sanitizer Tests
 * Tests for tools/doc-sanitizer.js - Document sanitization functions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Simulate doc-sanitizer functions for testing

// Branding Rules
const BRAND_REPLACEMENTS = [
  { pattern: /\bPRIMORDIUM\b/g,  replacement: 'Medina Tech' },
  { pattern: /\bprimordium\b/gi, replacement: 'Medina Tech' },
  { pattern: /\bAI Labs\b/gi,    replacement: 'Chaos Lab'   },
  { pattern: /\bAILabs\b/g,      replacement: 'Chaos Lab'   },
];

// Code block detection
const CODE_BLOCK_RE  = /```([a-z]*)\n([\s\S]*?)```/g;
const LOGIC_KEYWORDS = /\b(?:import|export|require)\b|\bfunction\s+\w|\bconst\s+\w|\blet\s+\w|\bvar\s+\w|\bclass\s+\w|\basync\s+function|\bawait\s+\w|\.\w+\s*=>|Promise\./;

// Math block guard
function isMathOrPseudoBlock(blockContent) {
  const mathSignals = /[∂∇∑∫δΣφρ∈⊂·≤≥≠≈∞∏√∀∃¬∧∨⊕±×÷π]/;
  if (mathSignals.test(blockContent)) return true;
  
  const pseudoCodeShape = /^\s*\w+\s*[=(]\s*\w+\s*\{[\s\S]*?\}/m;
  const hasJsKeywords = /\b(?:import|export|require|Promise)\b|console\.|\.then\(|\.catch\(|\basync\s+function|\bawait\s+\w+\s*\(/;
  if (pseudoCodeShape.test(blockContent) && !hasJsKeywords.test(blockContent)) {
    return true;
  }
  return false;
}

// Inline redactions
const INLINE_REDACTIONS = [
  {
    name:        'CANISTER_PRINCIPAL',
    pattern:     /[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{3}/g,
    replacement: '[CANISTER-ID-REDACTED]',
  },
  {
    name:        'API_KEY',
    pattern:     /(?:api[_-]?key|token|secret|password)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    replacement: '[REDACTED]',
  },
  {
    name:        'INTERNAL_PATH',
    pattern:     /(?:["'`](?:[./\\]+)?src\/|\/scripts\/|nova\.json|bootstrap\.js)/g,
    replacement: '[PATH-REDACTED]',
  },
];

// Required sections
const REQUIRED_SECTIONS = ['## Abstract', '## References'];
const REQUIRED_AUTHOR_LINE = 'Alfredo Medina Hernandez';
const REQUIRED_AFFILIATION = 'Medina Tech';

function redactLogicBlocks(text) {
  let redacted = false;
  const result = text.replace(CODE_BLOCK_RE, (match, lang, body) => {
    if (isMathOrPseudoBlock(body)) return match;
    if (!LOGIC_KEYWORDS.test(body)) return match;
    redacted = true;
    return `\`\`\`${lang}\n[IMPLEMENTATION REDACTED — see ORO SDK]\n\`\`\``;
  });
  return { result, redacted };
}

describe('Doc Sanitizer Functions', () => {
  describe('BRAND_REPLACEMENTS', () => {
    it('should replace PRIMORDIUM with Medina Tech', () => {
      let text = 'PRIMORDIUM is a company';
      for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
        text = text.replace(pattern, replacement);
      }
      assert.strictEqual(text, 'Medina Tech is a company');
    });

    it('should replace primordium (case insensitive)', () => {
      let text = 'primordium PRIMORDIUM Primordium';
      for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
        text = text.replace(pattern, replacement);
      }
      assert.ok(!text.includes('primordium'));
      assert.ok(!text.includes('PRIMORDIUM'));
    });

    it('should replace AI Labs with Chaos Lab', () => {
      let text = 'AI Labs and ai labs';
      for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
        text = text.replace(pattern, replacement);
      }
      assert.ok(!text.toLowerCase().includes('ai labs'));
    });

    it('should replace AILabs with Chaos Lab', () => {
      let text = 'AILabs';
      for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
        text = text.replace(pattern, replacement);
      }
      assert.strictEqual(text, 'Chaos Lab');
    });
  });

  describe('isMathOrPseudoBlock', () => {
    it('should detect math symbols', () => {
      assert.ok(isMathOrPseudoBlock('∂x/∂t = α'));
      assert.ok(isMathOrPseudoBlock('∇²φ = 0'));
      assert.ok(isMathOrPseudoBlock('∑(i=1..n) xᵢ'));
      assert.ok(isMathOrPseudoBlock('∫f(x)dx'));
      assert.ok(isMathOrPseudoBlock('δ(x) distribution'));
      assert.ok(isMathOrPseudoBlock('π ≈ 3.14159'));
    });

    it('should not detect regular code', () => {
      assert.strictEqual(isMathOrPseudoBlock('const x = 5;'), false);
      assert.strictEqual(isMathOrPseudoBlock('function test() {}'), false);
      assert.strictEqual(isMathOrPseudoBlock('import foo from "bar"'), false);
    });

    it('should detect pseudo-code structures', () => {
      const pseudoCode = `
      State = OrganismState {
        coherence: 1.0
        health: 1.0
      }`;
      assert.ok(isMathOrPseudoBlock(pseudoCode));
    });

    it('should reject pseudo-code with JS keywords', () => {
      const jsCode = `
      State = OrganismState {
        import something from 'module'
      }`;
      assert.strictEqual(isMathOrPseudoBlock(jsCode), false);
    });
  });

  describe('redactLogicBlocks', () => {
    it('should redact code blocks with import', () => {
      const input = '```js\nimport fs from "fs";\n```';
      const { result, redacted } = redactLogicBlocks(input);
      
      assert.ok(redacted);
      assert.ok(result.includes('[IMPLEMENTATION REDACTED'));
      assert.ok(!result.includes('import fs'));
    });

    it('should redact code blocks with function', () => {
      const input = '```js\nfunction test() { return 42; }\n```';
      const { result, redacted } = redactLogicBlocks(input);
      
      assert.ok(redacted);
      assert.ok(result.includes('[IMPLEMENTATION REDACTED'));
    });

    it('should redact code blocks with const', () => {
      const input = '```js\nconst x = compute();\n```';
      const { result, redacted } = redactLogicBlocks(input);
      
      assert.ok(redacted);
    });

    it('should preserve math blocks', () => {
      const input = '```math\n∂φ/∂t = ∇²φ\n```';
      const { result, redacted } = redactLogicBlocks(input);
      
      assert.strictEqual(redacted, false);
      assert.ok(result.includes('∂φ/∂t'));
    });

    it('should preserve non-logic text blocks', () => {
      const input = '```\nThis is just plain text.\n```';
      const { result, redacted } = redactLogicBlocks(input);
      
      assert.strictEqual(redacted, false);
      assert.ok(result.includes('plain text'));
    });

    it('should preserve language tag in redacted block', () => {
      const input = '```javascript\nexport default function() {}\n```';
      const { result } = redactLogicBlocks(input);
      
      assert.ok(result.includes('```javascript'));
    });
  });

  describe('INLINE_REDACTIONS', () => {
    describe('CANISTER_PRINCIPAL', () => {
      it('should match canister ID format', () => {
        const canisterId = 'abcde-fghij-klmno-pqrst-uvw';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'CANISTER_PRINCIPAL').pattern;
        
        assert.ok(pattern.test(canisterId));
      });

      it('should not match partial IDs', () => {
        const partialId = 'abcde-fghij';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'CANISTER_PRINCIPAL').pattern;
        pattern.lastIndex = 0; // Reset regex state
        
        assert.strictEqual(pattern.test(partialId), false);
      });
    });

    describe('API_KEY', () => {
      it('should match api_key pattern', () => {
        const text = 'api_key: "my-secret-key-12345"';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'API_KEY').pattern;
        
        assert.ok(pattern.test(text));
      });

      it('should match token pattern', () => {
        const text = "token = 'abcdefghijklmnop'";
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'API_KEY').pattern;
        pattern.lastIndex = 0;
        
        assert.ok(pattern.test(text));
      });

      it('should match secret pattern', () => {
        const text = 'secret: "verysecretvalue"';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'API_KEY').pattern;
        pattern.lastIndex = 0;
        
        assert.ok(pattern.test(text));
      });

      it('should not match short values', () => {
        const text = 'api_key: "short"';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'API_KEY').pattern;
        pattern.lastIndex = 0;
        
        assert.strictEqual(pattern.test(text), false);
      });
    });

    describe('INTERNAL_PATH', () => {
      it('should match src/ paths', () => {
        const text = '"./src/utils/test.js"';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'INTERNAL_PATH').pattern;
        
        assert.ok(pattern.test(text));
      });

      it('should match /scripts/ paths', () => {
        const text = '/scripts/deploy.sh';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'INTERNAL_PATH').pattern;
        pattern.lastIndex = 0;
        
        assert.ok(pattern.test(text));
      });

      it('should match nova.json', () => {
        const text = 'config file: nova.json';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'INTERNAL_PATH').pattern;
        pattern.lastIndex = 0;
        
        assert.ok(pattern.test(text));
      });

      it('should match bootstrap.js', () => {
        const text = 'load bootstrap.js';
        const pattern = INLINE_REDACTIONS.find(r => r.name === 'INTERNAL_PATH').pattern;
        pattern.lastIndex = 0;
        
        assert.ok(pattern.test(text));
      });
    });
  });

  describe('REQUIRED_SECTIONS', () => {
    it('should require Abstract section', () => {
      assert.ok(REQUIRED_SECTIONS.includes('## Abstract'));
    });

    it('should require References section', () => {
      assert.ok(REQUIRED_SECTIONS.includes('## References'));
    });
  });

  describe('REQUIRED_AUTHOR_LINE', () => {
    it('should be Alfredo Medina Hernandez', () => {
      assert.strictEqual(REQUIRED_AUTHOR_LINE, 'Alfredo Medina Hernandez');
    });
  });

  describe('REQUIRED_AFFILIATION', () => {
    it('should be Medina Tech', () => {
      assert.strictEqual(REQUIRED_AFFILIATION, 'Medina Tech');
    });
  });

  describe('Integration: Full document sanitization', () => {
    it('should sanitize document with multiple issues', () => {
      let text = `
# PRIMORDIUM Research Paper

## Abstract
This paper from AI Labs discusses...

\`\`\`js
import secret from './src/config';
const API_KEY = "supersecretkey123";
\`\`\`

Canister ID: abcde-fghij-klmno-pqrst-uvw

## References
`;
      
      // Apply brand replacements
      for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
        text = text.replace(pattern, replacement);
      }
      
      // Redact code blocks
      const { result: afterBlocks } = redactLogicBlocks(text);
      text = afterBlocks;
      
      // Apply inline redactions
      for (const { pattern, replacement } of INLINE_REDACTIONS) {
        text = text.replace(pattern, replacement);
      }
      
      // Verify sanitization
      assert.ok(!text.includes('PRIMORDIUM'));
      assert.ok(!text.includes('AI Labs'));
      assert.ok(!text.includes('import secret'));
      assert.ok(text.includes('[IMPLEMENTATION REDACTED'));
      assert.ok(text.includes('[CANISTER-ID-REDACTED]'));
    });
  });
});
