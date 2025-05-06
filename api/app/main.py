import json
import logging
import random
import string
import time

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from .config import Settings, settings
from .models import ParseRequest, ResumeData
from .parser import parse_resume_text
from .text_extractor import extract_text
from .utils import download_file_from_r2


class PrettyJSONResponse(JSONResponse):
    def render(self, content: any) -> bytes:
        return json.dumps(
            jsonable_encoder(content),
            ensure_ascii=False,
            allow_nan=False,
            indent=2,
            separators=(", ", ": "),
        ).encode("utf-8")


logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Resume Parser API",
    description="API to parse resume files stored in R2.",
    version="0.1.0",
    default_response_class=PrettyJSONResponse
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    idem = "".join(random.choices(string.ascii_uppercase +
                   string.digits, k=6))
    logger.info(
        f"rid={idem} start request path={request.url.path} method={request.method}")
    start_time = time.time()

    response = await call_next(request)

    process_time = (time.time() - start_time) * 1000
    formatted_process_time = '{0:.2f}'.format(process_time)
    logger.info(
        f"rid={idem} completed_in={formatted_process_time}ms status_code={response.status_code}")

    return response


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(
        f"Unhandled exception during request to {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected internal server error occurred."},
    )


def get_settings() -> Settings:
    return settings


@app.post("/parse/",
          response_model=ResumeData,
          status_code=status.HTTP_200_OK,
          summary="Parse Resume from R2",
          description="Downloads a resume file (PDF or DOCX) from the configured R2 bucket using the provided file key, extracts text and links, and attempts to parse structured data.")
async def parse_resume_endpoint(
    request: ParseRequest,
):
    """
    Parses a resume file stored in R2.

    - **request**: Body containing the `file_key`.
        - **file_key**: The key (path including filename) of the resume file in the R2 bucket (e.g., `resumes/user123/my_resume.pdf`).
    \f # Adds space in Swagger UI docs
    :param request: The request body containing the file key.
    :return: A JSON object with the parsed resume data.
    """
    file_key = request.file_key
    logger.info(f"Received request to parse file key: {file_key}")

    try:
        logger.info(f"Downloading file {file_key} from R2...")
        download_start_time = time.time()
        file_content = download_file_from_r2(file_key)
        download_time = (time.time() - download_start_time) * 1000
        logger.info(
            f"File {file_key} downloaded successfully ({len(file_content)} bytes) in {download_time:.2f}ms.")

        logger.info(f"Extracting text and links from {file_key}...")
        extract_start_time = time.time()
        text, annotation_links = extract_text(file_content, file_key)
        extract_time = (time.time() - extract_start_time) * 1000
        logger.info(
            f"Text ({len(text)} chars) and {len(annotation_links)} annotation links extracted in {extract_time:.2f}ms.")

        logger.info(f"Parsing text and links from {file_key}...")
        parse_start_time = time.time()
        parsed_data = parse_resume_text(text, annotation_links)
        parse_time = (time.time() - parse_start_time) * 1000
        logger.info(f"Parsing complete for {file_key} in {parse_time:.2f}ms.")

        return parsed_data

    except HTTPException as http_exc:
        logger.error(
            f"HTTPException during processing {file_key}: Status={http_exc.status_code}, Detail={http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.exception(
            f"Unexpected error during parsing logic for file {file_key}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during the parsing process."
        )


@app.get("/health",
         summary="Health Check",
         description="Simple health check endpoint to verify the service is running.")
def health_check():
    """Returns a simple status indicating the service is operational."""
    return {"status": "ok", "message": "Service is running"}
