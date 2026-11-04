"""Stage the playable GitHub Pages edition in an empty directory."""

import argparse
import hashlib
from pathlib import Path
import re
from shutil import copyfile


ROOT = Path(__file__).resolve().parents[1]
ASSETS = (
    "game/*.js", "game/*.css", "game/*.html", "game/*.svg",
    "archive/es/*.js", "archive/es/plates/*.png", "archive/es/sounds/*.wav",
    "archive/es/Scepters.rsrc", "archive/es/saves/*",
    "archive/dc/*.js", "archive/dc/paper/*.png",
    "art/*.js", "art/*.png", "art/castle/*.png", "art/foreground/*.png",
    "art/colour/*.js", "art/colour/atlas-*.png", "art/refresh/*.js",
    "art/refresh/*.png", "art/refresh/plates/*.png", "art/refresh/foreground/*.png",
    "art/refresh/forms/**/*.png", "art/refresh/sprites/**/*.png",
    "audio/dark-castle-bank.js", "audio/vault-audio.js", "audio/region-music.js",
    "audio/music/*.wav", "engine/adventure.jar", "engine/vendor/LICENSE-WAGE.txt",
)


def version_asset(match):
    attribute, path = match.groups()
    digest = hashlib.sha256((ROOT / path).read_bytes()).hexdigest()[:16]
    return f'{attribute}="{path}?v={digest}"'


def stage(destination):
    if destination.exists() and (not destination.is_dir() or any(destination.iterdir())):
        raise SystemExit(f"Choose a new or empty output directory: {destination}")

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    play_script = '<script src="game/play.js"></script>'
    adapter = '<script src="game/browser-engine.js"></script>'
    if index.count(play_script) != 1 or not (ROOT / "game/browser-engine.js").is_file():
        raise SystemExit("Missing the browser engine or the game/play.js script entry")
    if index.count("LOCAL DISK EDITION") != 1:
        raise SystemExit("Missing the edition label for the browser runtime credit")
    index = index.replace(play_script, adapter + play_script)
    index = index.replace("LOCAL DISK EDITION",
                          '<a href="engine/vendor/LICENSE-WAGE.txt">WAGE engine credits</a> · '
                          '<a href="https://cheerpj.com/">Built with CheerpJ</a>')
    # A returning player's cached scripts may predate the controls in this HTML.
    index = re.sub(r'\b(src|href)="([\w./-]+\.(?:js|css))"', version_asset, index)

    for pattern in ASSETS:
        files = sorted(ROOT.glob(pattern))
        if not files:
            raise SystemExit(f"No files matched {pattern}")
        for source in files:
            target = destination / source.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            copyfile(source, target)
    (destination / "index.html").write_text(index, encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path)
    stage(parser.parse_args().destination.resolve())
