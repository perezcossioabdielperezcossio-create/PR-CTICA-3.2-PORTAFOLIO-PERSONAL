"""Ejecuta las pruebas del registro de gimnasio desde cualquier directorio."""

import argparse
from pathlib import Path
from shutil import which
import subprocess


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SUITES = ("unit", "integration", "e2e")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("suite", choices=("all", *SUITES), default="all", nargs="?")
    args = parser.parse_args()

    npm = which("npm.cmd") or which("npm")
    if npm is None:
        parser.exit(1, "Instala Node.js 24 o superior para disponer de npm.\n")

    script = "test" if args.suite == "all" else f"test:{args.suite}"
    return subprocess.run([npm, "run", script], cwd=PROJECT_ROOT).returncode


if __name__ == "__main__":
    raise SystemExit(main())
