import logging
import re
from typing import Any, Dict, List, Optional, Tuple

import spacy
from spacy.matcher import Matcher

from . import constants as rc
from .models import EducationEntry, ExperienceEntry, ResumeData

logger = logging.getLogger(__name__)

NLP_MODEL_NAME = "en_core_web_md"
nlp = None
matcher = None

try:
    nlp = spacy.load(NLP_MODEL_NAME)
    matcher = Matcher(nlp.vocab)
    logger.info(f"spaCy model '{NLP_MODEL_NAME}' loaded successfully.")
except OSError:
    logger.warning(
        f"spaCy model '{NLP_MODEL_NAME}' not found. NER and Matcher-based enhancements will be limited. "
        f"To enable, run 'python -m spacy download {NLP_MODEL_NAME}'"
    )
    nlp = None
    matcher = None
except Exception as e:
    logger.error(
        f"Error loading spaCy model '{NLP_MODEL_NAME}': {e}", exc_info=True
    )
    nlp = None
    matcher = None

if matcher:
    pass


def _clean_text(text: str) -> str:
    if not text:
        return ""
    text = text.replace('\xa0', ' ')
    text = text.replace('\r\n', '\n')
    text = text.replace('\r', '\n')
    cleaned_chars = []
    for char_val in text:
        char_ord = ord(char_val)
        if 32 <= char_ord <= 126 or char_ord == 9 or char_ord == 10:
            cleaned_chars.append(char_val)
    text = "".join(cleaned_chars)
    lines_processed = []
    for line in text.splitlines():
        line = re.sub(r"[ \t]+", " ", line.strip())
        lines_processed.append(line)
    final_text = "\n".join(l for l in lines_processed if l)
    return final_text.strip()


def _extract_and_remove_date_from_string(text: str) -> Tuple[Optional[str], Optional[str], str]:
    start_date, end_date = None, None
    original_text_for_log = text[:100]
    processed_text = text

    best_range_match = None
    # Find the last match as it's often at the end of headers
    for m in rc.DATE_RANGE_REGEX.finditer(processed_text):
        best_range_match = m

    if best_range_match:
        # Group 1 is start date (optional), Group 2 is end date (required)
        s_date_cand = best_range_match.group(1)
        e_date_cand = best_range_match.group(2)  # Now group 2

        if s_date_cand and e_date_cand:
            start_date = _clean_text(s_date_cand)
            end_date = _clean_text(e_date_cand)
        elif e_date_cand:  # Only end date matched (group 1 was None)
            end_date = _clean_text(e_date_cand)
            # Check if the text *before* the match looks like a start date that wasn't captured
            text_before = processed_text[:best_range_match.start()].strip()
            potential_start_match = rc.SINGLE_DATE_PRESENT_REGEX.match(
                text_before)  # Match from start of the 'before' string
            if potential_start_match:
                # This is weak evidence, only use if it's plausible
                start_date_cand_before = potential_start_match.group(1)
                if start_date_cand_before.lower() != "present":  # Cannot be present
                    # Check if it's reasonably close to the end date match
                    # Heuristic: close to separator
                    if len(text_before) - potential_start_match.end() < 10:
                        start_date = _clean_text(start_date_cand_before)
                        # Remove this part too
                        processed_text = processed_text[:potential_start_match.start(
                        )] + " " + processed_text[best_range_match.end():]
                    else:  # Not close enough, just remove the end date match
                        processed_text = processed_text[:best_range_match.start(
                        )] + " " + processed_text[best_range_match.end():]
                else:  # Just remove the end date match
                    processed_text = processed_text[:best_range_match.start(
                    )] + " " + processed_text[best_range_match.end():]

            else:  # No plausible start date found before, just remove the end date match
                processed_text = processed_text[:best_range_match.start(
                )] + " " + processed_text[best_range_match.end():]
        else:  # Should not happen if regex matched, but as fallback remove the whole match
            processed_text = processed_text[:best_range_match.start(
            )] + " " + processed_text[best_range_match.end():]

        processed_text = re.sub(r"\s{2,}", " ", processed_text).strip(" ,-")
        logger.debug(
            f"--- _extract_and_remove_date: Range extracted S='{start_date}', E='{end_date}'. Remaining: '{processed_text}' from '{original_text_for_log}'")
        return start_date, end_date, processed_text

    # If no range, try single date (likely end date)
    best_single_match = None
    for m in rc.SINGLE_DATE_PRESENT_REGEX.finditer(processed_text):
        best_single_match = m

    if best_single_match:
        end_date = _clean_text(best_single_match.group(1))
        processed_text = processed_text[:best_single_match.start(
        )] + " " + processed_text[best_single_match.end():]
        processed_text = re.sub(r"\s{2,}", " ", processed_text).strip(" ,-")
        logger.debug(
            f"--- _extract_and_remove_date: Single extracted E='{end_date}'. Remaining: '{processed_text}' from '{original_text_for_log}'")
        return start_date, end_date, processed_text

    logger.debug(
        f"--- _extract_and_remove_date: No date extracted from '{original_text_for_log}'.")
    return start_date, end_date, processed_text


def _parse_name_from_text(doc: Optional[spacy.tokens.Doc], lines: List[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    full_name, first_name, last_name = None, None, None

    if matcher and doc:
        matches = matcher(doc)
        for match_id, start, end in matches:
            rule_id = nlp.vocab.strings[match_id]
            if rule_id == 'NAME':
                potential_name = doc[start:end].text.strip()
                if 2 <= len(potential_name.split()) <= 4 and len(potential_name) < 50:
                    full_name = potential_name
                    logger.debug(
                        f"--- PARSER (Name): Assigned name via spaCy Matcher: {full_name} ---")
                    break

    if not full_name and doc:
        persons = [ent.text.strip()
                   for ent in doc.ents if ent.label_ == "PERSON"]
        for potential_name in persons:
            is_header_keyword_present_in_name = False
            for _, aliases_list in rc.SECTION_KEYWORDS_ORDERED:
                for alias_keyword in aliases_list:
                    if alias_keyword.lower() in potential_name.lower():
                        is_header_keyword_present_in_name = True
                        break
                if is_header_keyword_present_in_name:
                    break

            if 2 <= len(potential_name.split()) <= 4 and \
               all(p[0].isupper() for p in potential_name.split() if p and p[0]) and \
               len(potential_name) < 50 and \
               not re.search(r"\d|@|://|\.com|\.org|\.edu", potential_name, re.IGNORECASE) and \
               not is_header_keyword_present_in_name:
                full_name = potential_name
                logger.debug(
                    f"--- PARSER (Name): Assigned name via spaCy NER: {full_name} ---")
                break

    if not full_name and lines:
        first_line_content = lines[0]
        logger.debug(
            f"--- PARSER (Name): Attempting first line segment heuristic on: '{first_line_content}'")

        potential_name_segment = first_line_content
        delimiters = [
            ", LEED AP", ", LEED", ", CEM", ", PMP", ", MBA", ", PhD",
            " | ", " • ", " - ",
            "Mobile:", "Email:", "Phone:", "LinkedIn:", "Github:",
            "www.linkedin.com", "github.com"
        ]
        end_of_name_idx = len(potential_name_segment)

        for delim in delimiters:
            try:
                idx = potential_name_segment.lower().find(delim.lower())
                if idx != -1 and idx < end_of_name_idx:
                    end_of_name_idx = idx
            except ValueError:
                continue

        potential_name_segment = potential_name_segment[:end_of_name_idx].strip(
            " ,-")
        logger.debug(
            f"--- PARSER (Name): Segment after delimiter split: '{potential_name_segment}'")

        if potential_name_segment:
            logger.debug(
                f"--- PARSER (Name): Validating segment: '{potential_name_segment}'")
            name_words = potential_name_segment.split()
            is_valid_structure = False
            if 2 <= len(name_words) <= 4:
                is_valid_structure = all(p[0].isupper()
                                         for p in name_words if p and p[0])
                if all(p.isupper() for p in name_words if len(p) > 1) and len(name_words) > 1:
                    is_valid_structure = False

            if is_valid_structure and \
               not re.search(r"\d|://|\.com|\.org|\.edu|@", potential_name_segment, re.IGNORECASE) and \
               len(potential_name_segment) < 50 and len(potential_name_segment) > 3:
                is_segment_section_header = False
                segment_lower_for_header_check = potential_name_segment.lower()
                for _, aliases_list_check in rc.SECTION_KEYWORDS_ORDERED:
                    for alias_keyword_check in aliases_list_check:
                        if segment_lower_for_header_check == alias_keyword_check.lower():
                            is_segment_section_header = True
                            break
                    if is_segment_section_header:
                        break
                if not is_segment_section_header:
                    full_name = potential_name_segment
                    logger.debug(
                        f"--- PARSER (Name): Assigned name from first line segment heuristic: {full_name} ---")
                else:
                    logger.debug(
                        f"--- PARSER (Name): Segment '{potential_name_segment}' was a section header, not assigned as name.")
            else:
                logger.debug(
                    f"--- PARSER (Name): Segment '{potential_name_segment}' failed validation (structure, content, or length).")
        else:
            logger.debug(
                f"--- PARSER (Name): Potential name segment became empty after processing delimiters.")

    if not full_name and lines:
        first_line_candidate = lines[0]
        logger.debug(
            f"--- PARSER (Name): Fallback first_line_candidate: '{first_line_candidate}'")
        is_first_line_section_header = False
        for _, aliases_list in rc.SECTION_KEYWORDS_ORDERED:
            for alias_keyword in aliases_list:
                if first_line_candidate.lower().startswith(alias_keyword.lower()):
                    is_first_line_section_header = True
                    logger.debug(
                        f"--- PARSER (Name): Fallback candidate IS a section header ('{alias_keyword}').")
                    break
            if is_first_line_section_header:
                break
        is_contact_line = ("@" in first_line_candidate and "|" in first_line_candidate) or \
                          (re.search(rc.PHONE_REGEX, first_line_candidate) is not None) or \
                          (re.search(rc.EMAIL_REGEX, first_line_candidate) is not None)
        if is_contact_line:
            logger.debug(
                f"--- PARSER (Name): Fallback candidate IS a contact line.")
        if not is_first_line_section_header and not is_contact_line and \
           2 <= len(first_line_candidate.split()) <= 4 and \
           all(p[0].isupper() for p in first_line_candidate.split() if p and p[0]) and \
           not re.search(r"\d|@|/|\|", first_line_candidate) and \
           len(first_line_candidate) < 50:
            full_name = first_line_candidate
            logger.debug(
                f"--- PARSER (Name): Assigned name from fallback first line heuristic: {full_name} ---")
        else:
            logger.debug(
                f"--- PARSER (Name): Fallback first line heuristic did NOT assign name.")

    if full_name:
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        if len(name_parts) > 1:
            last_name = name_parts[1]
    else:
        logger.debug("--- PARSER (Name): NO name found by any method. ---")
    return full_name, first_name, last_name


def _parse_skills_section(
    lines: List[str],
    doc: Optional[spacy.tokens.Doc],
    full_text: str
) -> List[str]:
    if not lines:
        logger.warning(
            "--- SKILLS PARSER: Called with empty lines. This is likely an upstream issue if skills exist in the resume. ---")
        return []

    skills_text_block = "\n".join(lines)
    first_line_lower = lines[0].lower().strip(": ")
    skills_aliases = next(
        (als for key, als in rc.SECTION_KEYWORDS_ORDERED if key == "SKILLS"), [])
    if any(first_line_lower == alias.lower() for alias in skills_aliases):
        skills_text_block = "\n".join(lines[1:])
        logger.debug(
            f"--- SKILLS PARSER: Removed header '{lines[0]}' from skills block.")

    skills = set()

    for predefined_skill in rc.PREDEFINED_SKILLS_LIST:
        if re.search(r"\b" + re.escape(predefined_skill) + r"\b", skills_text_block, re.IGNORECASE):
            skills.add(predefined_skill)

    delimiters_and_bullets_regex = r"[\n,;]|\s*[•\*\-\◦\▪]\s+"
    potential_skills = re.split(
        delimiters_and_bullets_regex, skills_text_block)

    for skill_cand_outer in potential_skills:
        skill_cand_inner = skill_cand_outer.strip(" .,;")
        if not skill_cand_inner:
            continue

        is_section_header = False
        for _, aliases_list in rc.SECTION_KEYWORDS_ORDERED:
            if any(skill_cand_inner.lower() == alias.lower() for alias in aliases_list):
                is_section_header = True
                break
        if is_section_header:
            continue

        if 2 <= len(skill_cand_inner) <= 50 and \
           not skill_cand_inner.isdigit() and \
           re.search(r"[a-zA-Z]", skill_cand_inner) and \
           len(skill_cand_inner.split()) <= 5:
            skills.add(skill_cand_inner)

    if doc:
        # Process the skills_text_block with spaCy, not the whole resume doc
        skills_doc = nlp(skills_text_block) if nlp else None
        if skills_doc:
            for ent in skills_doc.ents:
                if ent.label_ in ["ORG", "PRODUCT", "TECH", "LANGUAGE", "NORP", "WORK_OF_ART"]:
                    skill_text = ent.text.strip(" .,;")
                    if 2 <= len(skill_text) <= 50 and \
                       not skill_text.isdigit() and \
                       re.search(r"[a-zA-Z]", skill_text) and \
                       len(skill_text.split()) <= 5 and \
                       not any(kw.lower() in skill_text.lower() for kw in ["university", "college", "inc.", "ltd."]):
                        skills.add(skill_text)

    intermediate_skills = [
        s for s in list(skills) if s and len(s) > 1 and not s.isdigit()]
    logger.debug(
        f"--- SKILLS PARSER: Skills after initial filtering: {intermediate_skills}")

    final_skills = sorted(list(set(s.strip()
                          for s in intermediate_skills if s.strip())))
    logger.debug(f"--- SKILLS PARSER: Returning final skills: {final_skills}")
    return final_skills


def _parse_single_education_entry(entry_lines: List[str]) -> Optional[EducationEntry]:
    if not entry_lines:
        return None

    full_entry_text = "\n".join(entry_lines)
    cleaned_full_entry_text = _clean_text(full_entry_text)
    logger.debug(
        f"--- EDU PARSER: Processing combined entry text: '{cleaned_full_entry_text[:150]}...'")

    degree, school, start_date, end_date, summary = None, None, None, None, None
    processed_text = cleaned_full_entry_text

    start_date, end_date, processed_text = _extract_and_remove_date_from_string(
        processed_text)

    remaining_lines = processed_text.splitlines()
    header_candidate_line = ""
    summary_lines = []

    if remaining_lines:
        header_candidate_line = remaining_lines[0].strip()
        summary_keywords_lower = ["relevant coursework", "thesis", "dissertation",
                                  "gpa", "dean's list", "honors", "minor", "concentration"]
        if any(header_candidate_line.lower().startswith(skw) for skw in summary_keywords_lower) and len(header_candidate_line.split()) < 5:
            summary_lines = remaining_lines
            header_candidate_line = ""
        else:
            summary_lines = remaining_lines[1:]

        summary_text = " ".join(l.strip() for l in summary_lines if l.strip())
        if summary_text:
            summary = summary_text

        logger.debug(
            f"--- EDU PARSER: Header candidate: '{header_candidate_line}'. Summary: '{str(summary)[:50]}...'")
    else:
        logger.debug("--- EDU PARSER: No text remaining after date removal.")
        if start_date or end_date:
            return EducationEntry(degree=None, school=None, start_date=start_date, end_date=end_date, summary=None)
        return None

    processed_line = header_candidate_line.strip(" ,-")
    if not processed_line:
        logger.debug(
            "--- EDU PARSER: Header candidate line is empty or was summary keyword.")
    else:
        logger.debug(
            f"--- EDU PARSER: Attempting school/degree parse on header candidate: '{processed_line}' ---")

        found_degree_str_full = None
        sorted_degree_keywords = sorted(
            rc.EDUCATION_DEGREE_KEYWORDS, key=len, reverse=True)

        for deg_key in sorted_degree_keywords:
            # Added optional comma before field of study
            degree_match_pattern = r"\b" + \
                re.escape(
                    deg_key) + r"\b(?:(?:,\s*)?(?:in|of|with a major in|with a concentration in|honors program in|honors)\s+[\w\s-]+)?(?:,\s*[\w\s.-]+)?"
            match = re.search(degree_match_pattern,
                              processed_line, re.IGNORECASE)
            if match:
                potential_degree_str = match.group(0).strip(" ,-")
                if "school of" in processed_line.lower() and deg_key.lower() in processed_line.lower().split("school of")[-1].lower().split():
                    if not any(short_deg_key in potential_degree_str.lower() for short_deg_key in rc.EDUCATION_DEGREE_KEYWORDS_SHORT):
                        continue

                found_degree_str_full = potential_degree_str
                degree = found_degree_str_full

                # Attempt to isolate school by removing the degree string
                # Try splitting by comma first if degree seems to be after a comma
                school_candidate = None
                parts_by_comma = processed_line.rsplit(',', 1)
                if len(parts_by_comma) == 2 and parts_by_comma[1].strip().lower().startswith(degree.lower()):
                    # Likely "School, Degree" format
                    school_candidate = parts_by_comma[0].strip(" ,-@ofin")
                else:
                    # Try removing degree string from start/end/middle
                    if processed_line.lower().startswith(degree.lower()):
                        school_candidate = processed_line[len(
                            degree):].strip(" ,-@ofin")
                    elif processed_line.lower().endswith(degree.lower()):
                        school_candidate = processed_line[:-
                                                          len(degree)].strip(" ,-@ofin")
                    else:  # Degree in the middle, take the part before it as potential school
                        parts_around_degree = re.split(
                            re.escape(degree), processed_line, maxsplit=1, flags=re.IGNORECASE)
                        if parts_around_degree[0].strip(" ,-@ofin"):
                            school_candidate = parts_around_degree[0].strip(
                                " ,-@ofin")

                if school_candidate and len(school_candidate) > 3:
                    school = school_candidate
                elif not school_candidate and processed_line.lower() != degree.lower():
                    # If removal failed but line isn't just the degree, maybe school was missed
                    # This is less reliable
                    pass

                logger.debug(
                    f"--- EDU PARSER: Degree keyword '{deg_key}' led to full degree '{degree}'. Tentative school: '{school}' ---")
                break

        if not degree and not school and processed_line:  # Fallback if no keyword match
            parts = re.split(r"\s+at\s+|\s+from\s+|\s*-\s*|\s*,\s*",
                             processed_line, 1, flags=re.IGNORECASE)
            if len(parts) == 1:
                if any(sch_kw.lower() in parts[0].lower() for sch_kw in rc.SCHOOL_TYPE_KEYWORDS) or (nlp and any(e.label_ == "ORG" for e in nlp(parts[0]).ents)):
                    school = parts[0].strip()
                else:
                    degree = parts[0].strip()
            elif len(parts) > 1:
                p0 = parts[0].strip(" ,-")
                p1 = parts[1].strip(" ,-")
                p0_is_school = any(skw.lower() in p0.lower() for skw in rc.SCHOOL_TYPE_KEYWORDS) or (
                    nlp and any(e.label_ == "ORG" for e in nlp(p0).ents))
                p1_is_school = any(skw.lower() in p1.lower() for skw in rc.SCHOOL_TYPE_KEYWORDS) or (
                    nlp and any(e.label_ == "ORG" for e in nlp(p1).ents))
                p0_is_degree = any(dkw.lower() in p0.lower()
                                   for dkw in rc.EDUCATION_DEGREE_KEYWORDS_SHORT)
                p1_is_degree = any(dkw.lower() in p1.lower()
                                   for dkw in rc.EDUCATION_DEGREE_KEYWORDS_SHORT)

                if p0_is_degree and p1_is_school:
                    degree, school = p0, p1
                elif p0_is_school and p1_is_degree:
                    school, degree = p0, p1
                elif p1_is_school:
                    degree, school = p0, p1
                elif p0_is_school:
                    school, degree = p0, p1
                else:
                    degree, school = p0, p1  # Default
            logger.debug(
                f"--- EDU PARSER: Fallback parse. Degree: '{degree}', School: '{school}' ---")

    degree = _clean_text(degree) if degree else None
    school = _clean_text(school) if school else None
    if degree and not re.search(r"[a-zA-Z0-9]", degree):
        degree = None
    if school and not re.search(r"[a-zA-Z0-9]", school):
        school = None

    honor_terms = ["summa cum laude", "magna cum laude",
                   "cum laude", "with honors", "honors program"]
    extracted_honor = None
    if school:
        for term in honor_terms:
            if term in school.lower():
                school = re.sub(r"(?:,\s*)?" + re.escape(term) + r"\b",
                                "", school, flags=re.IGNORECASE).strip(" ,-")
                extracted_honor = term.capitalize()
                if not school.strip():
                    school = None
                break
    if not extracted_honor and degree:
        for term in honor_terms:
            if term in degree.lower():
                degree = re.sub(r"(?:,\s*)?" + re.escape(term) + r"\b",
                                "", degree, flags=re.IGNORECASE).strip(" ,-")
                extracted_honor = term.capitalize()
                if not degree.strip():
                    degree = None
                break

    if extracted_honor:
        if summary:
            summary = extracted_honor + "; " + summary
        else:
            summary = extracted_honor

    logger.debug(
        f"--- EDU PARSER: FINAL: deg='{degree}', sch='{school}', start='{start_date}', end='{end_date}', sum='{summary is not None}' ---")

    if not (degree or school or start_date or end_date or summary):
        return None
    return EducationEntry(degree=degree, school=school, start_date=start_date, end_date=end_date, summary=summary)


def _parse_education_section(lines: List[str]) -> List[EducationEntry]:
    entries = []
    current_entry_lines: List[str] = []
    logger.debug(f"--- EDU SECTION: Parsing {len(lines)} lines for education.")
    for idx, line_content in enumerate(lines):
        line = _clean_text(line_content)
        if not line:
            continue

        is_bullet = any(line.startswith(b) for b in rc.BULLET_POINTS)
        contains_date = bool(rc.DATE_RANGE_REGEX.search(
            line) or rc.SINGLE_DATE_PRESENT_REGEX.search(line))
        line_lower = line.lower()
        contains_edu_keywords = any(re.search(
            r"\b" + kw.lower() + r"\b", line_lower) for kw in rc.EDUCATION_DEGREE_KEYWORDS)
        contains_school_keywords = any(re.search(
            r"\b" + kw.lower() + r"\b", line_lower) for kw in rc.SCHOOL_TYPE_KEYWORDS)

        is_new_entry_header = False
        if not is_bullet:
            line_words = line.split()
            is_short_line = len(line_words) < 9

            if contains_date and (contains_edu_keywords or contains_school_keywords or (is_short_line and line.istitle())):
                is_new_entry_header = True
            elif contains_edu_keywords and contains_school_keywords and is_short_line:
                is_new_entry_header = True
            elif not current_entry_lines and (contains_date or contains_edu_keywords or contains_school_keywords):
                is_new_entry_header = True
            elif is_short_line and (line.istitle() or (line_words and line_words[0][0].isupper())) and \
                    not any(line_lower.startswith(kw) for kw in ["major in", "minor in", "concentration:", "thesis:", "gpa:", "relevant coursework", "dean's list", "activities:", "grade:", "cgpa", "course highlights"]):
                if current_entry_lines:
                    prev_line_lower = current_entry_lines[-1].lower()
                    if not (rc.DATE_RANGE_REGEX.search(prev_line_lower) or rc.SINGLE_DATE_PRESENT_REGEX.search(prev_line_lower) or
                            any(re.search(r"\b" + kw.lower() + r"\b", prev_line_lower) for kw in rc.EDUCATION_DEGREE_KEYWORDS) or
                            any(re.search(r"\b" + kw.lower() + r"\b", prev_line_lower) for kw in rc.SCHOOL_TYPE_KEYWORDS) or
                            prev_line_lower.startswith("summary")):  # if prev line not header-like
                        is_new_entry_header = True
                elif not current_entry_lines:
                    is_new_entry_header = True

        logger.debug(
            f"--- EDU SECTION: Line {idx} ('{line[:50]}...'): is_bullet={is_bullet}, date={contains_date}, edu_kw={contains_edu_keywords}, school_kw={contains_school_keywords}, new_header={is_new_entry_header}")

        if is_new_entry_header and current_entry_lines:
            logger.debug(
                f"--- EDU SECTION: New header. Parsing previous entry: {current_entry_lines[0][:50]}...")
            entry = _parse_single_education_entry(current_entry_lines)
            if entry:
                entries.append(entry)
            current_entry_lines = [line_content]
        else:
            current_entry_lines.append(line_content)

    if current_entry_lines:
        logger.debug(
            f"--- EDU SECTION: Parsing final entry: {current_entry_lines[0][:50]}...")
        entry = _parse_single_education_entry(current_entry_lines)
        if entry:
            entries.append(entry)
    logger.debug(f"--- EDU SECTION: Found {len(entries)} education entries.")
    return entries


def _parse_single_experience_entry(entry_lines: List[str]) -> Optional[ExperienceEntry]:
    if not entry_lines:
        logger.debug("--- EXP PARSER: Called with empty entry_lines.")
        return None

    header_line_text = _clean_text(entry_lines[0])
    description_lines = [_clean_text(line)
                         for line in entry_lines[1:] if _clean_text(line)]
    description = " ".join(description_lines).strip() or None

    logger.debug(
        f"--- EXP PARSER: Processing header: '{header_line_text[:100]}...'. Desc lines: {len(description_lines)}")

    job_title, company, start_date, end_date, location = None, None, None, None, None
    processed_header = header_line_text

    start_date, end_date, processed_header = _extract_and_remove_date_from_string(
        processed_header)

    # Extract location after date removal
    loc_match = rc.LOCATION_GENERIC_REGEX.search(processed_header)
    if loc_match:
        match_start_idx = loc_match.start()
        # Check context: is it preceded by comma or at start/end?
        is_at_end = loc_match.end() == len(processed_header) or (loc_match.end() < len(
            processed_header) and not processed_header[loc_match.end()].isalnum())
        is_after_comma = match_start_idx > 0 and processed_header[match_start_idx-1] == ','

        if is_at_end or is_after_comma:
            location_text = _clean_text(loc_match.group(1).strip(" ,"))
            # Avoid taking location if it's just a state abbreviation likely part of company name (e.g., "Company TX")
            if not (len(location_text) == 2 and location_text.isupper() and match_start_idx > 0 and processed_header[match_start_idx-1].isalpha()):
                location = location_text
                # Remove location (and preceding comma if applicable)
                start_remove_idx = match_start_idx - 1 if is_after_comma else match_start_idx
                processed_header = processed_header[:start_remove_idx].strip(
                    " ,-") + " " + processed_header[loc_match.end():].strip(" ,-")
                processed_header = processed_header.strip(" ,-")
                logger.debug(
                    f"--- EXP PARSER: Location='{location}'. Header after loc: '{processed_header[:70]}...'")

    # Final cleanup of any remaining date fragments
    processed_header = re.sub(rc.SINGLE_DATE_REGEX_STR_FOR_CLEANUP,
                              " ", processed_header, flags=re.IGNORECASE).strip(" ,-")
    processed_header = re.sub(r"\s{2,}", " ", processed_header).strip(" ,-")

    processed_line_for_title_co = processed_header
    if not processed_line_for_title_co:
        logger.debug(
            "--- EXP PARSER: Header line empty after date/loc/extra_date_cleanup.")
    else:
        logger.debug(
            f"--- EXP PARSER: Attempting title/company parse on: '{processed_line_for_title_co}' ---")
        parts = []
        # Split logic (prioritize ' at ', ' - ', then comma, then hyphen)
        if re.search(r"\s+at\s+", processed_line_for_title_co, re.IGNORECASE):
            parts = re.split(
                r"\s+at\s+", processed_line_for_title_co, 1, flags=re.IGNORECASE)
        elif " - " in processed_line_for_title_co:
            parts = processed_line_for_title_co.split(" - ", 1)
        elif "," in processed_line_for_title_co:
            temp_parts = processed_line_for_title_co.rsplit(',', 1)
            part_after_comma = temp_parts[-1].strip()
            is_part_after_comma_company = any(suffix.lower() in part_after_comma.lower() for suffix in rc.COMPANY_SUFFIXES) or \
                (nlp and any(ent.label_ == "ORG" for ent in nlp(part_after_comma).ents if len(part_after_comma.split()) < 5)) or \
                any(sch_kw.lower() in part_after_comma.lower()
                    for sch_kw in rc.SCHOOL_TYPE_KEYWORDS)  # School can be company
            if len(temp_parts) == 2 and is_part_after_comma_company and temp_parts[0].strip():
                parts = [temp_parts[0].strip(), part_after_comma]
            else:
                parts = [processed_line_for_title_co]
        elif "-" in processed_line_for_title_co and not any(term.lower() in processed_line_for_title_co.lower() for term in ["co-op"]):
            parts = processed_line_for_title_co.split("-", 1)
        else:
            parts = [processed_line_for_title_co]

        # Assign Title/Company based on parts
        if len(parts) == 2:
            part0_raw, part1_raw = parts[0].strip(" ,-"), parts[1].strip(" ,-")
            if not part0_raw or not part1_raw:
                job_title = part0_raw or part1_raw
                company = None
            else:
                # Use improved logic from previous iteration to assign job_title and company
                p0_is_org = nlp and any(
                    ent.label_ == "ORG" for ent in nlp(part0_raw).ents)
                p1_is_org = nlp and any(
                    ent.label_ == "ORG" for ent in nlp(part1_raw).ents)
                p0_has_suffix = any(s.lower() in part0_raw.lower()
                                    for s in rc.COMPANY_SUFFIXES)
                p1_has_suffix = any(s.lower() in part1_raw.lower()
                                    for s in rc.COMPANY_SUFFIXES)
                p0_has_job_kw = sum(
                    1 for kw in rc.JOB_TITLE_KEYWORDS if kw.lower() in part0_raw.lower())
                p1_has_job_kw = sum(
                    1 for kw in rc.JOB_TITLE_KEYWORDS if kw.lower() in part1_raw.lower())
                p0_is_school = any(skw.lower() in part0_raw.lower()
                                   for skw in rc.SCHOOL_TYPE_KEYWORDS)
                p1_is_school = any(skw.lower() in part1_raw.lower()
                                   for skw in rc.SCHOOL_TYPE_KEYWORDS)

                job_title_cand, company_cand = part0_raw, part1_raw  # Default

                if (p1_is_org or p1_has_suffix or p1_is_school) and not (p0_is_org or p0_has_suffix or p0_is_school):
                    job_title_cand, company_cand = part0_raw, part1_raw
                elif (p0_is_org or p0_has_suffix or p0_is_school) and not (p1_is_org or p1_has_suffix or p1_is_school):
                    job_title_cand, company_cand = part1_raw, part0_raw
                elif p0_has_job_kw > p1_has_job_kw and not p0_has_suffix and not p0_is_school:
                    job_title_cand, company_cand = part0_raw, part1_raw
                elif p1_has_job_kw > p0_has_job_kw and not p1_has_suffix and not p1_is_school:
                    job_title_cand, company_cand = part1_raw, part0_raw
                elif len(part0_raw.split()) > len(part1_raw.split()) and (p1_is_org or p1_has_suffix or p1_is_school):
                    job_title_cand, company_cand = part0_raw, part1_raw
                elif len(part1_raw.split()) > len(part0_raw.split()) and (p0_is_org or p0_has_suffix or p0_is_school):
                    job_title_cand, company_cand = part1_raw, part0_raw

                job_title = job_title_cand
                company = company_cand
            logger.debug(
                f"--- EXP PARSER: Split into 2 parts. Assigned J='{job_title}', C='{company}'")

        elif len(parts) == 1 and parts[0]:
            segment = parts[0].strip(" ,-")
            logger.debug(
                f"--- EXP PARSER: Processing single segment for title/co: '{segment}'")
            # Use logic from previous iteration (NER -> Suffix -> Keyword check)
            if nlp:
                doc_segment = nlp(segment)
                org_ents = [
                    ent.text for ent in doc_segment.ents if ent.label_ == "ORG"]
                if org_ents:
                    potential_company_ner = max(org_ents, key=len)
                    if potential_company_ner.lower() in segment.lower() and len(potential_company_ner) > 2:
                        company = potential_company_ner.strip()
                        title_cand_str = re.sub(
                            r"\b" + re.escape(company) + r"\b", "", segment, flags=re.IGNORECASE).strip(" ,-@")
                        if title_cand_str and len(title_cand_str) > 2:
                            job_title = title_cand_str
                        else:
                            job_title = None
                        logger.debug(
                            f"--- EXP PARSER: Single segment, NER found ORG. J='{job_title}', C='{company}'")

            if not company:
                found_by_suffix = False
                for suffix in sorted(rc.COMPANY_SUFFIXES, key=len, reverse=True):
                    suffix_match = re.search(
                        r"([\w\s.,'&]+?)\s*\b" + re.escape(suffix) + r"\b", segment, re.IGNORECASE)
                    if suffix_match:
                        company_candidate_suffix = suffix_match.group(
                            0).strip()
                        title_candidate_suffix = segment.replace(
                            company_candidate_suffix, "").strip(" ,-@")
                        if title_candidate_suffix and len(title_candidate_suffix) > 2:
                            job_title = title_candidate_suffix
                            company = company_candidate_suffix
                            found_by_suffix = True
                            break
                        elif not title_candidate_suffix:
                            company = company_candidate_suffix
                            job_title = None
                            found_by_suffix = True
                            break
                if not found_by_suffix:
                    if any(kw.lower() in segment.lower() for kw in rc.JOB_TITLE_KEYWORDS):
                        job_title = segment
                    elif any(kw.lower() in segment.lower() for kw in rc.SCHOOL_TYPE_KEYWORDS):
                        company = segment
                    else:
                        job_title = segment  # Default to title
                    logger.debug(
                        f"--- EXP PARSER: Single segment, no company by NER/suffix. J='{job_title}', C='{company}'")

    job_title = _clean_text(job_title) if job_title else None
    company = _clean_text(company) if company else None
    if job_title and not re.search(r"[a-zA-Z0-9]", job_title):
        job_title = None
    if company and not re.search(r"[a-zA-Z0-9]", company):
        company = None

    logger.debug(
        f"--- EXP PARSER: FINAL: title='{job_title}', comp='{company}', start='{start_date}', end='{end_date}', loc='{location}', desc='{description is not None}' ---")

    if not (job_title or company or description or start_date or end_date or location):
        logger.debug(
            "--- EXP PARSER: Entry deemed not meaningful. Returning None.")
        return None

    return ExperienceEntry(
        job_title=job_title, company=company, start_date=start_date,
        end_date=end_date, location=location, description=description
    )


def _looks_like_exp_header(line_text: str, prev_lines_in_entry: List[str]):
    cleaned_line = _clean_text(line_text)
    line_lower = cleaned_line.lower()
    words = cleaned_line.split()

    if not words or any(cleaned_line.startswith(b) for b in rc.BULLET_POINTS):
        return False

    # Allow slightly longer lines if they contain strong signals like date + ORG/School/Job KW
    contains_date = bool(rc.DATE_RANGE_REGEX.search(
        cleaned_line) or rc.SINGLE_DATE_PRESENT_REGEX.search(cleaned_line))
    contains_job_keyword = any(re.search(
        r"\b" + kw.lower() + r"\b", line_lower) for kw in rc.JOB_TITLE_KEYWORDS)
    contains_company_suffix = any(re.search(
        r"\b" + suffix.lower() + r"\b", line_lower) for suffix in rc.COMPANY_SUFFIXES)
    contains_school_type_keyword = any(re.search(
        r"\b" + kw.lower() + r"\b", line_lower) for kw in rc.SCHOOL_TYPE_KEYWORDS)

    if len(words) > 15 and not (contains_date and (contains_job_keyword or contains_company_suffix or contains_school_type_keyword)):
        # logger.debug(f"--- looks_like_exp_header: FALSE (too long or no strong signal) for '{cleaned_line[:50]}...'")
        return False

    # Context check (same as before)
    if prev_lines_in_entry and len(prev_lines_in_entry) == 1:
        prev_line_cleaned = _clean_text(prev_lines_in_entry[0])
        if len(prev_line_cleaned.split()) <= 6 and prev_line_cleaned.istitle():
            if (nlp and any(ent.label_ == "ORG" for ent in nlp(prev_line_cleaned).ents)) or \
               any(suffix.lower() in prev_line_cleaned.lower() for suffix in rc.COMPANY_SUFFIXES) or \
               any(sch_kw.lower() in prev_line_cleaned.lower() for sch_kw in rc.SCHOOL_TYPE_KEYWORDS):
                if (contains_date and len(words) < 10) or \
                   (contains_job_keyword and len(words) < 10) or \
                   (len(words) < 7 and cleaned_line.istitle()):
                    logger.debug(
                        f"--- looks_like_exp_header: TRUE (Prev ORG + Current is Title-like) for '{cleaned_line[:50]}...'")
                    return True

    cap_words = sum(1 for word in words if word and word[0].isupper())
    is_plausible_title_case = cleaned_line.istitle() or \
        (words and len(words) < 12 and cap_words / len(words) >= 0.35 and cap_words > 0) or \
        (len(words) <= 7 and cap_words >= 1)

    has_org_ner = False
    if nlp:
        doc = nlp(cleaned_line)
        for ent in doc.ents:
            # Check for ORG or GPE (GeoPolitical Entity, sometimes catches company locations)
            if ent.label_ in ["ORG", "GPE"] and len(ent.text.split()) >= 1 and len(ent.text.split()) <= 7:
                if len(ent.text) > 3 or (len(words) <= 8 and ent.text.lower() in cleaned_line.lower()):
                    has_org_ner = True
                    break

    # Rule 1: Date + (Company indicator OR Job KW OR Plausible Title OR ORG/GPE NER OR School Type)
    if contains_date and (contains_company_suffix or contains_job_keyword or is_plausible_title_case or has_org_ner or contains_school_type_keyword):
        # Add check: avoid matching if it looks like an award line
        if not any(award_kw in line_lower for award_kw in ["award", "scholarship", "fellowship", "grant"]):
            logger.debug(
                f"--- looks_like_exp_header: TRUE (Date + Entity/Title) for '{cleaned_line[:50]}...'")
            return True

    # Rule 2: Shorter line, Plausible Title Case, AND (ORG/GPE NER OR Company Suffix OR School Type)
    if len(words) <= 9 and is_plausible_title_case and (has_org_ner or contains_company_suffix or contains_school_type_keyword):
        # Avoid matching if it looks like an award line
        if not any(award_kw in line_lower for award_kw in ["award", "scholarship", "fellowship", "grant"]):
            logger.debug(
                f"--- looks_like_exp_header: TRUE (Short Title Case ORG/Suffix/School) for '{cleaned_line[:50]}...'")
            return True

    # Rule 3: Job KW + (Company Suffix OR ORG/GPE NER OR School Type) - reasonable length
    if contains_job_keyword and (contains_company_suffix or has_org_ner or contains_school_type_keyword) and len(words) < 12:
        logger.debug(
            f"--- looks_like_exp_header: TRUE (Job KW + ORG/Suffix/School) for '{cleaned_line[:50]}...'")
        return True

    # Rule 4: Line is primarily an ORG/GPE (from NER) or a School Type, plausible title case, not too long
    if (has_org_ner or contains_school_type_keyword) and is_plausible_title_case and len(words) <= 9:
        if not (len(words) == 1 and cleaned_line.lower() in ["company", "organization", "department", "university", "college", "school"]):
            logger.debug(
                f"--- looks_like_exp_header: TRUE (Short ORG/School Name as Header) for '{cleaned_line[:50]}...'")
            return True

    logger.debug(
        f"--- looks_like_exp_header: FALSE for '{cleaned_line[:50]}...'")
    return False


def _parse_experience_section(lines: List[str]) -> List[ExperienceEntry]:
    entries_data = []
    current_entry_lines: List[str] = []
    logger.debug(
        f"--- EXP SECTION: Parsing {len(lines)} lines for experience.")

    if not lines:
        return []

    for idx, line_content in enumerate(lines):
        line = _clean_text(line_content)
        if not line:
            continue

        is_new_entry_header = False
        if _looks_like_exp_header(line, current_entry_lines):
            is_new_entry_header = True

        # Fallback for very first line if it looks like a company/org and no current entry started
        elif not current_entry_lines and len(line.split()) <= 6 and line.istitle() and \
            not any(line.lower().startswith(kw) for kw in ["responsibilities", "achievements", "summary", "key ", "role:"]) and \
            ((nlp and any(ent.label_ == "ORG" for ent in nlp(line).ents)) or
             any(suffix.lower() in line.lower() for suffix in rc.COMPANY_SUFFIXES) or
             any(sch_kw.lower() in line.lower() for sch_kw in rc.SCHOOL_TYPE_KEYWORDS)):
            is_new_entry_header = True

        if is_new_entry_header and current_entry_lines:
            logger.debug(
                f"--- EXP SECTION: New header on line {idx} ('{line[:50]}...'). Parsing previous entry: {current_entry_lines[0][:50]}...")
            entry = _parse_single_experience_entry(current_entry_lines)
            if entry:
                entries_data.append(entry)
            current_entry_lines = [line_content]
        else:
            current_entry_lines.append(line_content)

    if current_entry_lines:
        logger.debug(
            f"--- EXP SECTION: Parsing final entry: {current_entry_lines[0][:50]}...")
        entry = _parse_single_experience_entry(current_entry_lines)
        if entry:
            entries_data.append(entry)

    logger.debug(
        f"--- EXP SECTION: Found {len(entries_data)} experience entries.")
    return entries_data


def parse_resume_text(text: str, annotation_links: List[str]) -> ResumeData:
    logger.info("--- PARSER: ENTERED parse_resume_text ---")
    data = ResumeData()

    logger.debug(
        f"--- PARSER: Raw text from extractor (first 500 chars): '{text[:500]}'")
    cleaned_text_block = _clean_text(text)
    # logger.debug(f"--- PARSER: FULL Cleaned text block: '{cleaned_text_block}'")

    lines = [line.strip()
             for line in cleaned_text_block.splitlines() if line.strip()]

    if not lines:
        logger.warning(
            "--- PARSER: No content lines after stripping. Returning early. ---")
        return data

    logger.debug(
        f"--- PARSER: Initial lines after splitlines and strip (up to 10): {lines[:10]} ---")

    doc = nlp(cleaned_text_block) if nlp else None

    data.full_name, data.first_name, data.last_name = _parse_name_from_text(
        doc, lines)
    logger.debug(
        f"--- PARSER: Name parsed as: full='{data.full_name}', first='{data.first_name}', last='{data.last_name}' ---")

    email_match = re.search(rc.EMAIL_REGEX, cleaned_text_block, re.IGNORECASE)
    if email_match:
        data.email = email_match.group(0).lower()
    phone_match = re.search(rc.PHONE_REGEX, cleaned_text_block)
    if phone_match:
        data.phone_number = re.sub(r"[()\s.-]", "", phone_match.group(0))

    # Location parsing - Refined Regex Fallback
    if not data.location:
        early_lines_for_loc = "\n".join(lines[:3])
        # Pattern: City, ST or City, State (allow periods in city name)
        location_pattern = re.compile(
            r"\b([A-Za-z\s.-]+,\s*(?:[A-Z]{2}|[A-Za-z]+(?: [A-Za-z]+)?))\b")

        regex_locations = []
        for loc_match in location_pattern.finditer(early_lines_for_loc):
            loc_cand_str = _clean_text(loc_match.group(1))
            # Validation checks
            if data.full_name and loc_cand_str.lower() in data.full_name.lower():
                continue
            if any(cred.lower() in loc_cand_str.lower() for cred in ["leed", "pmp", "cem", "phd", "mba", "ap", "pe"]):
                continue
            if "www." in loc_cand_str.lower() or "http" in loc_cand_str.lower() or ".com" in loc_cand_str.lower():
                continue
            if len(loc_cand_str.split(',')) != 2:
                continue  # Must have one comma
            if len(loc_cand_str) > 50:
                continue  # Too long

            is_section_header_part = False
            for _, aliases in rc.SECTION_KEYWORDS_ORDERED:
                if any(alias.lower() in loc_cand_str.lower() for alias in aliases):
                    is_section_header_part = True
                    break
            if is_section_header_part:
                continue

            regex_locations.append(loc_cand_str)

        if regex_locations:
            chosen_loc = None
            # Prefer locations without slashes first
            for loc_str in regex_locations:
                if "/" not in loc_str:
                    chosen_loc = loc_str
                    break
            if not chosen_loc:  # If all had slashes, take the first one
                chosen_loc = regex_locations[0]

            # If chosen location still has slash, take the part before it
            if "/" in chosen_loc:
                chosen_loc = _clean_text(chosen_loc.split('/')[0])

            data.location = chosen_loc
            logger.debug(
                f"--- PARSER: Assigned primary location via refined regex fallback: {data.location} ---")

    text_urls = re.findall(rc.URL_REGEX, cleaned_text_block, re.IGNORECASE)
    all_potential_urls = set(url.strip().rstrip('/')
                             for url in text_urls if url.strip())
    all_potential_urls.update(link.strip().rstrip('/')
                              for link in annotation_links if link and link.strip())
    logger.debug(
        f"--- PARSER: All potential URLs found: {all_potential_urls} ---")

    temp_remaining_urls_for_portfolio_pass = []
    for url_str in all_potential_urls:
        if not data.linkedin_url and re.match(rc.LINKEDIN_REGEX, url_str, re.IGNORECASE):
            data.linkedin_url = url_str
        elif not data.github_url and re.match(rc.GITHUB_REGEX, url_str, re.IGNORECASE):
            data.github_url = url_str
        elif not data.twitter_url and re.match(rc.TWITTER_REGEX, url_str, re.IGNORECASE):
            data.twitter_url = url_str
        else:
            temp_remaining_urls_for_portfolio_pass.append(url_str)

    final_other_links_set = set()
    for url_str in temp_remaining_urls_for_portfolio_pass:
        is_already_primary = url_str == data.linkedin_url or \
            url_str == data.github_url or \
            url_str == data.twitter_url
        if not is_already_primary and not data.portfolio_url and \
           any(term.lower() in url_str.lower() for term in rc.PORTFOLIO_KEYWORDS):
            data.portfolio_url = url_str
        elif not is_already_primary and url_str != data.portfolio_url:
            # Basic check to avoid adding email addresses as links
            if "@" not in url_str:
                final_other_links_set.add(url_str)
    data.other_links = sorted(list(final_other_links_set))
    logger.debug(
        f"--- PARSER: Links parsed: LI='{data.linkedin_url}', GH='{data.github_url}', TW='{data.twitter_url}', PF='{data.portfolio_url}', Other={data.other_links} ---")

    # --- Section Detection (largely unchanged, ensure it works with cleaned lines) ---
    sections_content: Dict[str, List[str]] = {
        key_tuple[0]: [] for key_tuple in rc.SECTION_KEYWORDS_ORDERED
    }
    current_section_key: Optional[str] = None
    start_line_index = 0  # Recalculate start index based on parsed name/contact info

    if data.full_name and lines and lines[0].strip().lower() == data.full_name.lower():
        start_line_index = 1
        if len(lines) > 1:
            line_after_name = lines[1].lower()
            has_email = data.email and data.email in line_after_name
            has_phone = data.phone_number and data.phone_number in line_after_name.replace(
                " ", "")
            has_location = data.location and data.location.lower() in line_after_name
            has_linkedin = data.linkedin_url and data.linkedin_url.split(
                '/')[-1] in line_after_name  # Check for profile ID

            if has_email or has_phone or has_location or has_linkedin or \
               ("@" in line_after_name and ("|" in line_after_name or "·" in line_after_name or "•" in line_after_name)) or \
               (re.search(rc.PHONE_REGEX, line_after_name) is not None):
                start_line_index = 2
                if len(lines) > 2:
                    third_line_lower = lines[2].lower()
                    has_email_3 = data.email and data.email in third_line_lower
                    has_phone_3 = data.phone_number and data.phone_number in third_line_lower.replace(
                        " ", "")
                    has_location_3 = data.location and data.location.lower() in third_line_lower
                    has_linkedin_3 = data.linkedin_url and data.linkedin_url.split(
                        '/')[-1] in third_line_lower

                    if (has_email_3 or has_phone_3 or has_location_3 or has_linkedin_3) and \
                       not any(hdr[0].lower() in third_line_lower for hdr in rc.SECTION_KEYWORDS_ORDERED):
                        start_line_index = 3

    logger.debug(
        f"--- PARSER: Section detection will start from line index: {start_line_index} ---")
    logger.debug("--- PARSER: Starting section detection loop... ---")

    for line_idx, line_content_original in enumerate(lines[start_line_index:]):
        actual_line_idx = line_idx + start_line_index
        # Use original cleaned line for matching
        line_norm = line_content_original.lower()

        logger.debug(
            f"--- PARSER (Section Loop L{actual_line_idx}): Processing line_norm: '{line_norm}' (orig: '{line_content_original[:70]}...') ---")

        if not line_norm:
            continue

        matched_section_this_line = None
        for section_canonical_key, section_aliases_orig in rc.SECTION_KEYWORDS_ORDERED:
            section_aliases = sorted(
                section_aliases_orig, key=len, reverse=True)
            for alias in section_aliases:
                # More robust matching: exact, with colon, starts with + space, or short line starts with
                if line_norm == alias or line_norm == alias + ":" or \
                   (line_norm.startswith(alias + " ") and len(alias.split()) > 0) or \
                   (line_norm.startswith(alias) and len(line_norm) < len(alias) + 25 and len(line_norm.split()) < 6):

                    is_strong_match = True
                    # Avoid matching keywords within sentences unless it's a very specific/long alias
                    # If not just the header
                    if not re.match(r"^" + re.escape(alias) + r"(:|\s)*$", line_norm, re.IGNORECASE):
                        if len(line_norm) > len(alias) + 10 and len(alias) < 10 and " " not in alias:
                            is_strong_match = False  # Short alias in a longer line is likely not a header

                    if is_strong_match:
                        logger.debug(
                            f"--- PARSER (Section Loop L{actual_line_idx}): Potential match! Alias='{alias}', Line='{line_norm}', StrongMatchHeuristic={is_strong_match} ---")
                        matched_section_this_line = section_canonical_key
                        break
            if matched_section_this_line:
                break

        if matched_section_this_line:
            line_to_check_if_only_header = line_content_original.lower().strip(": ")
            aliases_for_matched_section = next(
                (als for key, als in rc.SECTION_KEYWORDS_ORDERED if key == matched_section_this_line), [])
            is_line_only_header = any(line_to_check_if_only_header == alias_check.lower(
            ) for alias_check in aliases_for_matched_section)

            if current_section_key != matched_section_this_line:
                logger.info(
                    f"--- PARSER (Section Loop L{actual_line_idx}): Switched to section: {matched_section_this_line} (matched on alias for: '{line_content_original[:40]}...') ---")
                current_section_key = matched_section_this_line
                if not is_line_only_header:
                    sections_content[current_section_key].append(
                        line_content_original)
            elif current_section_key:
                if not is_line_only_header:
                    sections_content[current_section_key].append(
                        line_content_original)
        elif current_section_key:
            sections_content[current_section_key].append(line_content_original)
        else:
            logger.debug(
                f"--- PARSER (Section Loop L{actual_line_idx}): Line not matched to any section header and no active section: '{line_content_original[:70]}...' ---")

    # --- Section Parsing Calls (Unchanged) ---
    logger.debug(
        "--- PARSER: Final sections_content before calling individual parsers: ---")
    for sec_name, sec_lines in sections_content.items():
        if sec_lines:
            logger.debug(
                f"  --- Section '{sec_name}' has {len(sec_lines)} lines. First 3: {[l[:70] for l in sec_lines[:3]]} ---")
        else:
            logger.debug(f"  --- Section '{sec_name}' has 0 lines. ---")

    if sections_content.get("SUMMARY"):
        summary_lines_raw = sections_content["SUMMARY"]
        processed_summary_lines = []
        if summary_lines_raw:
            first_summary_line_cleaned = _clean_text(
                summary_lines_raw[0]).lower()
            summary_aliases = next(
                (als for key, als in rc.SECTION_KEYWORDS_ORDERED if key == "SUMMARY"), [])
            is_just_header = any(first_summary_line_cleaned == alias.lower(
            ) or first_summary_line_cleaned == alias.lower() + ":" for alias in summary_aliases)
            if is_just_header and len(summary_lines_raw) > 1:
                processed_summary_lines = summary_lines_raw[1:]
            elif is_just_header and len(summary_lines_raw) == 1:
                processed_summary_lines = []
            else:
                processed_summary_lines = summary_lines_raw
        data.summary = " ".join(_clean_text(l)
                                for l in processed_summary_lines).strip() or None

    if sections_content.get("SKILLS"):
        # **Still depends on skills lines being present in sections_content["SKILLS"]**
        data.skills = _parse_skills_section(
            sections_content["SKILLS"], doc, cleaned_text_block)
        if not data.skills and sections_content.get("SKILLS"):
            logger.warning(
                "--- PARSER: Skills section had lines but _parse_skills_section returned empty. Check parsing logic or input lines.")
        elif not sections_content.get("SKILLS"):
            logger.warning(
                "--- PARSER: No lines found for SKILLS section during section detection.")

    if sections_content.get("EDUCATION"):
        data.education = _parse_education_section(
            sections_content["EDUCATION"])
    if sections_content.get("EXPERIENCE"):
        data.experience = _parse_experience_section(
            sections_content["EXPERIENCE"])

    if sections_content.get("LEADERSHIP"):
        leadership_text_lines = sections_content["LEADERSHIP"]
        processed_leadership_lines = []
        if leadership_text_lines:
            first_lead_line_cleaned = _clean_text(
                leadership_text_lines[0]).lower()
            lead_aliases = next(
                (als for key, als in rc.SECTION_KEYWORDS_ORDERED if key == "LEADERSHIP"), [])
            is_just_header_lead = any(first_lead_line_cleaned == alias.lower(
            ) or first_lead_line_cleaned == alias.lower() + ":" for alias in lead_aliases)
            if is_just_header_lead and len(leadership_text_lines) > 1:
                processed_leadership_lines = leadership_text_lines[1:]
            elif is_just_header_lead and len(leadership_text_lines) == 1:
                processed_leadership_lines = []
            else:
                processed_leadership_lines = leadership_text_lines
            leadership_text_final = " ".join(_clean_text(
                l) for l in processed_leadership_lines).strip()
            if leadership_text_final:
                if data.summary:
                    data.summary += "\n\nLeadership: " + leadership_text_final
                else:
                    data.summary = "Leadership: " + leadership_text_final

    # Fallback for location using SpaCy GPE if still not found
    if not data.location and doc:
        locations_gpe = [ent.text.strip()
                         for ent in doc.ents if ent.label_ == "GPE"]
        valid_locations_gpe = []
        for loc_cand in locations_gpe:
            # Basic validation
            if len(loc_cand) > 2 and len(loc_cand) < 50 and re.search(r"[a-zA-Z]", loc_cand):
                if data.full_name and loc_cand.lower() in data.full_name.lower():
                    continue
                # Check if it's part of a known section header
                is_header = False
                for _, aliases in rc.SECTION_KEYWORDS_ORDERED:
                    if any(alias.lower() == loc_cand.lower() for alias in aliases):
                        is_header = True
                        break
                if is_header:
                    continue
                valid_locations_gpe.append(loc_cand)

        if valid_locations_gpe:
            preferred_loc = None
            # Prefer locations matching City, ST/State format
            for loc_item in valid_locations_gpe:
                if re.match(rc.LOCATION_ONLY_REGEX_STR, loc_item):
                    preferred_loc = loc_item
                    break
            # If none match format, take the first plausible one found
            if not preferred_loc:
                preferred_loc = valid_locations_gpe[0]

            if preferred_loc:
                data.location = _clean_text(preferred_loc)
                logger.debug(
                    f"--- PARSER: Assigned primary location via spaCy NER GPE fallback: {data.location} ---")

    if not nlp:
        logger.warning(
            "--- PARSER: spaCy model not loaded, NER/Matcher enhancements were limited. Consider installing 'en_core_web_md'. ---")

    logger.info("--- PARSER: EXITING parse_resume_text NORMALLY ---")
    return data
