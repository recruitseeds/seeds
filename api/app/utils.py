import io

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status

from .config import settings


def get_s3_client():
    try:
        endpoint_url = settings.r2_endpoint_url or f"https://{settings.cloudflare_account_id}.r2.cloudflarestorage.com"

        s3 = boto3.client(
            service_name='s3',
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name='auto',
        )
        s3.list_buckets()
        return s3
    except ClientError as e:
        print(f"Error initializing S3 client: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not connect to R2 storage. Check credentials/configuration."
        )
    except Exception as e:
        print(f"Unexpected error initializing S3 client: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error connecting to R2 storage."
        )


def download_file_from_r2(file_key: str) -> bytes:
    s3 = get_s3_client()
    try:
        response = s3.get_object(Bucket=settings.r2_bucket_name, Key=file_key)
        file_content = response['Body'].read()
        return file_content
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found in R2 bucket: {file_key}"
            )
        else:
            print(f"Error downloading file from R2: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not download file from R2: {e}"
            )
    except Exception as e:
        print(f"Unexpected error downloading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error during file download."
        )
