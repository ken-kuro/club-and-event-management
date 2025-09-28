#!/usr/bin/env node

/**
 * Basic API Tests for Club and Event Management
 * Simple test suite using Node.js built-in fetch and assertions
 */

const { strictEqual, ok, deepStrictEqual } = require('assert');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_DB_PATH = 'test/test_db.db';

// Test data
const testClub = {
  name: `Test Gaming Club ${Date.now()}`, // Unique name for test isolation
  description: 'A club for testing purposes'
};

const testEvent = {
  title: 'Test Tournament',
  description: 'Testing event creation',
  scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test utilities
async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data };
}

// Test cases
async function testGetClubs() {
  log('Testing GET /clubs...', 'blue');
  
  const { response, data } = await makeRequest('/clubs');
  
  strictEqual(response.status, 200, 'Should return 200 status');
  ok(data.success, 'Response should be successful');
  ok(Array.isArray(data.data), 'Should return array of clubs');
  
  log('✓ GET /clubs passed', 'green');
  return data.data;
}

async function testCreateClub() {
  log('Testing POST /clubs...', 'blue');
  
  const { response, data } = await makeRequest('/clubs', {
    method: 'POST',
    body: JSON.stringify(testClub)
  });
  
  strictEqual(response.status, 201, 'Should return 201 status');
  ok(data.success, 'Response should be successful');
  ok(data.data.id, 'Should return created club with ID');
  strictEqual(data.data.name, testClub.name, 'Should return correct club name');
  
  log('✓ POST /clubs passed', 'green');
  return data.data;
}

async function testCreateDuplicateClub() {
  log('Testing duplicate club creation...', 'blue');
  
  const { response, data } = await makeRequest('/clubs', {
    method: 'POST',
    body: JSON.stringify(testClub)
  });
  
  strictEqual(response.status, 409, 'Should return 409 for duplicate club');
  strictEqual(data.success, false, 'Response should indicate failure');
  
  log('✓ Duplicate club validation passed', 'green');
}

async function testGetClubEvents(clubId) {
  log(`Testing GET /clubs/${clubId}/events...`, 'blue');
  
  const { response, data } = await makeRequest(`/clubs/${clubId}/events`);
  
  strictEqual(response.status, 200, 'Should return 200 status');
  ok(data.success, 'Response should be successful');
  ok(data.data.club, 'Should return club info');
  ok(Array.isArray(data.data.events), 'Should return array of events');
  strictEqual(data.data.club.id, clubId, 'Should return correct club');
  
  log('✓ GET /clubs/:id/events passed', 'green');
  return data.data.events;
}

async function testCreateEvent(clubId) {
  log(`Testing POST /clubs/${clubId}/events...`, 'blue');
  
  const { response, data } = await makeRequest(`/clubs/${clubId}/events`, {
    method: 'POST',
    body: JSON.stringify(testEvent)
  });
  
  strictEqual(response.status, 201, 'Should return 201 status');
  ok(data.success, 'Response should be successful');
  ok(data.data.id, 'Should return created event with ID');
  strictEqual(data.data.title, testEvent.title, 'Should return correct event title');
  strictEqual(data.data.club_id, clubId, 'Should have correct club_id');
  
  log('✓ POST /clubs/:id/events passed', 'green');
  return data.data;
}

async function testInvalidEventDate(clubId) {
  log('Testing event with past date...', 'blue');
  
  const pastEvent = {
    ...testEvent,
    title: 'Past Event',
    scheduled_date: '2023-01-01T10:00:00Z'
  };
  
  const { response, data } = await makeRequest(`/clubs/${clubId}/events`, {
    method: 'POST',
    body: JSON.stringify(pastEvent)
  });
  
  strictEqual(response.status, 400, 'Should return 400 for past date');
  strictEqual(data.success, false, 'Response should indicate failure');
  
  log('✓ Past date validation passed', 'green');
}

async function testSearchClubs() {
  log('Testing club search...', 'blue');
  
  const { response, data } = await makeRequest('/clubs?search=Test');
  
  strictEqual(response.status, 200, 'Should return 200 status');
  ok(data.success, 'Response should be successful');
  ok(Array.isArray(data.data), 'Should return array of clubs');
  ok(data.data.length >= 1, 'Should find at least one club');
  
  log('✓ Club search passed', 'green');
}

async function testInvalidEndpoints() {
  log('Testing invalid endpoints...', 'blue');
  
  // Test non-existent club
  const { response: clubResponse } = await makeRequest('/clubs/999/events');
  strictEqual(clubResponse.status, 404, 'Should return 404 for non-existent club');
  
  // Test invalid club ID
  const { response: invalidResponse } = await makeRequest('/clubs/abc/events');
  strictEqual(invalidResponse.status, 400, 'Should return 400 for invalid club ID');
  
  log('✓ Invalid endpoints handled correctly', 'green');
}

async function testValidationErrors() {
  log('Testing validation errors...', 'blue');
  
  // Empty club name
  const { response: emptyNameResponse } = await makeRequest('/clubs', {
    method: 'POST',
    body: JSON.stringify({ name: '', description: 'Test' })
  });
  strictEqual(emptyNameResponse.status, 400, 'Should reject empty club name');
  
  // Too long name
  const { response: longNameResponse } = await makeRequest('/clubs', {
    method: 'POST',
    body: JSON.stringify({ name: 'a'.repeat(101), description: 'Test' })
  });
  strictEqual(longNameResponse.status, 400, 'Should reject too long club name');
  
  log('✓ Validation errors handled correctly', 'green');
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(50));
  log('Starting API Tests', 'yellow');
  console.log('='.repeat(50));
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Setup - wait for server to be ready
    log('\nChecking server connection...', 'blue');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run tests
    const clubs = await testGetClubs();
    const createdClub = await testCreateClub();
    await testCreateDuplicateClub();
    
    await testGetClubEvents(createdClub.id);
    const createdEvent = await testCreateEvent(createdClub.id);
    await testInvalidEventDate(createdClub.id);
    
    await testSearchClubs();
    await testInvalidEndpoints();
    await testValidationErrors();
    
    testsPassed = 9;
    
    console.log('\n' + '='.repeat(50));
    log(`All tests passed! (${testsPassed}/${testsPassed})`, 'green');
    log('API is working correctly', 'green');
    console.log('='.repeat(50));
    
  } catch (error) {
    testsFailed++;
    console.log('\n' + '='.repeat(50));
    log(`Test failed: ${error.message}`, 'red');
    log(`Results: ${testsPassed} passed, ${testsFailed} failed`, 'yellow');
    console.log('='.repeat(50));
    process.exit(1);
  }
}

// Check if this script is run directly
if (require.main === module) {
  // Check if server is running by making a simple request
  fetch(`${BASE_URL}/clubs`)
    .then(() => {
      runTests();
    })
    .catch(() => {
      log('Server is not running. Please start the server first with: npm start', 'red');
      log('Then run tests in another terminal with: npm test', 'yellow');
      process.exit(1);
    });
}

module.exports = { runTests, testClub, testEvent };
