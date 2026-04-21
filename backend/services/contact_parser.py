"""
Extract contact info from resume text.
Kept from Phase 1 — utility only.
"""
import re
from typing import Dict, Optional


def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    return {
        "name": _extract_name(text),
        "email": _extract_email(text),
        "phone": _extract_phone(text),
    }


def _extract_email(text: str) -> Optional[str]:
    m = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return m.group(0) if m else None


def _extract_phone(text: str) -> Optional[str]:
    for pattern in [
        r'\+?[\d]{1,3}[-.\s]?[\d]{3,5}[-.\s]?[\d]{3,5}[-.\s]?[\d]{3,5}',
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{10}',
    ]:
        m = re.search(pattern, text)
        if m:
            digits = re.sub(r'\D', '', m.group(0))
            if len(digits) >= 10:
                return m.group(0)
    return None


def _extract_name(text: str) -> Optional[str]:
    for line in text.strip().splitlines()[:5]:
        line = line.strip()
        if not line or len(line) > 50:
            continue
        if '@' in line or re.search(r'\d{5,}', line):
            continue
        skip = ['resume', 'cv', 'curriculum', 'profile', 'summary',
                'objective', 'experience', 'education', 'skills']
        if any(k in line.lower() for k in skip):
            continue
        words = line.split()
        if 1 <= len(words) <= 5:
            alpha = sum(c.isalpha() or c.isspace() for c in line)
            if alpha / len(line) > 0.8:
                return line
    return None
