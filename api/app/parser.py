import logging
import re

import spacy

from .models import EducationEntry, ExperienceEntry, ResumeData

logger = logging.getLogger(__name__)

NLP_MODEL_NAME = "en_core_web_md"
nlp = None
try:
    nlp = spacy.load(NLP_MODEL_NAME)
    logger.info(f"spaCy model '{NLP_MODEL_NAME}' loaded successfully.")
except OSError:
    logger.error(
        f"spaCy model '{NLP_MODEL_NAME}' not found. "
        f"Please run 'python -m spacy download {NLP_MODEL_NAME}'"
    )
except Exception as e:
    logger.error(
        f"Error loading spaCy model '{NLP_MODEL_NAME}': {e}", exc_info=True)


EMAIL_REGEX = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
PHONE_REGEX = r'\(?\b\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
URL_REGEX = r'(?:https?://|www\.)[^\s<>"]+'
LINKEDIN_REGEX = r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|pub|company)/[\w\-\_]+/?'
GITHUB_REGEX = r'(?:https?://)?(?:www\.)?github\.com/[\w\-\_]+/?'
TWITTER_REGEX = r'(?:https?://)?(?:www\.)?(?:twitter|x)\.com/[\w]+/?'
PORTFOLIO_KEYWORDS = ["portfolio", "about", "me",
                      "dev", "design", "blog", "projects", "github.io"]


def find_links_in_text(text: str) -> dict:
    """Finds various types of links using regex within plain text."""
    if not text:
        return {"linkedin": None, "github": None, "twitter": None, "portfolio": None, "other": []}

    urls = re.findall(URL_REGEX, text, re.IGNORECASE)
    logger.debug(f"Regex found {len(urls)} potential URLs in text: {urls}")
    links = {
        "linkedin": None, "github": None, "twitter": None,
        "portfolio": None, "other": []
    }
    linkedin_found, github_found, twitter_found = False, False, False
    temp_other = []

    for url in urls:
        url = url.strip().rstrip('/')
        if not url:
            continue

        if not linkedin_found and re.match(LINKEDIN_REGEX, url, re.IGNORECASE):
            links["linkedin"] = url
            linkedin_found = True
            logger.debug(f"Classified regex URL as LinkedIn: {url}")
        elif not github_found and re.match(GITHUB_REGEX, url, re.IGNORECASE):
            links["github"] = url
            github_found = True
            logger.debug(f"Classified regex URL as GitHub: {url}")
        elif not twitter_found and re.match(TWITTER_REGEX, url, re.IGNORECASE):
            links["twitter"] = url
            twitter_found = True
            logger.debug(f"Classified regex URL as Twitter/X: {url}")
        else:
            temp_other.append(url)

    for url in temp_other:
        if (not links["portfolio"] and
            any(term in url.lower() for term in PORTFOLIO_KEYWORDS) and
                url != links["linkedin"] and url != links["github"] and url != links["twitter"]):
            links["portfolio"] = url
            logger.debug(
                f"Classified regex URL as Portfolio (heuristic): {url}")
        else:
            if url != links["linkedin"] and url != links["github"] and url != links["twitter"]:
                links["other"].append(url)

    links["other"] = sorted(list(set(links["other"])))
    logger.debug(f"Regex link classification result: {links}")
    return links


def parse_resume_text(text: str, annotation_links: list[str]) -> ResumeData:
    """
    Parses the extracted text and uses annotation links to populate ResumeData.
    Uses a hybrid approach: Regex, direct links, spaCy NER.
    """
    if not text and not annotation_links:
        logger.warning(
            "Parsing skipped: No text or annotation links provided.")
        return ResumeData()

    logger.info("Starting resume text parsing...")
    data = ResumeData()

    if text:
        email_match = re.search(EMAIL_REGEX, text, re.IGNORECASE)
        if email_match:
            data.email = email_match.group(
                0).lower()
            logger.debug(f"Found email via regex: {data.email}")

        phone_match = re.search(PHONE_REGEX, text)
        if phone_match:
            cleaned_phone = re.sub(r'[()\s.-]', '', phone_match.group(0))
            data.phone_number = cleaned_phone
            logger.debug(f"Found phone via regex: {data.phone_number}")

        regex_found_links = find_links_in_text(text)
    else:
        regex_found_links = {"linkedin": None, "github": None,
                             "twitter": None, "portfolio": None, "other": []}

    all_uris = set(link.strip().rstrip('/')
                   for link in annotation_links if link and link.strip())
    logger.debug(f"Links found via PDF annotations: {all_uris}")

    if regex_found_links["linkedin"]:
        all_uris.add(regex_found_links["linkedin"])
    if regex_found_links["github"]:
        all_uris.add(regex_found_links["github"])
    if regex_found_links["twitter"]:
        all_uris.add(regex_found_links["twitter"])
    if regex_found_links["portfolio"]:
        all_uris.add(regex_found_links["portfolio"])
    all_uris.update(link.strip().rstrip('/')
                    for link in regex_found_links["other"] if link and link.strip())

    logger.info(
        f"Total unique URIs found (annotations + regex): {len(all_uris)}")
    logger.debug(f"Combined unique URIs: {all_uris}")

    final_links = {
        "linkedin": None, "github": None, "twitter": None,
        "portfolio": None, "other": []
    }
    linkedin_found, github_found, twitter_found, portfolio_found = False, False, False, False
    temp_other_combined = []

    for uri in sorted(list(all_uris)):
        if not uri:
            continue

        if not linkedin_found and re.match(LINKEDIN_REGEX, uri, re.IGNORECASE):
            final_links["linkedin"] = uri
            linkedin_found = True
            logger.debug(f"Classified combined URI as LinkedIn: {uri}")
        elif not github_found and re.match(GITHUB_REGEX, uri, re.IGNORECASE):
            final_links["github"] = uri
            github_found = True
            logger.debug(f"Classified combined URI as GitHub: {uri}")
        elif not twitter_found and re.match(TWITTER_REGEX, uri, re.IGNORECASE):
            final_links["twitter"] = uri
            twitter_found = True
            logger.debug(f"Classified combined URI as Twitter/X: {uri}")
        else:
            temp_other_combined.append(uri)

    for uri in temp_other_combined:
        if (not portfolio_found and
            any(term in uri.lower() for term in PORTFOLIO_KEYWORDS) and
                uri != final_links["linkedin"] and uri != final_links["github"] and uri != final_links["twitter"]):
            final_links["portfolio"] = uri
            portfolio_found = True
            logger.debug(
                f"Classified combined URI as Portfolio (heuristic): {uri}")
        else:
            if uri != final_links["linkedin"] and uri != final_links["github"] and uri != final_links["twitter"]:
                final_links["other"].append(uri)

    data.linkedin_url = final_links["linkedin"]
    data.github_url = final_links["github"]
    data.twitter_url = final_links["twitter"]
    data.portfolio_url = final_links["portfolio"]
    primary_links_set = {data.linkedin_url,
                         data.github_url, data.twitter_url, data.portfolio_url}
    data.other_links = sorted(list(set(
        link for link in final_links["other"] if link not in primary_links_set and link)))

    logger.debug(
        f"Final classified links assigned: LinkedIn={data.linkedin_url}, GitHub={data.github_url}, Twitter={data.twitter_url}, Portfolio={data.portfolio_url}, Other={data.other_links}")

    if text and nlp:
        logger.info("Running spaCy NER on extracted text...")
        try:
            doc = nlp(text)

            persons = [ent.text.strip()
                       for ent in doc.ents if ent.label_ == "PERSON"]
            locations = [ent.text.strip()
                         for ent in doc.ents if ent.label_ == "GPE"]
            orgs = [ent.text.strip()
                    for ent in doc.ents if ent.label_ == "ORG"]
            dates = [ent.text.strip()
                     for ent in doc.ents if ent.label_ == "DATE"]

            logger.debug(
                f"NER found: {len(persons)} PERSON, {len(locations)} GPE, {len(orgs)} ORG, {len(dates)} DATE entities.")

            if persons:
                for potential_name in persons:
                    if len(potential_name.split()) >= 2 and potential_name.split()[0][0].isupper():
                        if len(potential_name) < 50 and not re.search(r'\d|@', potential_name):
                            data.full_name = potential_name
                            name_parts = potential_name.split(" ", 1)
                            data.first_name = name_parts[0]
                            if len(name_parts) > 1:
                                data.last_name = name_parts[1]
                            logger.debug(
                                f"Assigned name via NER: {data.full_name}")
                            break
                if not data.full_name:
                    logger.debug(
                        "Could not confidently assign name from PERSON entities.")

            if locations:
                data.location = locations[0]
                logger.debug(f"Assigned location via NER: {data.location}")

        except Exception as e:
            logger.error(
                f"Error during spaCy NER processing: {e}", exc_info=True)

    elif not text:
        logger.warning("Skipping spaCy NER: No text was extracted.")
    elif not nlp:
        logger.warning("Skipping spaCy NER: Model not loaded.")

    logger.info("Finished resume text parsing.")
    return data
