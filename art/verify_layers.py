"""Verify the first-person layer split against each original room painting."""
from pathlib import Path
from PIL import Image, ImageChops


ART = Path(__file__).resolve().parent
PLATES = ART.parent / "archive" / "es" / "plates"


def main():
    stacks = {
        7990: ["altar-clean", "altar-dais", "altar-column-right", "altar-column-left", "altar-plinth"],
        21149: ["quarters-clean", "quarters-bed"],
        29408: ["sanctum-clean", "sanctum-table", "sanctum-book", "sanctum-arch"],
        10021: ["court-clean", "court-basin"],
    }
    for record in (ART / "foreground.tsv").read_text(encoding="utf8").splitlines():
        if not record or record.startswith("#"):
            continue
        scene, key, *_ = record.split("|")
        stack = stacks.setdefault(int(scene), [f"foreground/{scene}-clean"])
        stack.append(f"foreground/{scene}-{key}")
    for scene, stack in stacks.items():
        with Image.open(ART / (stack[0] + ".png")) as surface:
            composite = surface.convert("RGBA")
        for name in stack[1:]:
            with Image.open(ART / (name + ".png")) as layer:
                composite.alpha_composite(layer)
        with Image.open(PLATES / f"ASCN-{scene}.png") as original:
            delta = ImageChops.difference(composite.convert("RGB"), original.convert("RGB"))
            if delta.getbbox():
                raise ValueError(f"ASCN {scene} differs from source within {delta.getbbox()}")
    print(f"Verified {len(stacks)} source-identical room composites.")


if __name__ == "__main__":
    main()
