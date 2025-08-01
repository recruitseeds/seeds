import type { ParsedResumeData } from "../../src/types/resume.js";

export const TestDataFactory = {
	createJobPosting(
		overrides: Partial<{
			title: string;
			required_skills: string[];
			nice_to_have_skills: string[];
			experience_level: string;
			description: string;
		}> = {},
	) {
		return {
			id: "job-123",
			title: "Senior Software Engineer",
			required_skills: ["TypeScript", "React", "Node.js"],
			nice_to_have_skills: ["AWS", "Docker", "GraphQL"],
			experience_level: "senior",
			description: "We are looking for a senior software engineer...",
			...overrides,
		};
	},

	createCandidateProfile(
		overrides: Partial<{
			id: string;
			first_name: string;
			last_name: string;
			email: string;
		}> = {},
	) {
		return {
			id: "candidate-123",
			first_name: "John",
			last_name: "Doe",
			email: "john.doe@example.com",
			...overrides,
		};
	},

	createStrongEngineerResume(): ParsedResumeData {
		return {
			personalInfo: {
				name: "Sarah Johnson",
				email: "sarah.johnson@email.com",
				phone: "+1-555-0123",
				location: "San Francisco, CA",
				linkedinUrl: "https://linkedin.com/in/sarahjohnson",
				githubUrl: "https://github.com/sarahjohnson",
			},
			summary:
				"Senior full-stack engineer with 6+ years of experience building scalable web applications using modern JavaScript frameworks and cloud technologies.",
			experience: [
				{
					company: "Tech Unicorn Inc",
					position: "Senior Software Engineer",
					startDate: "2021-03",
					endDate: "2024-01",
					description:
						"Led development of React-based dashboard serving 10M+ users. Built microservices architecture with Node.js and TypeScript. Managed AWS infrastructure with Docker containers.",
					skills: [
						"React",
						"TypeScript",
						"Node.js",
						"AWS",
						"Docker",
						"PostgreSQL",
						"GraphQL",
					],
					location: "San Francisco, CA",
				},
				{
					company: "StartupCorp",
					position: "Full Stack Developer",
					startDate: "2019-01",
					endDate: "2021-02",
					description:
						"Built full-stack applications using React, Express.js, and MongoDB. Implemented CI/CD pipelines and automated testing.",
					skills: ["React", "JavaScript", "Express.js", "MongoDB", "Jest", "CI/CD"],
					location: "Austin, TX",
				},
			],
			education: [
				{
					institution: "Stanford University",
					degree: "Bachelor of Science",
					field: "Computer Science",
					graduationDate: "2018-06",
					gpa: "3.8",
				},
			],
			skills: [
				"React",
				"TypeScript",
				"Node.js",
				"JavaScript",
				"AWS",
				"Docker",
				"PostgreSQL",
				"GraphQL",
				"MongoDB",
				"Express.js",
				"Jest",
				"CI/CD",
				"Kubernetes",
				"Redis",
				"Git",
				"Agile",
				"System Design",
			],
			projects: [
				{
					name: "Open Source Task Manager",
					description:
						"Built a collaborative task management app with real-time updates",
					technologies: ["React", "Socket.io", "Node.js", "PostgreSQL"],
					githubUrl: "https://github.com/sarahjohnson/task-manager",
					url: "https://taskmanager.sarahjohnson.dev",
				},
				{
					name: "E-commerce Analytics Dashboard",
					description: "Real-time analytics dashboard for e-commerce platforms",
					technologies: ["TypeScript", "D3.js", "Express.js", "Redis"],
					githubUrl: "https://github.com/sarahjohnson/analytics-dashboard",
				},
			],
			certifications: [
				{
					name: "AWS Solutions Architect Associate",
					issuer: "Amazon Web Services",
					issueDate: "2023-05",
					credentialId: "AWS-ASA-123456",
				},
			],
			languages: ["English", "Spanish"],
		};
	},

	createWeakEngineerResume(): ParsedResumeData {
		return {
			personalInfo: {
				name: "Bob Smith",
				email: "bob.smith@email.com",
				location: "Remote",
			},
			experience: [
				{
					company: "Local Web Shop",
					position: "Junior Developer",
					startDate: "2023-01",
					description:
						"Worked on WordPress websites and basic HTML/CSS modifications",
					skills: ["HTML", "CSS", "WordPress", "PHP"],
					location: "Remote",
				},
			],
			education: [
				{
					institution: "Community College",
					degree: "Associate Degree",
					field: "Web Development",
					graduationDate: "2022-12",
				},
			],
			skills: ["HTML", "CSS", "WordPress", "PHP", "jQuery"],
			projects: [],
			certifications: [],
			languages: ["English"],
		};
	},

	createResumeContent(type: "strong" | "weak" | "different-field"): string {
		switch (type) {
			case "strong":
				return `
          SARAH JOHNSON
          Senior Software Engineer
          Email: sarah.johnson@email.com | Phone: +1-555-0123
          GitHub: https://github.com/sarahjohnson | LinkedIn: https://linkedin.com/in/sarahjohnson

          EXPERIENCE
          Senior Software Engineer | Tech Unicorn Inc | Mar 2021 - Jan 2024
          • Led development of React-based dashboard serving 10M+ users
          • Built microservices architecture with Node.js and TypeScript
          • Managed AWS infrastructure with Docker containers
          • Skills: React, TypeScript, Node.js, AWS, Docker, PostgreSQL, GraphQL

          Full Stack Developer | StartupCorp | Jan 2019 - Feb 2021
          • Built full-stack applications using React, Express.js, and MongoDB
          • Implemented CI/CD pipelines and automated testing
          • Skills: React, JavaScript, Express.js, MongoDB, Jest, CI/CD

          EDUCATION
          Bachelor of Science in Computer Science | Stanford University | 2018

          SKILLS
          React, TypeScript, Node.js, JavaScript, AWS, Docker, PostgreSQL, GraphQL, MongoDB
        `;
			case "weak":
				return `
          BOB SMITH
          Junior Developer
          Email: bob.smith@email.com

          EXPERIENCE
          Junior Developer | Local Web Shop | Jan 2023 - Present
          • Worked on WordPress websites and basic HTML/CSS modifications
          • Skills: HTML, CSS, WordPress, PHP

          EDUCATION
          Associate Degree in Web Development | Community College | 2022

          SKILLS
          HTML, CSS, WordPress, PHP, jQuery
        `;
			case "different-field":
				return `
          ALICE COOPER
          Marketing Manager
          Email: alice.cooper@email.com

          EXPERIENCE
          Marketing Manager | Fashion Corp | 2020 - Present
          • Managed social media campaigns and content marketing
          • Analyzed customer data and market trends
          • Skills: Google Analytics, Adobe Creative Suite, Content Marketing

          EDUCATION
          Bachelor of Arts in Marketing | Business University | 2019

          SKILLS
          Marketing Strategy, Google Analytics, Adobe Photoshop, Content Creation
        `;
		}
	},

	createParseResumeRequest(
		overrides: Partial<{
			candidateId: string;
			jobId: string;
			fileContent: string;
			fileName: string;
		}> = {},
	) {
		return {
			candidateId: "candidate-123",
			jobId: "job-456",
			fileContent: TestDataFactory.createResumeContent("strong"),
			fileName: "resume.txt",
			...overrides,
		};
	},
};