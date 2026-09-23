"""Build the local 2024 INPE fire preview from the preserved audit ZIP.

No network access. The source CSV does not contain a satellite field or an
explicit timezone; both facts are preserved in the generated metadata.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "evidence/samples/inpe_focos_es_2024.zip"
TARGET = ROOT / "site/src/data/fire-2024.json"
SOURCE_URI = "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/anual/EstadosBr_sat_ref/ES/focos_br_es_ref_2024.zip"


def build() -> dict:
    with zipfile.ZipFile(SOURCE) as archive:
        members = archive.namelist()
        if members != ["focos_br_es_ref_2024.csv"]:
            raise ValueError(f"Unexpected ZIP members: {members}")
        with io.TextIOWrapper(archive.open(members[0]), encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream)
            expected = ["id_bdq", "foco_id", "lat", "lon", "data_pas", "pais", "estado", "municipio", "bioma"]
            if reader.fieldnames != expected:
                raise ValueError(f"Unexpected CSV schema: {reader.fieldnames}")
            points = []
            for row in reader:
                point = {
                    "id": row["foco_id"].strip(),
                    "source_id": row["id_bdq"].strip(),
                    "lat": float(row["lat"]),
                    "lon": float(row["lon"]),
                    "observed_at": row["data_pas"].strip(),
                    "municipality": row["municipio"].strip(),
                    "biome": row["bioma"].strip(),
                    "satellite": None,
                }
                if not point["id"] or not point["source_id"] or not point["observed_at"].startswith("2024-"):
                    raise ValueError(f"Invalid required field in row: {row}")
                points.append(point)
    points.sort(key=lambda row: (row["observed_at"], row["id"]))
    if len(points) != 662 or points[0]["observed_at"][:10] != "2024-01-04" or points[-1]["observed_at"][:10] != "2024-12-20":
        raise ValueError("Source does not match the audited 2024 sample")
    return {
        "metadata": {
            "institution": "INPE / Programa Queimadas",
            "dataset": "Focos de calor — arquivo anual ES 2024",
            "source_url": SOURCE_URI,
            "source_file": "evidence/samples/inpe_focos_es_2024.zip!focos_br_es_ref_2024.csv",
            "source_zip_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            "record_count": len(points),
            "first_observation": points[0]["observed_at"],
            "last_observation": points[-1]["observed_at"],
            "timestamp_timezone": "não informado no CSV",
            "satellite_field": "não presente no CSV",
            "transformation": "trim de texto; conversão de lat/lon para número; renomeação de campos; ordenação por data e ID; nenhum registro removido",
        },
        "points": points,
    }


if __name__ == "__main__":
    result = build()
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(result['points'])} records to {TARGET.relative_to(ROOT)}")
