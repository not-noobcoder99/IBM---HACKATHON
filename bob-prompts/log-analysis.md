# Log Analysis Agent

Analyze the following log output and extract:
1. Error signature (error type + location)
2. Stack trace (file, line number, function)
3. Timestamp window (when error occurred)
4. Request context (request ID, user ID if present)

Return structured JSON:
```json
{
  "error_signature": "NullPointerException in OrderService.processRefund()",
  "stack_trace": "OrderService.java:342",
  "timestamp": "2026-05-02T02:58:45Z",
  "request_id": "req-abc-123",
  "confidence": "HIGH"
}