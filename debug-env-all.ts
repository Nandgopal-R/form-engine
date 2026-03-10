import "dotenv/config";
['DATABASE_URL', 'BETTER_AUTH_URL', 'BETTER_AUTH_TRUSTED_ORIGINS', 'SMTP_USER', 'SMTP_PASS'].forEach(key => {
    const val = process.env[key];
    if (val) {
        const masked = (key === 'SMTP_PASS' || key === 'DATABASE_URL') ? 'PROTECTED' : val;
        console.log(`${key}: [${masked}] (Length: ${val.length})`);
        if (val.includes('#')) console.log(`WARNING: ${key} contains '#'`);
        if (val.includes('\r')) console.log(`WARNING: ${key} contains '\\r'`);
        if (val.endsWith(' ')) console.log(`WARNING: ${key} ends with space`);
    } else {
        console.log(`${key}: NOT SET`);
    }
});
