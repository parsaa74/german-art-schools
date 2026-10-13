"""Import only confirmed rows from the supplied review, by exact school/name/degree.
Run without arguments for a dry run; use --apply to write the data and audit.
No guessed matches, name/degree corrections, blocked URLs or catalog suggestions.
"""
import argparse, collections, hashlib, json, re, unicodedata
from pathlib import Path
from urllib.parse import urlparse

SOURCE = Path('data/research/degree-program-links.md')
OVERVIEW = ('Official link; live page blocked', 'Broader subject / catalog', 'Record correction required')
DATA = Path('src/data/enhanced_german_art_schools.json')
AUDIT = Path('data/research/2026-10-11-degree-program-links-import.json')


def fold(s):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', s.casefold()).encode('ascii', 'ignore').decode())


def degree(s):
    return '' if fold(s or '') in ('', 'notspecified', 'unspecified') else fold(s)


def main():
    apply = argparse.ArgumentParser()
    apply.add_argument('--apply', action='store_true')
    args = apply.parse_args()
    text = SOURCE.read_text()
    data = json.loads(DATA.read_text())
    school = None
    rows = []
    for line in text.splitlines():
        if line.startswith('## '):
            school = line[3:]
        if school and line.startswith('| '):
            cells = [s.strip().replace('\\|', '|') for s in re.split(r'(?<!\\)\|', line.strip('|'))]
            if len(cells) == 5 and cells[2] not in ('Result', '---'):
                name, award, status, links, notes = cells
                labelled = re.findall(r'\[([^\]]+)\]\((https?[^)]+)\)', links)
                rows.append(dict(school=school, name=name, degree=award, status=status, urls=[u for _, u in labelled], labelled=labelled, notes=notes))
    assert len(rows) == 337, len(rows)
    changes, overviews = [], []
    matched = set()
    # Explicit current-domain changes documented in the supplied review, not fuzzy domain matching.
    aliases = {'www.abk-nuernberg.de': 'adbk-nuernberg.de', 'www.abk-muenchen.de': 'www.adbk.de', 'www.hbks.uni-saarland.de': 'www.hbksaar.de'}
    for row in rows:
        u = data['universities'][row['school']]
        candidates = [p for p in u['programs'] if fold(p['name']) == fold(row['name']) and degree(p.get('degree')) == degree(row['degree'])]
        assert len(candidates) == 1, (row, [p['program_id'] for p in candidates])
        p = candidates[0]
        row['id'] = p['program_id']
        assert row['id'] not in matched, row['id']
        matched.add(row['id'])
        site = urlparse(u['website']).hostname
        site = aliases.get(site, site).removeprefix('www.')
        official = lambda url: (h := urlparse(url).hostname or '').removeprefix('www.') == site or h.endswith('.' + site)
        if row['status'] in OVERVIEW:
            # ponytail: first non-alternative official link only; ambiguous / third-party rows stay in the checklist.
            first = next(((label, url) for label, url in row['labelled'] if not re.match(r'(Alternative|Evidence) ', label)), None)
            details = p.get('details', {})
            homepage = first and urlparse(first[1]).path.strip('/') in ('', 'de', 'en')
            if first and official(first[1]) and not homepage and not details.get('programUrl') and not details.get('studyOverviewUrl'):
                details = p.setdefault('details', {})
                overviews.append({'id': row['id'], 'status': row['status'], 'url': first[1], 'reviewNotes': row['notes']})
                details['studyOverviewUrl'] = first[1]
                details['programPageNotes'] = f"{row['status']}. {row['notes']}"
                p.setdefault('sources', {})['details.studyOverviewUrl'] = first[1]
                row['stored'] = first[1]
            continue
        if row['status'] != 'Confirmed program link':
            continue
        assert row['urls'], row
        url = row['urls'][0]
        assert official(url), (row['id'], url)
        assert urlparse(url).scheme in ('http', 'https')
        details = p.setdefault('details', {})
        assert not details.get('programUrl') or details['programUrl'] == url, ('Already has a different specific page', row['id'])
        changes.append({'id': row['id'], 'school': row['school'], 'name': p['name'], 'degree': p.get('degree'), 'previousDetails': dict(details), 'url': url, 'reviewNotes': row['notes']})
        details['programUrl'] = url
        p.setdefault('sources', {})['details.programUrl'] = url
        if row['notes']:
            details['programPageNotes'] = row['notes']
            p['sources']['details.programPageNotes'] = url
    assert len(changes) == 185, len(changes)
    unresolved = [r for r in rows if r['status'] != 'Confirmed program link']
    audit = {'checked': '2026-10-11', 'sourceFile': str(SOURCE), 'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'imported': len(changes), 'studyOverviewLinks': len(overviews), 'unresolved': len(unresolved), 'policy': 'Confirmed program link rows -> details.programUrl. Blocked, broader catalog and record-correction rows -> details.studyOverviewUrl (labelled unverified) with the review note, first official non-alternative link only. Exact school, name and input degree; immutable IDs, names, degrees and all other fields retained; no record corrections applied.', 'changes': changes, 'overviews': overviews, 'unresolvedRecords': unresolved}
    if args.apply and AUDIT.exists() and data == json.loads(DATA.read_text()) and json.loads(AUDIT.read_text()).get('sourceSha256') == audit['sourceSha256']:
        print('All 185 links already imported; original import audit preserved.')
        return
    if args.apply:
        DATA.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
        AUDIT.write_text(json.dumps(audit, indent=2, ensure_ascii=False) + '\n')
        lines = ['# Programs still without a confirmed program page', '', f'{len(unresolved)} records at {len(set(r["school"] for r in unresolved))} schools. Updated 11 October 2026 after importing 185 confirmed pages from `degree-program-links.md`. {len(overviews)} of these now show an official link labelled "Study information (program page not verified)".', '', 'Original degree/name fields and IDs remain unchanged. Read the review notes before making any record correction.', '']
        groups = collections.defaultdict(list)
        for row in unresolved:
            groups[row['school']].append(row)
        for school, group in sorted(groups.items()):
            lines += [f'## {school} ({len(group)})', '', f'Website: {data["universities"][school]["website"]}', '']
            for r in group:
                lines += [f'- [ ] **{r["name"]}**, {r["degree"]}  `{r["id"]}`', f'  - {r["status"]}. {r["notes"]}']
                lines += [f'  - {"Shown as study information" if url == r.get("stored") else "Reference / candidate (not imported)"}: {url}' for url in r['urls']]
            lines.append('')
        Path('data/research/missing-program-pages.md').write_text('\n'.join(lines) + '\n')
    print(f'{"Imported" if args.apply else "Dry run:"} {len(changes)} confirmed pages; {len(overviews)} study-information links; {len(unresolved)} unresolved. No IDs, degrees, names or unrelated fields changed.')


if __name__ == '__main__':
    main()
