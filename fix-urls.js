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
      c = c.replace(/\$\{API_URL\}\/api\/v1\//g, '${API_URL}/');
      fs.writeFileSync(fp, c);
      console.log(`Updated ${fp}`);
    }
  })
}

walk(dir);
