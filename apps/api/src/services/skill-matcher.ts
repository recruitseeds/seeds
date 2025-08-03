import Fuse from "fuse.js";
import type { ParsedResumeData, SkillMatch } from "../types/resume.js";
import type { CandidateScore } from "./candidate-scoring.js";
import type { JobRequirements } from "./job-requirements.js";
import type { Logger } from "./logger.js";

export class SkillMatcherService {
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	matchSkills(
		candidateSkills: string[],
		requiredSkills: string[],
		niceToHaveSkills: string[],
	): SkillMatch[] {
		const filteredCandidateSkills = candidateSkills.filter(
			(skill) => skill && typeof skill === "string",
		);
		const filteredRequiredSkills = requiredSkills.filter(
			(skill) => skill && typeof skill === "string",
		);
		const filteredNiceToHaveSkills = niceToHaveSkills.filter(
			(skill) => skill && typeof skill === "string",
		);
		const allJobSkills = [
			...filteredRequiredSkills,
			...filteredNiceToHaveSkills,
		];

		const fuse = new Fuse(filteredCandidateSkills, {
			threshold: 0.3,
			includeScore: true,
		});

		const skillMatches: SkillMatch[] = [];

		for (const jobSkill of allJobSkills) {
			const results = fuse.search(jobSkill);
			const isRequired = filteredRequiredSkills.includes(jobSkill);

			if (results.length > 0) {
				const bestMatch = results[0];
				const confidence = bestMatch.score ? 1 - bestMatch.score : 1;

				skillMatches.push({
					skill: jobSkill,
					found: true,
					confidence,
					context: `Found match: "${bestMatch.item}" (${isRequired ? "required" : "nice-to-have"})`,
				});
			} else {
				skillMatches.push({
					skill: jobSkill,
					found: false,
					confidence: 0,
					context: isRequired
						? "Required skill missing"
						: "Nice-to-have skill missing",
				});
			}
		}

		return skillMatches;
	}

	calculateCandidateScore(
		resumeData: ParsedResumeData,
		jobRequirements: JobRequirements,
	): Omit<CandidateScore, "candidateId"> {
		const candidateSkills = resumeData.skills || [];
		const requiredSkills = jobRequirements.required_skills || [];
		const niceToHaveSkills = jobRequirements.nice_to_have_skills || [];

		this.logger.debug("Calculating candidate score", {
			jobId: jobRequirements.id,
			candidateSkillsCount: candidateSkills.length,
			requiredSkillsCount: requiredSkills.length,
		});

		const skillMatches = this.matchSkills(
			candidateSkills,
			requiredSkills,
			niceToHaveSkills,
		);

		const requiredSkillMatches = skillMatches.filter(
			(match) => requiredSkills.includes(match.skill) && match.found,
		);
		const requiredSkillsScore =
			requiredSkills.length > 0
				? Math.round(
						(requiredSkillMatches.length / requiredSkills.length) * 100,
					)
				: 0;

		const missingRequiredSkills = skillMatches
			.filter((match) => requiredSkills.includes(match.skill) && !match.found)
			.map((match) => match.skill);

		const experienceScore = this.calculateExperienceScore(
			resumeData,
			jobRequirements,
		);
		const educationScore = this.calculateEducationScore(
			resumeData,
			jobRequirements,
		);

		const overallScore = Math.round(
			requiredSkillsScore * 0.4 + experienceScore * 0.4 + educationScore * 0.2,
		);

		return {
			jobId: jobRequirements.id,
			overallScore,
			requiredSkillsScore,
			experienceScore,
			educationScore,
			skillMatches,
			missingRequiredSkills,
			recommendations: [],
		};
	}

	generateRecommendations(
		resumeData: ParsedResumeData,
		score: Omit<CandidateScore, "candidateId">,
		jobRequirements: JobRequirements,
	): string[] {
		const recommendations: string[] = [];

		if (score.overallScore >= 85) {
			recommendations.push(
				"🌟 Excellent candidate - highly recommended for interview",
			);
		} else if (score.overallScore >= 70) {
			recommendations.push("👍 Good candidate - recommended for consideration");
		} else if (score.overallScore >= 50) {
			recommendations.push(
				"⚠️ Marginal candidate - may need additional evaluation",
			);
		} else {
			recommendations.push("❌ Below threshold - consider rejection");
		}

		if (score.requiredSkillsScore >= 90) {
			recommendations.push("💯 Has all required technical skills");
		} else if (score.missingRequiredSkills.length > 0) {
			recommendations.push(
				`⚠️ Missing ${score.missingRequiredSkills.length} required skill(s): ${score.missingRequiredSkills.slice(0, 3).join(", ")}`,
			);
		}

		if (score.experienceScore >= 80) {
			recommendations.push("💼 Strong relevant experience");
		}

		if (resumeData.certifications && resumeData.certifications.length > 0) {
			recommendations.push(
				`🏆 Has ${resumeData.certifications.length} professional certification(s)`,
			);
		}

		if (resumeData.projects && resumeData.projects.length >= 3) {
			recommendations.push("🚀 Strong project portfolio");
		}

		return recommendations;
	}

	shouldAutoReject(
		score: Omit<CandidateScore, "candidateId">,
		jobRequirements: JobRequirements,
	): boolean {
		if (score.overallScore < 40) {
			return true;
		}

		if (score.requiredSkillsScore < 50) {
			return true;
		}

		const criticalSkillsMissing =
			score.missingRequiredSkills.length >
			jobRequirements.required_skills.length / 2;

		if (criticalSkillsMissing) {
			return true;
		}

		return false;
	}

	private calculateExperienceScore(
		resumeData: ParsedResumeData,
		jobRequirements: JobRequirements,
	): number {
		if (!resumeData.experience || resumeData.experience.length === 0) {
			return 0;
		}

		const totalMonths = resumeData.experience.reduce((total, exp) => {
			const startDate = new Date(exp.startDate + "-01");
			const endDate = exp.endDate ? new Date(exp.endDate + "-01") : new Date();
			const months =
				(endDate.getFullYear() - startDate.getFullYear()) * 12 +
				(endDate.getMonth() - startDate.getMonth());
			return total + Math.max(0, months);
		}, 0);

		const yearsOfExperience = totalMonths / 12;
		const minRequired = jobRequirements.min_experience_years;

		if (yearsOfExperience >= minRequired * 1.5) {
			return 100;
		} else if (yearsOfExperience >= minRequired) {
			return 80;
		} else if (yearsOfExperience >= minRequired * 0.75) {
			return 60;
		} else {
			return Math.round((yearsOfExperience / minRequired) * 40);
		}
	}

	private calculateEducationScore(
		resumeData: ParsedResumeData,
		jobRequirements: JobRequirements,
	): number {
		if (!resumeData.education || resumeData.education.length === 0) {
			return 50;
		}

		const hasRelevantDegree = resumeData.education.some(
			(edu) =>
				edu.field.toLowerCase().includes("computer") ||
				edu.field.toLowerCase().includes("software") ||
				edu.field.toLowerCase().includes("engineering") ||
				edu.field.toLowerCase().includes("technology"),
		);

		const hasBachelorOrHigher = resumeData.education.some(
			(edu) =>
				edu.degree.toLowerCase().includes("bachelor") ||
				edu.degree.toLowerCase().includes("master") ||
				edu.degree.toLowerCase().includes("phd") ||
				edu.degree.toLowerCase().includes("doctorate"),
		);

		let score = 50;

		if (hasRelevantDegree) {
			score += 30;
		}

		if (hasBachelorOrHigher) {
			score += 20;
		}

		return Math.min(100, score);
	}
}
