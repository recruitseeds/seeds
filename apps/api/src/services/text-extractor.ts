import mammoth from "mammoth";
import pdfParse from "pdf-parse-new";
import type { Logger } from "./logger.js";

export interface ExtractedContent {
	text: string;
	annotationLinks: string[];
}

export class TextExtractorService {
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	/**
	 * Extract text and annotation links from PDF buffer
	 */
	async extractFromPDF(fileBuffer: Buffer): Promise<ExtractedContent> {
		this.logger.info("Starting PDF text and link extraction");
		
		try {
			const data = await pdfParse(fileBuffer);
			
			this.logger.info("PDF text extraction completed", {
				textLength: data.text.length,
				numPages: data.numpages,
			});

			return {
				text: data.text,
				annotationLinks: [],
			};
		} catch (error) {
			this.logger.error("Failed to extract text from PDF", error);
			throw new Error("Failed to parse PDF file");
		}
	}

	/**
	 * Extract text from DOCX buffer
	 */
	async extractFromDOCX(fileBuffer: Buffer): Promise<ExtractedContent> {
		this.logger.info("Starting DOCX text extraction");
		
		try {
			const result = await mammoth.extractRawText({ buffer: fileBuffer });
			
			this.logger.info("DOCX text extraction completed", {
				textLength: result.value.length,
				hasWarnings: result.messages.length > 0,
			});

			if (result.messages.length > 0) {
				this.logger.debug("DOCX extraction warnings", {
					messages: result.messages.map(m => m.message),
				});
			}

			return {
				text: result.value,
				annotationLinks: [],
			};
		} catch (error) {
			this.logger.error("Failed to extract text from DOCX", error);
			throw new Error("Failed to parse DOCX file");
		}
	}

	/**
	 * Extract text and links from buffer based on MIME type
	 */
	async extractContent(fileBuffer: Buffer, mimeType: string): Promise<ExtractedContent> {
		this.logger.info("Starting content extraction", {
			mimeType,
			bufferSize: fileBuffer.length,
		});

		switch (mimeType) {
			case "application/pdf":
				return this.extractFromPDF(fileBuffer);
			
			case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
				return this.extractFromDOCX(fileBuffer);
			
			case "application/msword":
				throw new Error("Legacy .doc files are not supported. Please convert to .docx format.");
			
			case "text/plain":
				return {
					text: fileBuffer.toString("utf-8"),
					annotationLinks: [],
				};
			
			default:
				throw new Error(`Unsupported file type: ${mimeType}`);
		}
	}

	/**
	 * Extract text from plain text content (for backwards compatibility)
	 */
	extractFromText(textContent: string): ExtractedContent {
		return {
			text: textContent,
			annotationLinks: [],
		};
	}
}