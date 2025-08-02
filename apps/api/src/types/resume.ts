export interface PersonalInfo {
	name: string;
	email?: string;
	phone?: string;
	location?: string;
	linkedinUrl?: string;
	githubUrl?: string;
	portfolioUrl?: string;
}

export interface Experience {
	company: string;
	position: string;
	startDate: string;
	endDate?: string;
	description: string;
	skills: string[];
	location?: string;
}

export interface Education {
	institution: string;
	degree: string;
	field: string;
	graduationDate?: string;
	gpa?: string;
}

export interface Project {
	name: string;
	description: string;
	technologies: string[];
	url?: string;
	githubUrl?: string;
}

export interface Certification {
	name: string;
	issuer: string;
	issueDate?: string;
	expirationDate?: string;
	credentialId?: string;
	url?: string;
}

export interface ParsedResumeData {
	personalInfo: PersonalInfo;
	summary?: string;
	experience: Experience[];
	education: Education[];
	skills: string[];
	projects: Project[];
	certifications: Certification[];
	languages: string[];
}

export interface SkillMatch {
	skill: string;
	found: boolean;
	confidence: number;
	context?: string;
}

export interface ParseResumeRequest {
	candidateId: string;
	jobId: string;
	fileContent: string;
	fileName: string;
}

export interface ParseResumeResponse {
	success: boolean;
	data?: {
		parsedData: ParsedResumeData;
		score: {
			candidateId: string;
			jobId: string;
			overallScore: number;
			requiredSkillsScore: number;
			experienceScore: number;
			educationScore: number;
			skillMatches: SkillMatch[];
			missingRequiredSkills: string[];
			recommendations: string[];
		};
	};
	error?: string;
}
