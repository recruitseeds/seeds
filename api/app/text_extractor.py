import io
import logging

import docx
import fitz
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

SUPPORTED_CONTENT_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


def get_file_extension(file_key: str) -> str | None:
    """
    Extracts the file extension from a file key string.
    
    Removes any query parameters or fragments before extracting the extension. Returns the extension in lowercase, or None if no extension is found.
    """
    if '.' in file_key:
        base_key = file_key.split('?')[0].split('#')[0]
        if '.' in base_key:
            return base_key.split('.')[-1].lower()
    return None


def extract_text_and_links_from_pdf(file_content: bytes) -> tuple[str, list[str]]:
    """
    Extracts text and unique URI links from a PDF file provided as bytes.
    
    Opens the PDF, concatenates text from all pages, and collects all unique non-empty URI links from page annotations. Returns the extracted text and a sorted list of unique links. On error, returns empty text and link list.
    
    Args:
        file_content: The PDF file content as bytes.
    
    Returns:
        A tuple containing the extracted text and a sorted list of unique URI links.
    """
    text = ""
    links = []
    try:
        with fitz.open(stream=file_content, filetype="pdf") as doc:
            logger.info(f"Processing PDF with {len(doc)} pages.")
            for page_num, page in enumerate(doc):
                page_text = page.get_text("text", sort=True)
                if page_text:
                    text += page_text + "\n"

                page_links = page.get_links()
                if page_links:
                    logger.debug(
                        f"Found {len(page_links)} potential links on page {page_num + 1}.")
                    for link in page_links:
                        if link.get('kind') == fitz.LINK_URI and link.get('uri'):
                            uri = link.get('uri')
                            if isinstance(uri, str) and uri.strip():
                                cleaned_uri = uri.strip()
                                links.append(cleaned_uri)
                                logger.debug(
                                    f"Extracted PDF link URI: {cleaned_uri}")

    except Exception as e:
        logger.error(
            f"Error extracting text/links from PDF: {e}", exc_info=True)
        return "", []

    unique_links = sorted(list(set(links)))
    logger.info(
        f"Extracted {len(text)} characters and {len(unique_links)} unique links from PDF.")
    return text, unique_links


def extract_text_from_docx(file_content: bytes) -> str:
    """
    Extracts and returns all text from a DOCX file provided as bytes.
    
    If extraction fails, returns an empty string.
    """
    text = ""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        logger.info(f"Processing DOCX document.")
        for para in doc.paragraphs:
            text += para.text + "\n"
        logger.info(f"Extracted {len(text)} characters from DOCX.")
    except Exception as e:
        logger.error(f"Error extracting text from DOCX: {e}", exc_info=True)
        return ""
    return text


def extract_text(file_content: bytes, file_key: str) -> tuple[str, list[str]]:
    """
    Extracts text and annotation links from a PDF or DOCX file based on its extension.
    
    Determines the file type from the provided file key and delegates extraction to the appropriate function. Returns both extracted text and a list of annotation links for PDFs, or text and an empty list for DOCX files. Raises an HTTP 415 error if the file type is unsupported.
    
    Args:
        file_content: The binary content of the file to extract from.
        file_key: The identifier or filename used to determine the file extension.
    
    Returns:
        A tuple containing the extracted text and a list of annotation links (empty for DOCX).
    """
    extension = get_file_extension(file_key)
    logger.info(
        f"Attempting text extraction for file key: {file_key} (extension: {extension})")
    text = ""
    annotation_links = []

    if extension == "pdf":
        text, annotation_links = extract_text_and_links_from_pdf(file_content)
    elif extension == "docx":
        text = extract_text_from_docx(file_content)
        logger.info(
            "DOCX file processed. Annotation link extraction not applicable.")
    else:
        logger.warning(
            f"Unsupported file type received: {extension} for key: {file_key}")
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: '{extension}'. Only PDF and DOCX are currently supported."
        )

    if not text and not annotation_links:
        logger.warning(
            f"Could not extract text or links from file: {file_key}")

    return text, annotation_links
