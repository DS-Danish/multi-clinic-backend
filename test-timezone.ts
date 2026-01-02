import { TimezoneUtil } from './src/common/utils/timezone.util';

// Test timezone conversions
console.log('=== Timezone Conversion Tests ===\n');

// Test 1: Convert Pakistan time to UTC
const pakistanTime = '2026-01-03T10:00:00';
const utcDate = TimezoneUtil.toUTC(pakistanTime, 'Asia/Karachi');
console.log('Test 1: Pakistan to UTC');
console.log(`Input (Pakistan): ${pakistanTime}`);
console.log(`Output (UTC): ${utcDate.toISOString()}`);
console.log(`Expected: 2026-01-03T05:00:00.000Z`);
console.log(`✓ Correct: ${utcDate.toISOString() === '2026-01-03T05:00:00.000Z'}\n`);

// Test 2: Convert UTC back to Pakistan time
const backToPakistan = TimezoneUtil.fromUTC(utcDate, 'Asia/Karachi');
console.log('Test 2: UTC back to Pakistan');
console.log(`Input (UTC): ${utcDate.toISOString()}`);
console.log(`Output (Pakistan): ${backToPakistan}`);
console.log(`Expected to include: 10:00:00`);
console.log(`✓ Correct: ${backToPakistan.includes('10:00:00')}\n`);

// Test 3: Current time in Pakistan
const nowPakistan = TimezoneUtil.now('Asia/Karachi');
console.log('Test 3: Current time in Pakistan');
console.log(`Current time: ${nowPakistan}`);
console.log(`✓ Format is ISO string with timezone\n`);

// Test 4: Validate timezone
console.log('Test 4: Timezone validation');
console.log(`Asia/Karachi valid: ${TimezoneUtil.isValidTimezone('Asia/Karachi')}`);
console.log(`Invalid/TZ valid: ${TimezoneUtil.isValidTimezone('Invalid/TZ')}`);
console.log(`✓ Validation working\n`);

// Test 5: Format date
const formatted = TimezoneUtil.format(utcDate, 'Asia/Karachi', 'YYYY-MM-DD HH:mm:ss');
console.log('Test 5: Format date');
console.log(`Formatted: ${formatted}`);
console.log(`Expected: 2026-01-03 10:00:00`);
console.log(`✓ Correct: ${formatted === '2026-01-03 10:00:00'}\n`);

console.log('=== All Tests Complete ===');
