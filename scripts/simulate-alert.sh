#!/bin/bash
# Fire a fake PagerDuty alert to test the full pipeline

echo "🎭 Simulating PagerDuty alert..."

curl -X POST http://localhost:3000/webhook/pagerduty \
  -H 'Content-Type: application/json' \
  -H 'X-PagerDuty-Signature: demo-mode' \
  -d '{
    "messages": [{
      "event": {
        "id": "INC-DEMO-001",
        "data": {
          "id": "INC-DEMO-001",
          "title": "NullPointerException in OrderService.processRefund()",
          "urgency": "high",
          "service": { "summary": "order-service" },
          "created_at": "2026-05-02T03:00:00Z",
          "body": {
            "details": {
              "logs_url": "http://localhost:3001/mock-logs/INC-DEMO-001"
            }
          }
        }
      }
    }]
  }'

echo ""
echo "✅ Alert sent! Check the server logs for DevOps Oracle activation."

# Made with Bob
