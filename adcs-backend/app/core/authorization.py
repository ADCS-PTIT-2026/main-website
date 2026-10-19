"""Authorization rules shared by API dependencies and object-level checks."""

PERMISSION_ALIASES = {
    "doc:view": "file.read", "doc:read": "file.read",
    "doc:download": "file.read", "file.download": "file.read",
    "doc:create": "file.create", "doc:upload": "file.create",
    "doc:edit": "file.update", "doc:update": "file.update", "file.edit": "file.update",
    "doc:approve": "file.approve", "doc:delete": "file.delete",
}


def canonical_permission(code: str) -> str:
    return PERMISSION_ALIASES.get(code, code)


def is_system_admin(user) -> bool:
    # Loaded from the immutable database system_code, never client/JWT claims.
    return bool(user and getattr(user, "is_admin", False) is True)


def has_permission(user, code: str) -> bool:
    if is_system_admin(user):
        return True
    return canonical_permission(code) in {
        canonical_permission(value) for value in getattr(user, "permissions", [])
    }
