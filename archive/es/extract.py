"""Index the archive disk and derive game assets. Requires machfs 1.3 and rsrcfork 1.8.

Run once before ExportPlates to materialize the fork, then again after it for PNG geometry.
"""
import hashlib
import io
import json
import struct
import wave
from pathlib import Path

import machfs
import rsrcfork

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
IMAGE = ROOT / "sources/enchanted-scepters/EnchantedScepters.img"
SOURCE = "https://archive.org/details/EnchantedSceptersMacintosh"
SOUNDS = HERE / "sounds"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def text(data):
    return data.decode("mac_roman").replace("\r", "\n")


def pstring(data, pos):
    end = pos + 1 + data[pos]
    return text(data[pos+1:end]), end


def record(base, variable, content):
    (HERE / (base + ".json")).write_text(json.dumps(content, ensure_ascii=True, indent=2) + "\n", "utf-8")
    (HERE / (base + ".js")).write_text("window." + variable + " = " +
            json.dumps(content, ensure_ascii=True, separators=(",", ":")) + ";\n", "utf-8")


def statistics(fork):
    return {"sha256": sha(fork), "bytes": len(fork)}


def extract_sound(resource):
    data = resource.data
    repetitions = struct.unpack_from(">H", data, 2)[0]
    # Each sound supplies its own signed nibble-to-delta lookup in its header.
    deltas = struct.unpack_from(">16b", data, 4)
    previous = 128
    pcm = bytearray()
    for octet in data[20:]:
        for nibble in (octet & 15, octet >> 4):
            previous = (previous + deltas[nibble]) & 255
            pcm.append(previous)
    wave_path = SOUNDS / f"ASND-{resource.id}.wav"
    with wave.open(str(wave_path), "wb") as output:
        output.setparams((1, 1, 11000, 0, "NONE", "not compressed"))
        output.writeframes(pcm * repetitions)
    return {"id": resource.id, "name": text(resource.name),
            "path": wave_path.relative_to(ROOT).as_posix(), "rate": 11000,
            "frames": len(pcm) * repetitions, "repetitions": repetitions}


def describe(kind, res, resources, bounds):
    data = res.data
    payload = struct.unpack_from(">H", data)[0]
    entry = {"type": kind, "id": res.id, "name": text(res.name),
             "path": f"archive/es/plates/{kind}-{res.id}.png"}
    location = bounds.get((kind, res.id))
    if location:
        entry.update(zip(("x", "y", "width", "height"), location))
    if kind == "ASCN":
        directions = ("north", "south", "east", "west")
        y, x, n, s, e, w, freq, sound_type = struct.unpack_from(">hhBBBBhB", data, payload+8)
        pos = payload+20
        messages = {}
        for direction in directions:
            messages[direction], pos = pstring(data, pos)
        sound, pos = pstring(data, pos)
        entry.update(worldX=x, worldY=y, blocked=dict(zip(directions, map(bool, (n,s,e,w)))),
                     messages=messages, sound=sound, soundFrequency=freq, soundType=sound_type,
                     text=text(resources[b"ATXT"][res.id].data[12:]))
    else:
        offset = 22 if kind == "AOBJ" else 40
        entry["initialLocation"], _ = pstring(data, payload + offset)
    return entry


def main():
    disk = IMAGE.read_bytes()
    if hashlib.sha1(disk).hexdigest() != "6f384a34dbaca5a52e8a5658d523d1cafa2cd06d":
        raise ValueError("Source image differs from the catalogued Internet Archive edition")
    volume = machfs.Volume()
    volume.read(disk)
    SOUNDS.mkdir(exist_ok=True)
    saves = HERE / "saves"
    saves.mkdir(exist_ok=True)
    bounds = {}
    if (HERE / "bounds.tsv").exists():
        for line in (HERE / "bounds.tsv").read_text().splitlines():
            kind, rid, *geometry = line.split("\t")
            bounds[kind, int(rid)] = list(map(int, geometry))
    files, entries, designs, sounds = [], [], [], []
    for path, f in volume.iter_paths():
        if not isinstance(f, machfs.File):
            continue
        hfs = ":".join(path)
        local = None
        info = {"path": hfs, "type": text(f.type), "creator": text(f.creator),
                "dataBytes": len(f.data), "resourceBytes": len(f.rsrc),
                "dataSHA256": sha(f.data), "resourceSHA256": sha(f.rsrc)}
        if path[-1] == "Scepters":
            local = HERE / "Scepters.rsrc"
            local.write_bytes(f.rsrc)
            info["destination"] = local.relative_to(ROOT).as_posix()
        elif f.type == b"WDOC":
            target = saves / path[-1]
            target.write_bytes(f.data)
            info["destination"] = target.relative_to(ROOT).as_posix()
            scene_offset = struct.unpack_from(">I", f.data, 38)[0]
            info["savedSceneID"] = struct.unpack_from(">h", f.data, scene_offset)[0]
        else:
            info["destination"] = "retained in HFS image"
        files.append(info)
        if not f.rsrc:
            continue
        resources = rsrcfork.ResourceFile(io.BytesIO(f.rsrc))
        for tag, group in resources.items():
            kind = text(tag)
            for rid, res in group.items():
                destination = "retained in HFS image"
                if local:
                    destination = "indexed in archive/es/Scepters.rsrc"
                    if kind in ("ASCN", "AOBJ", "ACHR"):
                        design = describe(kind, res, resources, bounds)
                        designs.append(design)
                        destination = design["path"]
                    elif kind == "ASND":
                        sound = extract_sound(res)
                        sounds.append(sound)
                        destination = sound["path"]
                    elif kind in ("ACOD", "GCOD", "ATXT", "MENU", "VERS", "DITL"):
                        destination = "archive/es/Scepters.rsrc (WAGE world data)"
                offset = resources.data_offset + res.data_raw_offset + 4
                raw = bytes(f.rsrc[offset:offset + res.length_raw])
                assert raw == res.data_raw
                entries.append({"file": hfs, "type": kind, "id": rid,
                                "name": text(res.name) if res.name is not None else None,
                                "offset": offset, "bytes": len(raw), "sha256": sha(raw),
                                "destination": destination})
    source = {"item": SOURCE, "path": IMAGE.relative_to(ROOT).as_posix(),
              "sha1": hashlib.sha1(disk).hexdigest(), **statistics(disk),
              "volume": text(disk[1061:1061+disk[1060]])}
    record("catalog", "ES_CATALOG", {"source": source, "files": files, "resources": entries})
    record("sounds", "ES_SOUNDS", sounds)
    if len(bounds) == len(designs):
        record("designs", "ES_DESIGNS", designs)
    print(f"{len(files)} files, {len(entries)} resources, {len(designs)} designs, {len(sounds)} sounds.")


if __name__ == "__main__":
    main()
