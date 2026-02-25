import fs from 'fs';
import { EvaluationResult } from './rules.js';

export function generateReport(results: EvaluationResult[], gitlabUrl: string): string {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GotLem Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; background-color: #f4f7f9; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .config-box { background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .pat-input { margin-bottom: 20px; padding: 10px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        input[type="password"] { padding: 8px; width: 300px; border: 1px solid #ddd; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background-color: #3498db; color: #white; }
        tr:hover { background-color: #f9f9f9; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.85em; font-weight: bold; text-transform: uppercase; }
        .issue { background-color: #e1f5fe; color: #01579b; }
        .epic { background-color: #f3e5f5; color: #4a148c; }
        .comment-text { white-space: pre-wrap; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 4px; border: 1px solid #e9ecef; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
        .btn-post { background-color: #27ae60; color: white; }
        .btn-post:hover { background-color: #219150; }
        .btn-post:disabled { background-color: #bdc3c7; cursor: not-allowed; }
        .status { font-size: 0.9em; font-weight: bold; }
        .status-success { color: #27ae60; }
        .status-error { color: #e74c3c; }
    </style>
</head>
<body>
    <h1>GotLem Analysis Report</h1>
    
    <div class="pat-input">
        <strong>GitLab Personal Access Token (PAT):</strong> 
        <input type="password" id="pat" placeholder="Enter your PAT here...">
        <p><small>Your PAT will be used directly in your browser to call the GitLab API. It is not stored or sent to any other server.</small></p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Type</th>
                <th>Item</th>
                <th>Rule</th>
                <th>Proposed Comment</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            ${results.map((res, index) => {
        const item = res.item;
        const itemId = item.iid;
        const itemType = item.type === 'ISSUE' ? 'projects' : 'groups';
        const parentId = item.type === 'ISSUE' ? (item as any).project_id : (item as any).group_id;

        return `
                <tr id="row-${index}">
                    <td><span class="badge ${item.type.toLowerCase()}">${item.type}</span></td>
                    <td>
                        <a href="${item.web_url}" target="_blank">#${item.iid}</a><br>
                        <small>${item.title}</small>
                    </td>
                    <td>${res.rule.name} (v${res.rule.version})</td>
                    <td><div class="comment-text">${res.proposedComment}</div></td>
                    <td>
                        <button class="btn btn-post" onclick='postComment(${index}, "${item.type}", "${parentId}", "${item.iid}", ${JSON.stringify(res.proposedComment).replace(/'/g, "\\'")})'>Post Comment</button>
                        <div id="status-${index}" class="status"></div>
                    </td>
                </tr>
                `;
    }).join('')}
        </tbody>
    </table>

    <script>
        async function postComment(index, type, parentId, iid, comment) {
            const pat = document.getElementById('pat').value;
            const statusDiv = document.getElementById('status-' + index);
            const btn = document.querySelector(\`#row-\${index} .btn-post\`);

            if (!pat) {
                alert('Please enter your GitLab Personal Access Token (PAT) first.');
                return;
            }

            btn.disabled = true;
            statusDiv.textContent = 'Posting...';
            statusDiv.className = 'status';

            const baseUrl = '${gitlabUrl.replace(/\/$/, '')}/api/v4';
            let url = '';
            
            if (type === 'ISSUE') {
                url = \`\${baseUrl}/projects/\${parentId}/issues/\${iid}/notes\`;
            } else {
                url = \`\${baseUrl}/groups/\${parentId}/epics/\${iid}/notes\`;
            }

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'PRIVATE-TOKEN': pat,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ body: comment })
                });

                if (response.ok) {
                    statusDiv.textContent = 'Success!';
                    statusDiv.className = 'status status-success';
                } else {
                    const errorData = await response.json();
                    statusDiv.textContent = 'Error: ' + (errorData.message || response.statusText);
                    statusDiv.className = 'status status-error';
                    btn.disabled = false;
                }
            } catch (error) {
                statusDiv.textContent = 'Error: ' + error.message;
                statusDiv.className = 'status status-error';
                btn.disabled = false;
            }
        }
    </script>
</body>
</html>
    `;
    return html;
}

export function saveReport(html: string, filePath: string) {
    fs.writeFileSync(filePath, html);
}
