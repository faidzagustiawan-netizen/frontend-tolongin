const fs = require('fs');

function fixPage() {
  let content = fs.readFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/page.tsx', 'utf8');

  // Fix text-muted-foreground-foreground
  content = content.replace(/text-muted-foreground-foreground/g, 'text-muted-foreground');

  // Fix text-foreground/90 on primary background to text-white
  content = content.replace(/text-foreground\/90/g, 'text-white/90');

  // Fix bg-[#1E7F4D] and fill='#1e7f4d'
  content = content.replace(/bg-\[\#1E7F4D\]/g, 'bg-primary');
  content = content.replace(/border-\[\#1e7f4d\]/g, 'border-primary');
  content = content.replace(/bg-\[\#1e7f4d\]/g, 'bg-primary');
  content = content.replace(/fill="#1e7f4d"/g, 'className="fill-primary"');

  fs.writeFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/page.tsx', content, 'utf8');
  console.log('Fixed page.tsx');
}

function fixPreview() {
  let content = fs.readFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/components/PreviewTab.tsx', 'utf8');
  content = content.replace(/text-muted-foreground-foreground/g, 'text-muted-foreground');
  fs.writeFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/components/PreviewTab.tsx', content, 'utf8');
  console.log('Fixed PreviewTab.tsx');
}

function fixManual() {
  let content = fs.readFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/components/ManualBuilder.tsx', 'utf8');
  content = content.replace(/text-muted-foreground-foreground/g, 'text-muted-foreground');
  fs.writeFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/components/ManualBuilder.tsx', content, 'utf8');
  console.log('Fixed ManualBuilder.tsx');
}

function fixGeneral() {
  let content = fs.readFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/components/GeneralForm.tsx', 'utf8');
  content = content.replace(/text-muted-foreground-foreground/g, 'text-muted-foreground');
  fs.writeFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/components/GeneralForm.tsx', content, 'utf8');
  console.log('Fixed GeneralForm.tsx');
}

function fixQuestion() {
  let content = fs.readFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/components/QuestionBuilder.tsx', 'utf8');
  content = content.replace(/text-muted-foreground-foreground/g, 'text-muted-foreground');
  fs.writeFileSync('d:/Tolongin/frontend/app/(dashboard)/challenges/create/components/QuestionBuilder.tsx', content, 'utf8');
  console.log('Fixed QuestionBuilder.tsx');
}

fixPage();
fixPreview();
fixManual();
fixGeneral();
fixQuestion();
