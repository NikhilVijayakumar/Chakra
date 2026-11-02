"""OTP email via AgentMail. The SDK is imported lazily so the CLI works without it."""
from __future__ import annotations

from typing import Protocol

from .errors import ChakraError

_HTML = """<!DOCTYPE html><html><body style="font-family:sans-serif">
<h2>Your OTP Code</h2><p style="font-size:24px;font-weight:bold">{otp}</p>
<p>This code expires in {minutes} minutes.</p>
<p>If you didn't request this, please ignore this email.</p></body></html>"""


class Mailer(Protocol):
    def send_otp(self, to: str, otp: str, minutes: int) -> None: ...


class AgentMailer:
    def __init__(self, api_key: str | None, inbox_id: str | None) -> None:
        self._key, self._inbox = api_key, inbox_id

    def configured(self) -> bool:
        return bool(self._key and self._inbox)

    def send_otp(self, to: str, otp: str, minutes: int) -> None:
        if not self.configured():
            raise ChakraError("email_unavailable", "email provider is not configured")
        try:
            from agentmail import AgentMail  # not verified against a live account yet

            AgentMail(api_key=self._key).inboxes.messages.send(
                self._inbox, to=to, subject="[Chakra] Password Reset OTP", html=_HTML.format(otp=otp, minutes=minutes)
            )
        except Exception as e:
            raise ChakraError("email_unavailable", f"email send failed: {type(e).__name__}") from e
