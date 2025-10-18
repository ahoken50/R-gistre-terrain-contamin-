#!/usr/bin/env python3
"""Compatibilité : alias vers download_gov_data.main()."""

from download_gov_data import main

if __name__ == "__main__":
    raise SystemExit(main())
