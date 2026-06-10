import fs from 'fs';
import path from 'path';

const searchReplace = (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      searchReplace(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;

      // Replace ref: 'TaxiUser'
      if (content.includes("ref: 'TaxiUser'") || content.includes('ref: "TaxiUser"')) {
        content = content.replace(/ref:\s*['"]TaxiUser['"]/g, "ref: 'User'");
        modified = true;
      }

      // We need to carefully replace the TaxiUser import.
      // E.g., import { User } from '../user/models/User.js';
      // It's tricky because the depth varies. So let's use a regex that matches
      // any import { User } from '.../user/models/User.js' and replaces it with the absolute path
      // but absolute paths in imports might fail in Node if no root alias is set.
      // Let's calculate relative path to backend/modules/user/models/User.js

      if (content.includes('User.js') && content.includes('import { User }')) {
        const absoluteGlobalUser = path.resolve('d:/companyfolder/My_DESTINATION/backend/modules/user/models/User.js');
        const relativePath = path.relative(path.dirname(filePath), absoluteGlobalUser).replace(/\\/g, '/');
        
        content = content.replace(/import\s*\{\s*User\s*\}\s*from\s*['"][^'"]+user\/models\/User\.js['"]\s*;?/g, `import User from '${relativePath}';`);
        modified = true;
      }
      
      // Also check `import { User as ...` if it exists, though unlikely.

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
};

const targetDir = path.resolve('d:/companyfolder/My_DESTINATION/backend/modules/taxi');
searchReplace(targetDir);
console.log('Migration of references complete.');
