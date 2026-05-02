# Hotfix Generation

Root Cause: {{root_cause}}
File: {{file_path}}
Line: {{line_number}}
Function: {{function_name}}

Current code:
{{current_code}}

Instructions:
1. Write the minimal fix that resolves the root cause
2. Add inline comment: // DEVOPS ORACLE FIX — {{incident_id}} — {{root_cause}}
3. Do NOT refactor unrelated code
4. Preserve original intent
5. Show the diff before applying

Expected fix:
- Add null check before line {{line_number}}
- Throw appropriate error if null