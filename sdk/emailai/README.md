# EmailAI SDK — Email-Only Integration

> **The simplest SDK ever: just send an email.**

---

## Overview

The EmailAI SDK is not a library. It's not an API client. It's not a package to install.

**It's documentation on how to send an email.**

That's it. That's the SDK.

---

## Quick Start

### Send Your First Request

```
To: julia@medinatechlabs.net
Subject: Analyze Q2 Cloud Spend

Attached is our Q2 cloud spend across AWS, Azure, and Cloudflare.
Please analyze and recommend optimizations.

[Attachment: q2-spend.csv]
```

### Receive Intelligence

Within minutes, you'll receive a response:

```
From: julia@medinatechlabs.net
Subject: Re: Analyze Q2 Cloud Spend

## Q2 Cloud Spend Analysis

### Summary
- Total spend: $142,387
- Optimization potential: $23,450 (16.5%)
- Primary waste: Unused EC2 instances

### Recommendations
1. Terminate 12 idle EC2 instances ($8,200/mo)
2. Switch RDS to reserved instances ($4,100/mo)
3. Enable S3 Intelligent-Tiering ($2,150/mo)
...

{
  "analysis_id": "ana_7f8g9h0i",
  "confidence": 0.94,
  "total_spend": 142387,
  "optimization_potential": 23450,
  "recommendations": [...]
}
```

---

## That's the SDK

No npm install.  
No pip install.  
No authentication.  
No API keys.  
No rate limits.  
No SDK updates.  
No dependency hell.

**Just email.**

---

## Structured Requests (Optional)

For programmatic integration, use EAP-1 protocol headers and JSON body.

### EAP-1 Headers

Add these headers for structured communication:

```
X-Agent-Type: system
X-Agent-Intent: task
X-Agent-Confidence: 0.95
X-Agent-Target: brain
X-Agent-Priority: high
X-Agent-Thread: 7f8g9h0i-1234-5678-abcd
X-Agent-Workflow: cost-analysis
```

### JSON Body

```json
{
  "eap_version": "1.0.0",
  "intent": "task",
  "payload": {
    "action": "cost_analysis",
    "data": {
      "period": "Q2-2026",
      "providers": ["AWS", "Azure", "Cloudflare"],
      "format": "recommendations"
    }
  },
  "metadata": {
    "requester": "finance-team",
    "priority": "high"
  }
}
```

---

## Agent Directory

### Core Intelligence Organs

| Agent | Email | Specialization |
|-------|-------|----------------|
| **Membrane** | `membrane@medinatechlabs.net` | Security analysis, threat classification |
| **Julia Brain** | `julia@medinatechlabs.net` | Analytics, cost optimization, predictions |
| **Reflex** | `reflex@medinatechlabs.net` | Workflow automation, incident correlation |
| **Identity** | `identity@medinatechlabs.net` | Compliance, contract analysis |
| **Nova** | `nova@medinatechlabs.net` | Customer intelligence, communication |
| **Research** | `research@medinatechlabs.net` | Reports, insights, knowledge synthesis |
| **Probe** | `probe@medinatechlabs.net` | Threat intel, reconnaissance |

### Client-Facing Endpoints

| Service | Email | Purpose |
|---------|-------|---------|
| Analysis | `analysis@medinatechlabs.net` | General analytics requests |
| Support | `support@medinatechlabs.net` | Help and assistance |
| Automation | `automation@medinatechlabs.net` | Workflow triggers |
| Security | `security@medinatechlabs.net` | Security analysis |
| Intelligence | `intelligence@medinatechlabs.net` | Threat briefings |

---

## Use Case Examples

### Security: Threat Analysis

```
To: membrane@medinatechlabs.net
Subject: Traffic Analysis Request

We're seeing spikes in traffic from AS12345.
Please analyze and provide:
- Scanner classification
- Risk scores
- Recommended firewall rules
```

### DevOps: Incident Correlation

```
To: reflex@medinatechlabs.net
Subject: Incident Summary

Here are our incidents from the last 24 hours.
Please identify:
- Root causes
- Patterns
- Recommended actions

[Attachment: incidents.json]
```

### Finance: Cost Analysis

```
To: julia@medinatechlabs.net
Subject: Cloud Spend Optimization

Analyze our Q2 spend:
- AWS: $45,000
- Azure: $32,000
- Cloudflare: $8,000

Recommend optimizations.
```

### Sales: Customer Health

```
To: nova@medinatechlabs.net
Subject: Customer Complaint Summary

Summarize customer complaints from the last 7 days.
Identify churn risks and themes.
```

### Legal: Contract Analysis

```
To: identity@medinatechlabs.net
Subject: Contract Review

Please review the attached contract for:
- Risk clauses
- Obligations
- Compliance issues

[Attachment: contract.pdf]
```

---

## Programmatic Integration

### Python (using standard library)

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

def send_to_agent(agent_email, subject, body, headers=None):
    msg = MIMEMultipart()
    msg['To'] = agent_email
    msg['Subject'] = subject
    
    # Add EAP-1 headers
    if headers:
        for key, value in headers.items():
            msg.add_header(key, value)
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Send via your SMTP server
    with smtplib.SMTP('smtp.yourcompany.com') as server:
        server.send_message(msg)

# Example usage
send_to_agent(
    'julia@medinatechlabs.net',
    'Cost Analysis Request',
    json.dumps({
        'intent': 'task',
        'payload': {
            'action': 'cost_analysis',
            'period': 'Q2-2026'
        }
    }),
    headers={
        'X-Agent-Type': 'system',
        'X-Agent-Intent': 'task',
        'X-Agent-Confidence': '0.95'
    }
)
```

### Node.js (using Nodemailer)

```javascript
const nodemailer = require('nodemailer');

async function sendToAgent(agentEmail, subject, body, headers = {}) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.yourcompany.com',
    port: 587
  });

  await transporter.sendMail({
    to: agentEmail,
    subject: subject,
    text: body,
    headers: {
      'X-Agent-Type': headers.type || 'system',
      'X-Agent-Intent': headers.intent || 'task',
      'X-Agent-Confidence': headers.confidence || '0.95',
      ...headers
    }
  });
}

// Example usage
sendToAgent(
  'membrane@medinatechlabs.net',
  'Traffic Analysis',
  JSON.stringify({
    intent: 'task',
    payload: {
      action: 'threat_analysis',
      source: 'AS12345'
    }
  })
);
```

### cURL (from command line)

```bash
# Send via your mail relay
curl --url 'smtp://smtp.yourcompany.com:587' \
  --mail-from 'system@yourcompany.com' \
  --mail-rcpt 'julia@medinatechlabs.net' \
  --upload-file - <<EOF
From: system@yourcompany.com
To: julia@medinatechlabs.net
Subject: Cost Analysis
X-Agent-Type: system
X-Agent-Intent: task

{
  "intent": "task",
  "payload": {
    "action": "cost_analysis",
    "period": "Q2-2026"
  }
}
EOF
```

### Go

```go
package main

import (
    "net/smtp"
)

func sendToAgent(agentEmail, subject, body string) error {
    from := "system@yourcompany.com"
    
    msg := []byte(
        "To: " + agentEmail + "\r\n" +
        "Subject: " + subject + "\r\n" +
        "X-Agent-Type: system\r\n" +
        "X-Agent-Intent: task\r\n" +
        "\r\n" +
        body)
    
    return smtp.SendMail(
        "smtp.yourcompany.com:587",
        nil, from, []string{agentEmail}, msg)
}
```

---

## Response Format

Agents respond with:
1. Human-readable summary (email body)
2. Structured data (JSON at end of email)

### Example Response

```
From: julia@medinatechlabs.net
Subject: Re: Cost Analysis

## Analysis Complete

Your Q2 cloud spend analysis is complete.

### Key Findings
- Total spend: $142,387
- Optimization potential: 16.5%

### Top Recommendations
1. Terminate idle instances
2. Use reserved pricing
3. Enable intelligent tiering

---

{
  "analysis_id": "ana_xyz123",
  "eap_version": "1.0.0",
  "result": {
    "status": "success",
    "total_spend": 142387,
    "optimization_potential": 0.165,
    "recommendations": [
      {"action": "terminate_idle", "savings": 8200},
      {"action": "reserved_pricing", "savings": 4100}
    ]
  },
  "trace": {
    "thread": "7f8g9h0i-1234",
    "processed_at": "2026-01-15T10:30:00Z"
  }
}
```

---

## Best Practices

### 1. Use Descriptive Subjects
```
Good: "Analyze Q2 AWS spend for cost optimization"
Bad: "Help"
```

### 2. Provide Context
```
Good: "Attached are logs from 2026-01-15 showing traffic spikes from AS12345"
Bad: "Look at these logs"
```

### 3. Specify Output Format
```
Good: "Provide recommendations in a prioritized list with estimated savings"
Bad: "Give me some ideas"
```

### 4. Use EAP-1 Headers for Systems
```
X-Agent-Type: system
X-Agent-Intent: task
X-Agent-Thread: unique-thread-id
```

### 5. Include Attachments When Relevant
- CSV for data analysis
- JSON for structured data
- PDF for document analysis
- Logs for incident analysis

---

## FAQ

### Do I need to install anything?
No. Just send an email.

### What about authentication?
Your email server handles authentication. Agents verify sender domains.

### How do I handle responses programmatically?
Set up an email webhook or poll your inbox. Parse the JSON at the end of responses.

### What's the rate limit?
Depends on your plan. Starter: 10K/month. Enterprise: 1M/month.

### Can I send attachments?
Yes. CSV, JSON, PDF, TXT, and common formats are supported.

### What languages are supported?
Email is language-agnostic. Send in any language your email client supports.

---

## Support

Need help? Email us:

- **Technical:** `support@medinatechlabs.net`
- **Sales:** `sales@medinatechlabs.net`
- **Onboarding:** `onboard@medinatechlabs.net`

---

## That's Really It

The best SDK is no SDK.

Just send an email.

---

*EmailAI Mesh — SMTP for AI Civilizations*

© 2026 MedinaTech Labs · RSHIP Intelligence Systems
