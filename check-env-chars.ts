import { readFileSync } from 'fs';
const content = readFileSync('.env', 'utf8');
console.log('Line endings:', content.includes('\r\n') ? 'CRLF' : 'LF');
const lines = content.split(/\r?\n/);
lines.forEach((line, i) => {
    if (line.includes('DATABASE_URL')) {
        console.log(`Line ${i + 1} length:`, line.length);
        for (let j = 0; j < line.length; j++) {
            process.stdout.write(line.charCodeAt(j).toString(16) + ' ');
        }
        console.log();
    }
});
