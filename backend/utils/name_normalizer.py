import re

def normalize_organization_name(name: str) -> str:
    """
    Normalizes an organization name for reliable comparison.
    - Lowercases
    - Replaces & with and
    - Removes common punctuation
    - Normalizes common business suffixes (PVT, LTD, CO)
    - Removes extra whitespace
    """
    if not name:
        return ""
    
    # Lowercase
    n = name.lower()
    
    # Replace & with and
    n = n.replace("&", " and ")
    
    # Remove punctuation
    n = re.sub(r'[.,;:\'\"()\-]', ' ', n)
    
    # Split to words for suffix normalization
    words = n.split()
    
    normalized_words = []
    for w in words:
        if w in ['pvt', 'private']:
            normalized_words.append('private')
        elif w in ['ltd', 'limited']:
            normalized_words.append('limited')
        elif w in ['co', 'company']:
            normalized_words.append('company')
        elif w in ['inc', 'incorporated']:
            normalized_words.append('incorporated')
        elif w in ['llp']:
            normalized_words.append('llp')
        else:
            normalized_words.append(w)
            
    # Rejoin with single spaces
    return " ".join(normalized_words).strip()
