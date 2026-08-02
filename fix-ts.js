const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, searchValue, replaceValue) => {
  const fullPath = path.resolve(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(searchValue, replaceValue);
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  }
};

const replaceAllInFile = (filePath, searchValue, replaceValue) => {
  const fullPath = path.resolve(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replaceAll(searchValue, replaceValue);
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  }
};

// 1. src/app/api/rooms/availability/route.ts
replaceAllInFile('src/app/api/rooms/availability/route.ts', 'bookings.map(b =>', 'bookings.map((b: any) =>');

// 2. src/app/api/settings/route.ts
replaceAllInFile('src/app/api/settings/route.ts', '.reduce((acc, curr) =>', '.reduce((acc: any, curr: any) =>');

// 3. src/app/hms-portal-9f8b2c1a/(dashboard)/visitor-logs/page.tsx
replaceAllInFile('src/app/hms-portal-9f8b2c1a/(dashboard)/visitor-logs/page.tsx', 'blacklist.some(b =>', 'blacklist.some((b: any) =>');
replaceAllInFile('src/app/hms-portal-9f8b2c1a/(dashboard)/visitor-logs/page.tsx', 'logs.map((log) =>', 'logs.map((log: any) =>');
replaceAllInFile('src/app/hms-portal-9f8b2c1a/(dashboard)/visitor-logs/page.tsx', 'logs.map(log =>', 'logs.map((log: any) =>');

// 4. src/app/page.tsx
replaceAllInFile('src/app/page.tsx', '.reduce((acc, curr) =>', '.reduce((acc: any, curr: any) =>');
replaceAllInFile('src/app/page.tsx', 'rooms.map(room =>', 'rooms.map((room: any) =>');
replaceAllInFile('src/app/page.tsx', 'rooms.map((room) =>', 'rooms.map((room: any) =>');
replaceAllInFile('src/app/page.tsx', 'r => r.roomId === room.id', '(r: any) => r.roomId === room.id');
replaceAllInFile('src/app/page.tsx', 'room.images.map(img =>', 'room.images.map((img: any) =>');
replaceAllInFile('src/app/page.tsx', 'room.amenities.map(a =>', 'room.amenities.map((a: any) =>');
replaceAllInFile('src/app/page.tsx', 'coupons.map(c =>', 'coupons.map((c: any) =>');
replaceAllInFile('src/app/page.tsx', 'r => r.roomId === id', '(r: any) => r.roomId === id');
replaceAllInFile('src/app/page.tsx', 'r => r.roomId', '(r: any) => r.roomId');
replaceAllInFile('src/app/page.tsx', 'branches.map(b =>', 'branches.map((b: any) =>');

// 5. src/app/rooms/[id]/page.tsx
replaceAllInFile('src/app/rooms/[id]/page.tsx', 'room.images.map((img, index)', 'room.images.map((img: any, index: number)');
replaceAllInFile('src/app/rooms/[id]/page.tsx', 'room.images.map((img)', 'room.images.map((img: any)');
replaceAllInFile('src/app/rooms/[id]/page.tsx', 'room.images.map(img =>', 'room.images.map((img: any) =>');
replaceAllInFile('src/app/rooms/[id]/page.tsx', 'room.amenities.map(a =>', 'room.amenities.map((a: any) =>');
replaceAllInFile('src/app/rooms/[id]/page.tsx', 'room.amenities.map((amenity, index)', 'room.amenities.map((amenity: any, index: number)');

// 6. src/lib/cleanup-bookings.ts
replaceAllInFile('src/lib/cleanup-bookings.ts', 'bookingsToCancel.map(b =>', 'bookingsToCancel.map((b: any) =>');
replaceAllInFile('src/lib/cleanup-bookings.ts', 'b => b.id', '(b: any) => b.id');
replaceAllInFile('src/lib/cleanup-bookings.ts', 'map(b =>', 'map((b: any) =>');

// 7. src/lib/email.ts
replaceAllInFile('src/lib/email.ts', '.reduce((acc, curr) =>', '.reduce((acc: any, curr: any) =>');

console.log("Done patching files!");
