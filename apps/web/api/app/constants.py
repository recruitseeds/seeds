import re

# --- Basic Patterns ---
NOT_ALPHA_NUMERIC_REGEX = r"[^a-zA-Z\d]"
NUMBER_REGEX = r"\d+"

# --- Contact Info ---
EMAIL_REGEX = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
PHONE_REGEX = r"\(?\b\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"

# --- URLs ---
URL_REGEX = r"(?:https?://|www\.)[^\s<>\"']+"
LINKEDIN_REGEX = r"(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub|company)/[\w\-\_]+/??"
GITHUB_REGEX = r"(?:https?://)?(?:www\.)?github\.com/[\w\-\_]+/??"
TWITTER_REGEX = r"(?:https?://)?(?:www\.)?(?:twitter|x)\.com/[\w]+/??"
PORTFOLIO_KEYWORDS = [
    "portfolio", "about", "me", "dev", "design", "blog", "projects", "github.io",
    "behance", "dribbble", "personal website"
]

# --- Dates ---
# Defines a single date component (Month YYYY, MM/YYYY, YYYY)
SINGLE_DATE_REGEX_STR = r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}/\d{4}|\b\d{4}\b"
# Defines "Present" or "Current"
PRESENT_REGEX_STR = r"\bPresent\b|\bCurrent\b"
# Defines separators allowed between dates in a range
# Explicit separators or whitespace
DATE_SEPARATOR_REGEX_STR = r"\s*(?:-|–|—|to)\s*|\s+"

# Regex for a date range (e.g., "Jan 2020 - Present", "2018 - 2022", "Oct 2021 to Dec 2023")
# Group 1: Start Date (Optional)
# Group 2: End Date (Required)
DATE_RANGE_REGEX = re.compile(
    r"(" + SINGLE_DATE_REGEX_STR + r")?" +  # Optional Start Date (Group 1)
    r"(?:" + DATE_SEPARATOR_REGEX_STR + r")" +  # Separator (Non-capturing)
    # End Date (Group 2)
    r"(" + SINGLE_DATE_REGEX_STR + r"|" + PRESENT_REGEX_STR + r")" +
    r"(?!\d)",  # Negative lookahead to prevent matching year in e.g. 20202
    re.IGNORECASE
)

# Regex for a single date or "Present" (often an end date when no range is given)
# Group 1: The Date or Present string
SINGLE_DATE_PRESENT_REGEX = re.compile(
    r"(" + SINGLE_DATE_REGEX_STR + r"|" + PRESENT_REGEX_STR + r")" +
    r"(?!\d)",
    re.IGNORECASE
)

# Regex string used specifically for cleaning leftover dates after primary extraction
SINGLE_DATE_REGEX_STR_FOR_CLEANUP = r"\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}/\d{4}|\b\d{4})\b"


# --- Location ---
# Defines location patterns like "City, ST", "City, State", "Remote"
LOCATION_ONLY_REGEX_STR = r"((?:[A-Za-z\s.-]+,\s*[A-Za-z.]{2,})|\bRemote\b)"
# Regex for location specifically at the end of a line
LOCATION_REGEX = re.compile(LOCATION_ONLY_REGEX_STR + r"\s*$", re.IGNORECASE)
# Regex for location anywhere in a string
LOCATION_GENERIC_REGEX = re.compile(LOCATION_ONLY_REGEX_STR, re.IGNORECASE)


# --- spaCy Matcher Patterns (Example) ---
NAME_PATTERNS = [
    [{"POS": "PROPN"}, {"POS": "PROPN"}],
    [{"POS": "PROPN"}, {"POS": "PROPN"}, {"POS": "PROPN"}],
    [{"POS": "PROPN"}, {"LOWER": "van"}, {"POS": "PROPN"}],
    [{"POS": "PROPN"}, {"LOWER": "de"}, {"POS": "PROPN"}],
]

# --- Section Headers ---
# Order matters for resolving ambiguity (more specific sections first if overlap)
SECTION_KEYWORDS_ORDERED = [
    ("SUMMARY", ["summary", "profile", "objective", "about me",
     "personal summary", "professional summary", "career summary"]),
    ("EXPERIENCE", ["experience", "professional experience",
     "work experience", "work history", "employment history"]),
    ("EDUCATION", ["education", "academic background",
     "academic qualifications", "scholastic record"]),
    ("SKILLS", ["skills", "technical skills", "competencies",
     "proficiencies", "technical expertise", "skills and passions"]),
    ("PROJECTS", ["projects", "personal projects",
     "portfolio", "selected projects"]),
    ("PUBLICATIONS", ["publications", "papers", "research"]),
    ("CERTIFICATIONS", ["certifications",
     "licenses & certifications", "courses", "training"]),
    ("AWARDS", ["awards", "honors", "recognitions",
     "achievements", "awards and honors"]),
    ("LEADERSHIP", ["leadership",
     "leadership experience", "leadership & activities"]),
    ("OTHERS", ["others", "additional information",
     "miscellaneous", "interests"]),
]


# --- Education Keywords ---
EDUCATION_DEGREE_KEYWORDS = [
    # Short Forms (handle carefully to avoid matching in school names)
    "be", "b.e.", "b.e", "bs", "b.s", "b.sc", "b.s.c", "ba", "b.a",
    "me", "m.e", "m.e.", "ms", "m.s", "m.sc", "m.s.c", "ma", "m.a",
    "btech", "mtech", "mba", "m.b.a", "phd", "ph.d",
    # Full Names
    "doctor of philosophy",
    "bachelor of science", "bachelor of arts", "bachelor of engineering", "bachelor of technology",
    "master of science", "master of arts", "master of business administration", "master of engineering",
    "associate of applied science", "associate degree", "diploma", "certificate",
    # Other Levels (Region specific, use with caution)
    "ssc", "hsc", "cbse", "icse", "x", "xii",
    "higher secondary", "senior secondary"
]
# Shorter list for disambiguation heuristics
EDUCATION_DEGREE_KEYWORDS_SHORT = [
    "ba", "bs", "be", "ma", "ms", "me", "btech", "mtech", "mba", "phd"]

SCHOOL_TYPE_KEYWORDS = [
    "university", "college", "institute", "academy", "school", "polytechnic", "campus"
]

# --- Experience Keywords ---
JOB_TITLE_KEYWORDS = [
    "engineer", "developer", "manager", "analyst", "specialist", "lead", "architect",
    "consultant", "coordinator", "officer", "executive", "associate", "intern", "co-op",
    "president", "director", "scientist", "designer", "administrator", "recruiter",
    "assistant", "fellow", "monitor", "advisor", "principal", "head", "supervisor",
    "technical project officer", "technical project monitor"  # Example specific titles
]

COMPANY_SUFFIXES = [
    "inc", "inc.", "incorporated", "ltd", "ltd.", "limited", "llc", "llc.", "corp", "corp.", "corporation",
    "co.", "company", "group", "plc", "gmbh", "s.a.", "s.a.s", "llp", "associates", "solutions",
    "services", "technologies", "labs", "systems", "enterprises", "industries"
]

# --- Skills ---
# Example list, can be expanded significantly
PREDEFINED_SKILLS_LIST = [
    # Programming & Tech
    "python", "java", "c++", "c#", "javascript", "typescript", "sql", "nosql", "mongodb", "postgresql",
    "react", "angular", "vue", "vue.js", "node.js", "express.js", "django", "flask", "spring boot", "ruby on rails",
    "html", "css", "sass", "less", "php", "swift", "kotlin", "objective-c", "go", "rust", "scala",
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform", "ansible", "jenkins",
    "git", "svn", "linux", "unix", "windows server", "macos",
    # Data Science & ML
    "machine learning", "deep learning", "data analysis", "data science", "artificial intelligence", "ai",
    "nlp", "natural language processing", "computer vision", "statistics", "r", "pandas", "numpy", "scipy",
    "scikit-learn", "tensorflow", "pytorch", "keras", "spark", "hadoop", "tableau", "power bi", "qlik",
    # Business & Management
    "project management", "product management", "agile", "scrum", "jira", "confluence",
    "business analysis", "market research", "financial modeling", "risk management", "strategic planning",
    # Soft Skills (Harder to parse reliably, often inferred)
    "communication", "teamwork", "leadership", "problem solving", "critical thinking", "creativity",
    # Certifications & Specific Tools
    "microsoft office", "microsoft excel", "excel", "microsoft powerpoint", "powerpoint", "microsoft word", "word",
    "google suite", "salesforce", "sap", "oracle",
    "leed ap", "leed", "cem", "pmp", "cfa", "cpa", "six sigma"
]

# --- Formatting ---
BULLET_POINTS = ["•", "*", "-", "◦", "▪"]  # Common bullet point characters
