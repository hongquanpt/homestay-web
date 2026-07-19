const fs = require('fs');
const files = [
  'src/components/home/AllRoomsSection.tsx',
  'src/components/home/AvailableSlotsBanner.tsx',
  'src/components/home/BookingBoardSection.tsx',
  'src/components/home/ContactSection.tsx',
  'src/components/home/FeatureSection.tsx',
  'src/components/home/PromotionsSection.tsx',
  'src/app/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace bg-white with bg-transparent in section and footer tags
    content = content.replace(/(<section[^>]*className="[^"]*)bg-white([^"]*"[^>]*>)/g, '$1bg-transparent$2');
    content = content.replace(/(<footer[^>]*className="[^"]*)bg-white([^"]*"[^>]*>)/g, '$1bg-transparent$2');
    
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
