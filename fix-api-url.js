const fs = require('fs');
const path = require('path');
const dir = 'd:/Tolongin/frontend/app/(dashboard)/admin';

function walk(d) {
  fs.readdirSync(d).forEach(f => {
    const fp = path.join(d, f);
    if (fs.statSync(fp).isDirectory()) {
      walk(fp);
    } else if (fp.endsWith('.tsx')) {
      let c = fs.readFileSync(fp, 'utf8');
      c = c.replace(/const API_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001';/g, "const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';");
      fs.writeFileSync(fp, c);
      console.log(`Updated API URL definition in ${fp}`);
    }
  })
}

walk(dir);
