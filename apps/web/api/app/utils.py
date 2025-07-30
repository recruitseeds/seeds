# utils.py
import io
import logging  # Add logging import

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status

from .config import settings

logger = logging.getLogger(__name__)  # Add logger instance


def get_s3_client():
    # CRITICAL LOG 8
    logger.info("--- UTILS: ENTERED get_s3_client ---")
    try:
        endpoint_url = settings.r2_endpoint_url or f"https://{settings.cloudflare_account_id}.r2.cloudflarestorage.com"
        logger.info(f"--- UTILS: R2 endpoint URL: {endpoint_url} ---")

        s3 = boto3.client(
            service_name='s3',
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name='auto',
        )
        logger.info(
            "--- UTILS: boto3.client created. Attempting s3.list_buckets() as a health check... ---")
        s3.list_buckets()  # This is a test call. Can be slow or fail.
        logger.info("--- UTILS: s3.list_buckets() successful. ---")
        logger.info("--- UTILS: EXITING get_s3_client NORMALLY ---")
        return s3
    except ClientError as e:
        logger.error(
            f"--- UTILS: ClientError in get_s3_client: {e} ---", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not connect to R2 storage. Check credentials/configuration."
        )
    except Exception as e:
        logger.error(
            f"--- UTILS: Unexpected error in get_s3_client: {e} ---", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error connecting to R2 storage."
        )


def download_file_from_r2(file_key: str) -> bytes:
    # CRITICAL LOG 9
    logger.info(
        f"--- UTILS: ENTERED download_file_from_r2 for key: {file_key} ---")
    s3 = get_s3_client()
    logger.info(
        f"--- UTILS: S3 client obtained for R2 download (key: {file_key}). ---")
    try:
        logger.info(
            f"--- UTILS: Attempting s3.get_object for Bucket: {settings.r2_bucket_name}, Key: {file_key} ---")
        response = s3.get_object(Bucket=settings.r2_bucket_name, Key=file_key)
        logger.info(
            f"--- UTILS: s3.get_object call successful for {file_key}. Reading body... ---")
        file_content = response['Body'].read()
        logger.info(
            f"--- UTILS: EXITING download_file_from_r2 NORMALLY with {len(file_content)} bytes for {file_key} ---")
        return file_content
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            logger.error(
                f"--- UTILS: NoSuchKey error for {file_key} in R2. ---", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found in R2 bucket: {file_key}"
            )
        else:
            logger.error(
                f"--- UTILS: ClientError downloading {file_key} from R2: {e} ---", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not download file from R2: {e}"
            )
    except Exception as e:
        logger.error(
            f"--- UTILS: Unexpected error downloading {file_key}: {e} ---", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error during file download."
        )
