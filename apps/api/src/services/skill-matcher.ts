import { Context, Effect, Layer } from "effect";
import Fuse from "fuse.js";
import type {
	CandidateScore,
	ParsedResumeData,
	SkillMatch,
} from "../types/resume.js";
import { LoggerService } from "./logger.js";

export interface JobRequirements {
	id: string;
	title: string;
	required_skills: string[];
	nice_to_have_skills: string[];
	minimum_experience_years: number;
	preferred_education_level: string[];
	industry: string;
	seniority_level: "junior" | "mid" | "senior" | "lead" | "executive";
}

export interface SkillMatcherService {
	readonly matchSkills: (
		candidateSkills: string[],
		requiredSkills: string[],
		niceToHaveSkills: string[],
	) => Effect.Effect<SkillMatch[]>;

	readonly calculateCandidateScore: (
		resumeData: ParsedResumeData,
		jobRequirements: JobRequirements,
	) => Effect.Effect<CandidateScore>;

	readonly shouldAutoReject: (
		score: CandidateScore,
		jobRequirements: JobRequirements,
	) => Effect.Effect<boolean>;

	readonly generateRecommendations: (
		resumeData: ParsedResumeData,
		score: CandidateScore,
		jobRequirements: JobRequirements,
	) => Effect.Effect<string[]>;
}

export const SkillMatcherService = Context.GenericTag<SkillMatcherService>(
	"SkillMatcherService",
);

const SKILL_ALIASES: Record<string, string[]> = {
	javascript: ["js", "javascript", "ecmascript", "node.js", "nodejs"],
	typescript: ["ts", "typescript"],
	python: ["python", "python3", "py"],
	react: ["react", "reactjs", "react.js"],
	vue: ["vue", "vuejs", "vue.js"],
	angular: ["angular", "angularjs", "angular.js"],
	aws: ["aws", "amazon web services", "amazon aws"],
	docker: ["docker", "containerization", "containers"],
	kubernetes: ["kubernetes", "k8s", "kube"],
	postgresql: ["postgresql", "postgres", "psql"],
	mysql: ["mysql", "my sql"],
	mongodb: ["mongodb", "mongo", "mongo db"],
	git: ["git", "version control", "source control"],
	graphql: ["graphql", "graph ql"],
	rest: ["rest", "restful", "rest api", "restful api"],
	microservices: [
		"microservices",
		"micro services",
		"service oriented architecture",
	],
	agile: ["agile", "scrum", "kanban"],
	devops: ["devops", "dev ops", "ci/cd", "continuous integration"],
};

const createSkillNormalizer = () => {
	const normalizer: Record<string, string> = {};

	for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
		for (const alias of aliases) {
			normalizer[alias.toLowerCase()] = canonical;
		}
	}

	return normalizer;
};

const SKILL_NORMALIZER = createSkillNormalizer();

const normalizeSkill = (skill: string): string => {
	const normalized = skill.toLowerCase().trim();
	return SKILL_NORMALIZER[normalized] || normalized;
};

const calculateSkillMatchScore = (
	candidateSkills: string[],
	requiredSkills: string[],
): number => {
	if (requiredSkills.length === 0) return 100;

	const normalizedCandidateSkills = candidateSkills.map(normalizeSkill);
	const normalizedRequiredSkills = requiredSkills.map(normalizeSkill);

	const fuse = new Fuse(normalizedCandidateSkills, {
		threshold: 0.3,
		includeScore: true,
	});

	let matchedSkills = 0;

	for (const requiredSkill of normalizedRequiredSkills) {
		if (normalizedCandidateSkills.includes(requiredSkill)) {
			matchedSkills++;
			continue;
		}

		const fuzzyResults = fuse.search(requiredSkill);
		if (fuzzyResults.length > 0 && (fuzzyResults[0].score ?? 1) < 0.3) {
			matchedSkills++;
		}
	}

	return Math.round((matchedSkills / normalizedRequiredSkills.length) * 100);
};

const calculateExperienceScore = (
	resumeData: ParsedResumeData,
	jobRequirements: JobRequirements,
): number => {
	const totalYears = resumeData.experience.reduce((years, exp) => {
		const start = new Date(exp.startDate);
		const end = exp.endDate ? new Date(exp.endDate) : new Date();
		const expYears =
			(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
		return years + expYears;
	}, 0);

	if (totalYears >= jobRequirements.minimum_experience_years) {
		const bonus = Math.min(
			(totalYears - jobRequirements.minimum_experience_years) * 5,
			20,
		);
		return Math.min(100, 80 + bonus);
	}

	return Math.max(
		0,
		(totalYears / jobRequirements.minimum_experience_years) * 80,
	);
};

const calculateEducationScore = (
	resumeData: ParsedResumeData,
	jobRequirements: JobRequirements,
): number => {
	if (jobRequirements.preferred_education_level.length === 0) return 100;

	const educationLevels = [
		"high school",
		"associate",
		"bachelor",
		"master",
		"phd",
		"doctorate",
	];

	const candidateHighestLevel = resumeData.education.reduce((highest, edu) => {
		const level = educationLevels.findIndex(
			(l) =>
				edu.degree.toLowerCase().includes(l) ||
				edu.field.toLowerCase().includes(l),
		);
		return Math.max(highest, level);
	}, -1);

	const requiredLevel = Math.max(
		...jobRequirements.preferred_education_level.map((req) =>
			educationLevels.findIndex((l) => req.toLowerCase().includes(l)),
		),
	);

	if (candidateHighestLevel >= requiredLevel) {
		return 100;
	}
	if (candidateHighestLevel >= 0) {
		return Math.max(50, (candidateHighestLevel / requiredLevel) * 100);
	}

	return 25;
};

const make = Effect.gen(function* () {
	const logger = yield* LoggerService;

	const skillMatcherService: SkillMatcherService = {
		matchSkills: (
			candidateSkills: string[],
			requiredSkills: string[],
			niceToHaveSkills: string[],
		) =>
			Effect.gen(function* () {
				yield* logger.debug("Starting skill matching", {
					candidateSkillsCount: candidateSkills.length,
					requiredSkillsCount: requiredSkills.length,
					niceToHaveSkillsCount: niceToHaveSkills.length,
				});

				const normalizedCandidateSkills = candidateSkills.map(normalizeSkill);
				const allRequiredSkills = [...requiredSkills, ...niceToHaveSkills].map(
					normalizeSkill,
				);

				const fuse = new Fuse(normalizedCandidateSkills, {
					threshold: 0.3,
					includeScore: true,
				});

				const matches: SkillMatch[] = [];

				for (const skill of allRequiredSkills) {
					const isRequired = requiredSkills.map(normalizeSkill).includes(skill);

					if (normalizedCandidateSkills.includes(skill)) {
						matches.push({
							skill,
							found: true,
							confidence: 1.0,
							context: "Exact match found in candidate skills",
						});
						continue;
					}

					const fuzzyResults = fuse.search(skill);
					if (fuzzyResults.length > 0 && (fuzzyResults[0].score ?? 1) < 0.3) {
						matches.push({
							skill,
							found: true,
							confidence: 1 - (fuzzyResults[0].score ?? 0),
							context: `Similar skill found: ${fuzzyResults[0].item}`,
						});
					} else {
						matches.push({
							skill,
							found: false,
							confidence: 0,
							context: isRequired
								? "Required skill missing"
								: "Nice-to-have skill missing",
						});
					}
				}

				yield* logger.debug("Skill matching completed", {
					totalSkillsEvaluated: matches.length,
					foundSkills: matches.filter((m) => m.found).length,
					missingSkills: matches.filter((m) => !m.found).length,
				});

				return matches;
			}),

		calculateCandidateScore: (
			resumeData: ParsedResumeData,
			jobRequirements: JobRequirements,
		) =>
			Effect.gen(function* () {
				yield* logger.info("Calculating candidate score", {
					candidateSkills: resumeData.skills.length,
					jobTitle: jobRequirements.title,
					requiredSkills: jobRequirements.required_skills.length,
				});

				const skillMatches = yield* skillMatcherService.matchSkills(
					[...resumeData.skills],
					jobRequirements.required_skills,
					jobRequirements.nice_to_have_skills,
				);

				const requiredSkillsScore = calculateSkillMatchScore(
					[...resumeData.skills],
					jobRequirements.required_skills,
				);

				const experienceScore = calculateExperienceScore(
					resumeData,
					jobRequirements,
				);
				const educationScore = calculateEducationScore(
					resumeData,
					jobRequirements,
				);

				const overallScore = Math.round(
					requiredSkillsScore * 0.5 +
						experienceScore * 0.3 +
						educationScore * 0.2,
				);

				const missingRequiredSkills = jobRequirements.required_skills.filter(
					(skill) => {
						const normalizedSkill = normalizeSkill(skill);
						return !skillMatches.find(
							(match: SkillMatch) =>
								normalizeSkill(match.skill) === normalizedSkill && match.found,
						);
					},
				);

				const score: CandidateScore = {
					candidateId: "placeholder",
					jobId: jobRequirements.id,
					overallScore,
					requiredSkillsScore,
					experienceScore: Math.round(experienceScore),
					educationScore: Math.round(educationScore),
					skillMatches,
					missingRequiredSkills,
					recommendations: [],
				};

				yield* logger.info("Candidate score calculated", {
					overallScore,
					requiredSkillsScore,
					experienceScore: score.experienceScore,
					educationScore: score.educationScore,
					missingRequiredSkills: missingRequiredSkills.length,
				});

				return score;
			}),

		shouldAutoReject: (
			score: CandidateScore,
			_jobRequirements: JobRequirements,
		) =>
			Effect.gen(function* () {
				const criticalSkillsMissing = score.missingRequiredSkills.length > 0;

				const scoreTooLow = score.overallScore < 30;

				const requiredSkillsInsufficient = score.requiredSkillsScore < 50;

				const shouldReject =
					criticalSkillsMissing || scoreTooLow || requiredSkillsInsufficient;

				yield* logger.info("Auto-rejection evaluation", {
					shouldReject,
					criticalSkillsMissing,
					scoreTooLow,
					requiredSkillsInsufficient,
					overallScore: score.overallScore,
					requiredSkillsScore: score.requiredSkillsScore,
				});

				return shouldReject;
			}),

		generateRecommendations: (
			resumeData: ParsedResumeData,
			score: CandidateScore,
			_jobRequirements: JobRequirements,
		) =>
			Effect.gen(function* () {
				const recommendations: string[] = [];

				if (score.overallScore >= 85) {
					recommendations.push(
						"🌟 Excellent candidate - highly recommended for interview",
					);
				} else if (score.overallScore >= 70) {
					recommendations.push(
						"✅ Strong candidate - recommended for screening call",
					);
				} else if (score.overallScore >= 50) {
					recommendations.push(
						"⚠️ Moderate fit - consider for junior roles or with training",
					);
				} else {
					recommendations.push(
						"❌ Poor fit - significant gaps in requirements",
					);
				}

				if (score.requiredSkillsScore >= 90) {
					recommendations.push("💡 Has all required technical skills");
				} else if (score.missingRequiredSkills.length > 0) {
					recommendations.push(
						`🔍 Missing key skills: ${score.missingRequiredSkills.slice(0, 3).join(", ")}`,
					);
				}

				if (score.experienceScore >= 80) {
					recommendations.push("👨‍💼 Strong relevant experience");
				} else if (score.experienceScore < 50) {
					recommendations.push("📚 Limited experience - may need mentoring");
				}

				if (score.educationScore >= 80) {
					recommendations.push("🎓 Strong educational background");
				}

				if (resumeData.projects.length >= 3) {
					recommendations.push(
						"🚀 Active project portfolio demonstrates initiative",
					);
				}

				if (resumeData.certifications.length >= 2) {
					recommendations.push(
						"📜 Professional certifications show commitment to learning",
					);
				}

				yield* logger.debug("Generated recommendations", {
					recommendationCount: recommendations.length,
					overallScore: score.overallScore,
				});

				return recommendations;
			}),
	} satisfies SkillMatcherService;

	return skillMatcherService;
});

export const SkillMatcherServiceLive = Layer.effect(SkillMatcherService, make);
