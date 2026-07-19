const fs = require('fs');

const filePath = 'd:/Tolongin/frontend/app/(dashboard)/workspace/[enrollmentId]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace imports
content = content.replace(
  "import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';",
  "import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed react-resizable-panels imports!');
