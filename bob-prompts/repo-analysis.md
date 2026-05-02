# Repository Analysis Agent

Given this stack trace: {{stack_trace}}

Use GitHub MCP to:
1. Search for the file mentioned in stack trace
2. Get current file contents
3. List last 5 commits to that file
4. Identify which commit likely introduced the bug
5. Get diff of that commit

Return structured JSON:
```json
{
  "file_path": "OrderService.java",
  "line_number": 342,
  "function_name": "processRefund",
  "suspect_commit": "abc123",
  "commit_author": "dev-ali",
  "commit_date": "2026-05-01T18:44:00Z",
  "commit_message": "Remove unnecessary null check",
  "confidence": "HIGH"
}