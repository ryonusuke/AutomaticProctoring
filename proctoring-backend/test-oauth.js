require('dotenv').config();

console.log('=== OAuth Configuration Test ===\n');

console.log('Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '***' + process.env.GOOGLE_CLIENT_SECRET.slice(-4) : 'MISSING');
console.log('SERVER_URL:', process.env.SERVER_URL || 'http://localhost:5000');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'http://localhost:5173');

console.log('\n=== Expected Google Cloud Console Settings ===\n');

console.log('Authorized JavaScript origins:');
console.log('  - http://localhost:5173');
console.log('  - http://localhost:5000');

console.log('\nAuthorized redirect URIs:');
console.log('  - http://localhost:5000/api/auth/google/callback');

console.log('\nOAuth Consent Screen Scopes:');
console.log('  - .../auth/userinfo.email');
console.log('  - .../auth/userinfo.profile');
console.log('  - openid');

console.log('\n=== Test OAuth URL ===\n');
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent('http://localhost:5000/api/auth/google/callback')}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent('profile email')}&` +
  `access_type=offline&` +
  `prompt=select_account`;

console.log('Direct OAuth URL (paste in browser):');
console.log(authUrl);

console.log('\n=== Validation ===\n');

const issues = [];

if (!process.env.GOOGLE_CLIENT_ID) issues.push('❌ GOOGLE_CLIENT_ID is missing');
else if (!process.env.GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com')) issues.push('❌ GOOGLE_CLIENT_ID format invalid');
else console.log('✅ GOOGLE_CLIENT_ID format valid');

if (!process.env.GOOGLE_CLIENT_SECRET) issues.push('❌ GOOGLE_CLIENT_SECRET is missing');
else if (!process.env.GOOGLE_CLIENT_SECRET.startsWith('GOCSPX-')) issues.push('⚠️  GOOGLE_CLIENT_SECRET format unusual (should start with GOCSPX-)');
else console.log('✅ GOOGLE_CLIENT_SECRET format valid');

if (issues.length > 0) {
  console.log('\nIssues found:');
  issues.forEach(i => console.log(i));
} else {
  console.log('\n✅ All checks passed!');
}
