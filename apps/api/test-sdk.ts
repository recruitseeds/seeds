import { SDK } from "./generated-sdks/typescript/src/index.js";

const sdk = new SDK({
  serverURL: "http://localhost:3001",
  bearerAuth: "3ZjdpJCjN5ALmQ1YiiQpGXnN"
});

async function testHealthCheck() {
  console.log("🔍 Testing health check endpoint...");
  try {
    const result = await sdk.health.getApiV1Health();
    console.log("✅ Health check result:", result);
  } catch (error) {
    console.error("❌ Health check failed:", error);
  }
}

async function testResumeParseAPI() {
  console.log("\n🔍 Testing resume parsing endpoint...");
  try {
    const result = await sdk.candidates.postApiV1CandidatesIdParseResume({
      id: "test-candidate-123",
      requestBody: {
        candidateId: "test-candidate-123",
        jobId: "test-job-456",
        fileName: "john_doe_resume.pdf",
        fileContent: `
JOHN DOE
Senior Software Engineer
Email: john.doe@email.com | Phone: +1-555-0123

EXPERIENCE
Senior Software Engineer | Tech Unicorn Inc | Mar 2021 - Present
• Led development of React-based dashboard serving 10M+ users
• Built microservices architecture with Node.js and TypeScript
• Managed AWS infrastructure with Docker containers
• Skills: React, TypeScript, Node.js, AWS, Docker, PostgreSQL

Full Stack Developer | StartupCorp | Jan 2019 - Feb 2021
• Built full-stack applications using React, Express.js, and MongoDB
• Implemented CI/CD pipelines and automated testing
• Skills: React, JavaScript, Express.js, MongoDB, Jest

EDUCATION
Bachelor of Science in Computer Science | Stanford University | 2018

SKILLS
React, TypeScript, Node.js, JavaScript, AWS, Docker, PostgreSQL, GraphQL, MongoDB
        `.trim()
      }
    });
    console.log("✅ Resume parsing result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Resume parsing failed:", error);
  }
}

async function runTests() {
  console.log("🚀 Testing Seeds API SDK\n");
  
  await testHealthCheck();
  await testResumeParseAPI();
  
  console.log("\n✨ SDK tests completed!");
}

runTests();