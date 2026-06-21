import base64
import hashlib
import hmac
import secrets
import struct
import time
import urllib.parse

def generate_totp_secret():
    """Generate a random 32-character base32 secret."""
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    return "".join(secrets.choice(chars) for _ in range(32))

def get_totp_uri(secret, username, issuer="BiharSeva"):
    """Generate a provisioning URI for authenticator apps."""
    username_escaped = urllib.parse.quote(username)
    issuer_escaped = urllib.parse.quote(issuer)
    return f"otpauth://totp/{issuer_escaped}:{username_escaped}?secret={secret}&issuer={issuer_escaped}"

def verify_totp(secret, code, window=1):
    """Verify a TOTP code against a secret key within a time window for drift."""
    try:
        code_str = str(code).strip().replace(" ", "")
        if len(code_str) != 6 or not code_str.isdigit():
            return False

        secret_clean = secret.strip().replace(" ", "")
        # Pad secret to multiple of 8 characters for base32 decoding
        missing_padding = len(secret_clean) % 8
        if missing_padding:
            secret_clean += "=" * (8 - missing_padding)

        key = base64.b32decode(secret_clean, casefold=True)
    except Exception:
        return False

    # Check the code against current, previous, and next intervals (30s)
    current_time = time.time()
    for offset in range(-window, window + 1):
        counter = int(current_time / 30) + offset
        msg = struct.pack(">Q", counter)
        
        # Calculate HMAC-SHA1
        digest = hmac.new(key, msg, hashlib.sha1).digest()
        
        # Dynamic truncation (RFC 4226)
        offset_idx = digest[-1] & 0x0F
        binary = (struct.unpack(">I", digest[offset_idx:offset_idx+4])[0] & 0x7FFFFFFF)
        
        # Generate 6 digit code
        calculated_code = binary % 1000000
        if f"{calculated_code:06d}" == code_str:
            return True

    return False
