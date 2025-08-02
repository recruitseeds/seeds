import { Effect } from "effect";
import type { ParsedResumeData } from "../../src/types/resume.js";

export const mockParsedResumeData: ParsedResumeData = {
	personalInfo: {
		name: "Jane Smith",
		email: "jane.smith@email.com",
		phone: "+1-555-0123",
		location: "San Francisco, CA",
		linkedinUrl: "https://linkedin.com/in/janesmith",
		githubUrl: "https://github.com/janesmith",
	},
	summary:
		"Senior software engineer with 5+ years of experience in full-stack development",
	experience: [
		{
			company: "Tech Corp",
			position: "Senior Software Engineer",
			startDate: "2020-01",
			endDate: "2024-01",
			description:
				"Led development of React applications with TypeScript and Node.js backend",
			skills: ["React", "TypeScript", "Node.js", "AWS"],
			location: "San Francisco, CA",
		},
	],
	education: [
		{
			institution: "Stanford University",
			degree: "Bachelor of Science",
			field: "Computer Science",
			graduationDate: "2019-06",
		},
	],
	skills: ["React", "TypeScript", "Node.js", "AWS", "Docker", "PostgreSQL"],
	projects: [
		{
			name: "E-commerce Platform",
			description: "Built a full-stack e-commerce platform",
			technologies: ["React", "Node.js", "PostgreSQL"],
			githubUrl: "https://github.com/janesmith/ecommerce",
		},
	],
	certifications: [
		{
			name: "AWS Solutions Architect",
			issuer: "Amazon Web Services",
			issueDate: "2023-03",
		},
	],
	languages: ["English", "Spanish"],
};

export const createMockAIService = (shouldFail = false) => ({
	parseResume: (content: string, fileName: string) =>
		shouldFail
			? Effect.fail(new Error("AI service unavailable"))
			: Effect.succeed(mockParsedResumeData),
});
