#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import stat


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


def set_permissions(path):
    for root, dirs, files in os.walk(path):
        for dir in dirs:
            os.chmod(os.path.join(root, dir), stat.S_IRWXU | stat.S_IRWXG | stat.S_IROTH | stat.S_IXOTH)
        for file in files:
            os.chmod(os.path.join(root, file), stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)


if __name__ == '__main__':
    main()
    set_permissions("backend-django/media")
