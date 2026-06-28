import re
from html.parser import HTMLParser
from io import StringIO


class _HTMLStripper(HTMLParser):
    """Strips all HTML tags, keeping only text content."""

    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self._text = StringIO()

    def handle_data(self, data):
        self._text.write(data)

    def get_text(self):
        return self._text.getvalue()


def strip_html(value):
    """Remove all HTML tags from a string, returning only plain text."""
    if not value:
        return value
    stripper = _HTMLStripper()
    stripper.feed(str(value))
    return stripper.get_text()


def sanitize_text(value):
    """
    Sanitize user input:
    1. Strip HTML tags
    2. Collapse excessive whitespace
    3. Strip leading/trailing whitespace
    """
    if not value:
        return value
    cleaned = strip_html(value)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def sanitize_name(value):
    """
    Sanitize a name field:
    1. Strip HTML
    2. Remove non-alphabetic characters except spaces, hyphens, dots, apostrophes
    3. Collapse whitespace
    """
    if not value:
        return value
    cleaned = strip_html(value)
    cleaned = re.sub(r"[^\w\s\-.'']", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()
