import type { Logger } from "./logger.js";

export interface ExtractedUrls {
	linkedinUrl?: string;
	githubUrl?: string;
	twitterUrl?: string;
	portfolioUrl?: string;
	otherLinks: string[];
}

export class UrlExtractorService {
	private logger: Logger;

	private static readonly URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;
	private static readonly LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub|company)\/[\w\-_]+\/?/gi;
	private static readonly GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w\-_]+\/?/gi;
	private static readonly TWITTER_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/[\w]+\/?/gi;
	
	private static readonly PORTFOLIO_KEYWORDS = [
		"portfolio", "about", "me", "dev", "design", "blog", "projects", "github.io",
		"behance", "dribbble", "personal website"
	];

	constructor(logger: Logger) {
		this.logger = logger;
	}

	/**
	 * Extract URLs from resume text and optional annotation links
	 * This replicates the Python parser's URL extraction logic
	 */
	extractUrls(resumeText: string, annotationLinks: string[] = []): ExtractedUrls {
		this.logger.info("Starting URL extraction from resume", {
			textLength: resumeText.length,
			annotationLinksCount: annotationLinks.length,
		});

		const textUrls = this.extractUrlsFromText(resumeText);
		
		const allPotentialUrls = new Set<string>();
		
		for (const url of textUrls) {
			const cleanUrl = url.trim().replace(/\/$/, "");
			if (cleanUrl) {
				allPotentialUrls.add(cleanUrl);
			}
		}
		
		for (const link of annotationLinks) {
			const cleanLink = link.trim().replace(/\/$/, "");
			if (cleanLink) {
				allPotentialUrls.add(cleanLink);
			}
		}

		this.logger.debug("All potential URLs found", {
			totalUrls: allPotentialUrls.size,
			urls: Array.from(allPotentialUrls),
		});

		const result: ExtractedUrls = {
			otherLinks: [],
		};

		const remainingUrls: string[] = [];

		for (const url of Array.from(allPotentialUrls)) {
			if (!result.linkedinUrl && this.isLinkedInUrl(url)) {
				result.linkedinUrl = url;
				this.logger.debug("Found LinkedIn URL", { url });
			} else if (!result.githubUrl && this.isGitHubUrl(url)) {
				result.githubUrl = url;
				this.logger.debug("Found GitHub URL", { url });
			} else if (!result.twitterUrl && this.isTwitterUrl(url)) {
				result.twitterUrl = url;
				this.logger.debug("Found Twitter URL", { url });
			} else {
				remainingUrls.push(url);
			}
		}

		const finalOtherLinks = new Set<string>();
		
		for (const url of remainingUrls) {
			const isAlreadyPrimary = url === result.linkedinUrl || 
									url === result.githubUrl || 
									url === result.twitterUrl;
			
			if (!isAlreadyPrimary && !result.portfolioUrl && this.isPortfolioUrl(url)) {
				result.portfolioUrl = url;
				this.logger.debug("Found portfolio URL", { url });
			} else if (!isAlreadyPrimary && url !== result.portfolioUrl) {
				if (!url.includes("@")) {
					finalOtherLinks.add(url);
				}
			}
		}

		result.otherLinks = Array.from(finalOtherLinks).sort();

		this.logger.info("URL extraction completed", {
			linkedinUrl: !!result.linkedinUrl,
			githubUrl: !!result.githubUrl,
			twitterUrl: !!result.twitterUrl,
			portfolioUrl: !!result.portfolioUrl,
			otherLinksCount: result.otherLinks.length,
		});

		return result;
	}

	/**
	 * Extract URLs from text using regex patterns
	 */
	private extractUrlsFromText(text: string): string[] {
		const urls: string[] = [];
		const matches = text.match(UrlExtractorService.URL_REGEX);
		
		if (matches) {
			urls.push(...matches);
		}

		return urls;
	}

	/**
	 * Check if URL is a LinkedIn profile
	 */
	private isLinkedInUrl(url: string): boolean {
		return UrlExtractorService.LINKEDIN_REGEX.test(url);
	}

	/**
	 * Check if URL is a GitHub profile
	 */
	private isGitHubUrl(url: string): boolean {
		return UrlExtractorService.GITHUB_REGEX.test(url);
	}

	/**
	 * Check if URL is a Twitter profile
	 */
	private isTwitterUrl(url: string): boolean {
		return UrlExtractorService.TWITTER_REGEX.test(url);
	}

	/**
	 * Check if URL is likely a portfolio based on keywords
	 */
	private isPortfolioUrl(url: string): boolean {
		const urlLower = url.toLowerCase();
		return UrlExtractorService.PORTFOLIO_KEYWORDS.some(keyword => 
			urlLower.includes(keyword.toLowerCase())
		);
	}
}