from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class ParseRequest(BaseModel):
    """Input model expecting the key/path of the file in R2."""
    file_key: str = Field(
        ...,
        description="The object key (path) of the resume file in the R2 bucket.",
        examples=["resumes/user123/my_resume_final.pdf"]
    )


class EducationEntry(BaseModel):
    degree: Optional[str] = None
    school: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    summary: Optional[str] = None


class ExperienceEntry(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None


class ResumeData(BaseModel):
    """Structured data extracted from the resume."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    other_links: List[str] = []
    skills: List[str] = []
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []

    class Config:
        json_schema_extra = {
            "example": {
                "first_name": "Jane",
                "last_name": "Doe",
                "full_name": "Jane Doe",
                "email": "jane.doe@email.com",
                "phone_number": "123-456-7890",
                "location": "San Francisco, CA",
                "summary": "Experienced software engineer...",
                "linkedin_url": "https://linkedin.com/in/janedoe",
                "github_url": "https://github.com/janedoe",
                "skills": ["Python", "FastAPI", "React", "AWS"],
                "education": [
                    {
                        "degree": "B.S. Computer Science",
                        "school": "State University",
                        "start_date": "2016",
                        "end_date": "2020",
                        "summary": "Relevant coursework..."
                    }
                ],
                "experience": [
                    {
                        "job_title": "Software Engineer",
                        "company": "Tech Corp",
                        "start_date": "Jan 2021",
                        "end_date": "Present",
                        "location": "Remote",
                        "description": "Developed APIs..."
                    }
                ]
            }
        }
