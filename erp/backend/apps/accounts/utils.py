"""User query helpers (single-tenant)."""


def get_tenant_users(roles=None, tenant_schema=None, active_only=True, notifications_enabled_only=False):
    """
    Return a User queryset. Single-tenant: all users belong to Cardinal, so
    `tenant_schema` is ignored (kept in the signature for call-site compatibility).
    """
    from apps.accounts.models import User

    qs = User.objects.all()
    if roles:
        qs = qs.filter(role__in=roles)
    if active_only:
        qs = qs.filter(is_active=True)
    if notifications_enabled_only:
        qs = qs.filter(notifications_enabled=True)
    return qs


def get_tenant_staff(roles=None, tenant_schema=None):
    """
    Active, notifications-enabled staff for the current tenant.
    Default roles: [ADMIN, ACCOUNTANT].
    """
    from apps.accounts.models import User

    if roles is None:
        roles = [User.Role.ADMIN, User.Role.ACCOUNTANT]
    return get_tenant_users(
        roles=roles,
        tenant_schema=tenant_schema,
        notifications_enabled_only=True,
    )


def get_tenant_staff_emails(roles=None, tenant_schema=None):
    """Eagerly resolve email list (safe for daemon threads)."""
    return [e for e in get_tenant_staff(roles, tenant_schema).values_list('email', flat=True) if e]
