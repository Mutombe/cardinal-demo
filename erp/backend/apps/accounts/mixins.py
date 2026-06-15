"""Mixins kept for compatibility. Single-tenant — no schema validation needed."""


class TenantSchemaValidationMixin:
    """No-op in single-tenant mode (kept so existing view bases still import)."""
    pass
