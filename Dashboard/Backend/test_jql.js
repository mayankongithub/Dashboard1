// Test JQL queries directly
const JiraClient = require('jira-client');

// Jira configuration
const JIRA_CONFIG = {
  protocol: 'https',
  host: 'jira.tegile.com',
  username: 'bugs-bunny',
  password: 'hsv4h5s65a6h56j5ch5',
  apiVersion: '2',
  strictSSL: true
};

const jira = new JiraClient(JIRA_CONFIG);

async function testJQLQueries() {
  console.log('=== Testing JQL Queries ===');
  
  try {
    // Test the exact JQL queries you provided
    const firmwareJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= startOfMonth() AND created <= endOfMonth() AND reporter = 62718b83d7fd480068d80e56 AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware order by status ASC`;
    
    const scriptJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= startOfMonth() AND created <= endOfMonth() AND reporter = 62718b83d7fd480068d80e56 AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware order by status ASC`;
    
    const ciJQL = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= startOfMonth() AND created <= endOfMonth() AND reporter = 62718b83d7fd480068d80e56 AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ CI order by status ASC`;

    console.log('\n1. Testing Firmware JQL:');
    console.log(firmwareJQL);
    const firmwareResult = await jira.searchJira(firmwareJQL, { maxResults: 5 });
    console.log(`Firmware bugs found: ${firmwareResult.total}`);
    
    console.log('\n2. Testing Script JQL:');
    console.log(scriptJQL);
    const scriptResult = await jira.searchJira(scriptJQL, { maxResults: 5 });
    console.log(`Script bugs found: ${scriptResult.total}`);
    
    console.log('\n3. Testing CI JQL:');
    console.log(ciJQL);
    const ciResult = await jira.searchJira(ciJQL, { maxResults: 5 });
    console.log(`CI bugs found: ${ciResult.total}`);
    
    const totalBugs = firmwareResult.total + scriptResult.total + ciResult.total;
    console.log(`\nTotal bugs: ${totalBugs}`);
    
    // Test with specific date ranges for July 2025
    console.log('\n=== Testing with specific date ranges for July 2025 ===');
    const firmwareJQLWithDates = `project = SFAP AND issuetype = Bug AND status is not EMPTY AND created >= "2025-07-01" AND created <= "2025-07-31" AND reporter = 62718b83d7fd480068d80e56 AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware order by status ASC`;
    
    console.log('\n4. Testing Firmware JQL with July dates:');
    console.log(firmwareJQLWithDates);
    const firmwareJulyResult = await jira.searchJira(firmwareJQLWithDates, { maxResults: 5 });
    console.log(`Firmware bugs found for July: ${firmwareJulyResult.total}`);
    
    // Test a simpler query to see if we get any results
    console.log('\n=== Testing simpler queries ===');
    const simpleJQL = `project = SFAP AND issuetype = Bug AND reporter = 62718b83d7fd480068d80e56`;
    console.log('\n5. Testing simple JQL:');
    console.log(simpleJQL);
    const simpleResult = await jira.searchJira(simpleJQL, { maxResults: 5 });
    console.log(`Simple query bugs found: ${simpleResult.total}`);

    if (simpleResult.total > 0) {
      console.log('\nFirst few results:');
      simpleResult.issues.slice(0, 3).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.key}: ${issue.fields.summary}`);
        console.log(`   Created: ${issue.fields.created}`);
        console.log(`   Status: ${issue.fields.status.name}`);
        console.log(`   Component: ${issue.fields.components?.map(c => c.name).join(', ') || 'None'}`);
        console.log(`   Labels: ${issue.fields.labels?.join(', ') || 'None'}`);
      });
    }

    // Test to find any bugs in SFAP project to see what reporters exist
    console.log('\n=== Testing to find any SFAP bugs ===');
    const anyBugsJQL = `project = SFAP AND issuetype = Bug`;
    console.log('\n6. Testing any SFAP bugs:');
    console.log(anyBugsJQL);
    const anyBugsResult = await jira.searchJira(anyBugsJQL, { maxResults: 10, fields: ['reporter', 'created', 'summary', 'components', 'labels'] });
    console.log(`Any SFAP bugs found: ${anyBugsResult.total}`);

    if (anyBugsResult.total > 0) {
      console.log('\nFirst few SFAP bugs with reporter info:');
      anyBugsResult.issues.slice(0, 5).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.key}: ${issue.fields.summary}`);
        console.log(`   Created: ${issue.fields.created}`);
        console.log(`   Reporter: ${issue.fields.reporter?.displayName || 'Unknown'} (ID: ${issue.fields.reporter?.accountId || 'Unknown'})`);
        console.log(`   Component: ${issue.fields.components?.map(c => c.name).join(', ') || 'None'}`);
        console.log(`   Labels: ${issue.fields.labels?.join(', ') || 'None'}`);
        console.log('');
      });
    }

    // Test with bugs-bunny reporter (the old approach)
    console.log('\n=== Testing with bugs-bunny reporter ===');
    const bugsBunnyJQL = `project = SFAP AND issuetype = Bug AND reporter = bugs-bunny`;
    console.log('\n7. Testing bugs-bunny reporter:');
    console.log(bugsBunnyJQL);
    const bugsBunnyResult = await jira.searchJira(bugsBunnyJQL, { maxResults: 5 });
    console.log(`Bugs-bunny bugs found: ${bugsBunnyResult.total}`);

    if (bugsBunnyResult.total > 0) {
      console.log('\nFirst few bugs-bunny results with full reporter info:');
      const bugsBunnyDetailedResult = await jira.searchJira(bugsBunnyJQL, { maxResults: 3, fields: ['reporter', 'created', 'summary', 'components', 'labels'] });
      bugsBunnyDetailedResult.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.key}: ${issue.fields.summary}`);
        console.log(`   Created: ${issue.fields.created}`);
        console.log(`   Reporter Name: ${issue.fields.reporter?.displayName || 'Unknown'}`);
        console.log(`   Reporter Username: ${issue.fields.reporter?.name || 'Unknown'}`);
        console.log(`   Reporter Account ID: ${issue.fields.reporter?.accountId || 'Unknown'}`);
        console.log(`   Reporter Key: ${issue.fields.reporter?.key || 'Unknown'}`);
        console.log(`   Component: ${issue.fields.components?.map(c => c.name).join(', ') || 'None'}`);
        console.log(`   Labels: ${issue.fields.labels?.join(', ') || 'None'}`);
        console.log('   Full reporter object:', JSON.stringify(issue.fields.reporter, null, 2));
        console.log('');
      });
    }

    // Test with the correct reporter format and step by step filtering
    console.log('\n=== Testing step by step filtering ===');

    // Step 1: Test with bugs-bunny and component filter
    const step1JQL = `project = SFAP AND issuetype = Bug AND reporter = bugs-bunny AND component = "Automated Test"`;
    console.log('\n8. Testing bugs-bunny + Automated Test component:');
    console.log(step1JQL);
    const step1Result = await jira.searchJira(step1JQL, { maxResults: 5 });
    console.log(`Step 1 bugs found: ${step1Result.total}`);

    // Step 2: Add labels filter
    const step2JQL = `project = SFAP AND issuetype = Bug AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4`;
    console.log('\n9. Testing bugs-bunny + Automated Test + CI:Stage4:');
    console.log(step2JQL);
    const step2Result = await jira.searchJira(step2JQL, { maxResults: 5 });
    console.log(`Step 2 bugs found: ${step2Result.total}`);

    // Step 3: Add text filter for Firmware
    const step3JQL = `project = SFAP AND issuetype = Bug AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware`;
    console.log('\n10. Testing bugs-bunny + Automated Test + CI:Stage4 + Firmware:');
    console.log(step3JQL);
    const step3Result = await jira.searchJira(step3JQL, { maxResults: 5 });
    console.log(`Step 3 bugs found: ${step3Result.total}`);

    // Step 4: Add date filter for current month
    const step4JQL = `project = SFAP AND issuetype = Bug AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware AND created >= startOfMonth() AND created <= endOfMonth()`;
    console.log('\n11. Testing with current month date filter:');
    console.log(step4JQL);
    const step4Result = await jira.searchJira(step4JQL, { maxResults: 5 });
    console.log(`Step 4 bugs found: ${step4Result.total}`);

    // Test with broader date range
    const step5JQL = `project = SFAP AND issuetype = Bug AND reporter = bugs-bunny AND component = "Automated Test" AND labels = CI:Stage4 AND text ~ Firmware AND created >= "2025-01-01"`;
    console.log('\n12. Testing with broader date range (2025):');
    console.log(step5JQL);
    const step5Result = await jira.searchJira(step5JQL, { maxResults: 5 });
    console.log(`Step 5 bugs found: ${step5Result.total}`);

    if (step5Result.total > 0) {
      console.log('\nFirst few results with broader date range:');
      step5Result.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.key}: ${issue.fields.summary}`);
        console.log(`   Created: ${issue.fields.created}`);
        console.log(`   Component: ${issue.fields.components?.map(c => c.name).join(', ') || 'None'}`);
        console.log(`   Labels: ${issue.fields.labels?.join(', ') || 'None'}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing JQL queries:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testJQLQueries();
