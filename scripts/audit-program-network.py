"""No-model audit of stored vectors and graph sensitivity. Run via npm run audit:network.
These diagnostics measure structure / robustness, NOT semantic accuracy or school quality.
"""
import collections, json, sys
from pathlib import Path
import numpy as np

x = json.loads(Path(sys.argv[1]).read_text())
r = json.loads(Path(x['paths']['relations']).read_text())
e = json.loads(Path(x['paths']['embeddings']).read_text())
rows = {p['program_id']: p for p in x['rows']}
ids = r['ids']
assert all(pid in e['embeddings'] and pid in rows for pid in ids)
v = np.asarray([e['embeddings'][pid] for pid in ids], dtype=np.float64)
assert v.shape[1] == e['dim'] and np.isfinite(v).all()
v /= np.maximum(np.linalg.norm(v, axis=1, keepdims=True), 1e-12)
school = np.array([rows[pid]['schoolId'] for pid in ids])
group = np.array([rows[pid]['subject'] for pid in ids])
active = np.array([rows[pid]['active'] for pid in ids])
joint = np.array([rows[pid].get('jointProgramId') or '' for pid in ids])
residual = v.copy()
for s in sorted(set(school)):
    mask = school == s
    mean = v[mask].mean(axis=0) if mask.sum() >= 3 else v.mean(axis=0)
    residual[mask] -= mean
residual /= np.maximum(np.linalg.norm(residual, axis=1, keepdims=True), 1e-12)
sim = (residual @ residual.T).astype(np.float32)
raw_sim = (v @ v.T).astype(np.float32)
allowed = active[:, None] & active[None, :] & (school[:, None] != school[None, :])
allowed &= ~((joint[:, None] == joint[None, :]) & (joint[:, None] != ''))
same_group = (group[:, None] == group[None, :]) & (group[:, None] != 'Other')


def graph(matrix, same=.33, cross=.55, k=6):
    mask = allowed & ((same_group & (matrix >= same)) | (matrix >= cross))
    scores = np.floor(matrix * 100 + .5) / 100  # current builder sorts already-rounded weights
    edges = set()
    for i in np.where(active)[0]:
        hits = np.where(mask[i])[0]
        hits = hits[np.argsort(-scores[i, hits], kind='stable')][:k]
        for j in hits:
            edges.add(tuple(sorted((ids[i], ids[j]))))
    return edges


def stats(edges):
    neighbors = {pid: set() for pid in ids if rows[pid]['active']}
    for a, b in edges:
        if a in neighbors and b in neighbors:
            neighbors[a].add(b); neighbors[b].add(a)
    seen = set(); sizes = []
    for pid in neighbors:
        if pid in seen:
            continue
        todo = [pid]; seen.add(pid); size = 0
        while todo:
            a = todo.pop(); size += 1
            for b in neighbors[a] - seen:
                seen.add(b); todo.append(b)
        sizes.append(size)
    degree = [len(v) for v in neighbors.values()]
    return {'edges': len(edges), 'isolatedIndexedActivePrograms': sum(d == 0 for d in degree), 'components': len(sizes), 'largestComponent': max(sizes, default=0), 'medianDegree': float(np.median(degree)), 'maximumDegree': max(degree, default=0)}


def jaccard(a, b):
    return round(len(a & b) / len(a | b), 4) if a or b else 1.0


published = {tuple(sorted((pid, ids[j]))) for i, pid in enumerate(ids) for j, _ in r['programs'][i] if rows[pid]['active'] and rows[ids[j]]['active']}
baseline = graph(sim)
sweep = []
for label, same, cross, k in [('lower thresholds', .28, .50, 6), ('current thresholds', .33, .55, 6), ('higher thresholds', .38, .60, 6), ('four alternatives', .33, .55, 4), ('eight alternatives', .33, .55, 8)]:
    candidate = graph(sim, same, cross, k)
    sweep.append({'variant': label, 'sameSubjectThreshold': same, 'crossSubjectThreshold': cross, 'k': k, **stats(candidate), 'edgeJaccardVsRecomputedBaseline': jaccard(candidate, baseline), 'retainedBaselineEdges': round(len(candidate & baseline) / max(1, len(baseline)), 4)})


def same_school_share(matrix):
    hits = []
    for i in np.where(active)[0]:
        candidates = np.where(active & (np.arange(len(ids)) != i))[0]
        candidates = candidates[np.argsort(-matrix[i, candidates], kind='stable')][:6]
        hits.extend(school[i] == school[j] for j in candidates)
    return round(float(np.mean(hits)), 4)


global_residual = v - v.mean(axis=0)
global_residual /= np.maximum(np.linalg.norm(global_residual, axis=1, keepdims=True), 1e-12)
global_graph = graph((global_residual @ global_residual.T).astype(np.float32))
active_ids = {pid for pid, p in rows.items() if p['active']}
missing = sorted(active_ids - set(ids))
weights = [w for i, p in enumerate(ids) for j, w in r['programs'][i] if rows[p]['active'] and rows[ids[j]]['active']]
report = {
    'checked': x['checked'], 'numpyVersion': np.__version__, 'inputHashes': x['inputHashes'],
    'meaning': 'Read-only completeness and cached-vector sensitivity diagnostics. Not semantic validation, curriculum equivalence, rankings, admission predictions or alumni/career analysis.',
    'coverage': x['coverage'],
    'embeddingCache': {'model': e.get('model'), 'createdAt': e.get('createdAt'), 'dimensions': e['dim'], 'vectors': len(e['embeddings']), 'indexedActivePrograms': int(active.sum()), 'activeProgramsWithoutIndexedVectors': missing, 'inputTextHashesPresent': 'inputHashes' in e or 'corpusHashes' in e, 'warning': 'The cache predates the recent source corrections, includes school/location/degree/language boilerplate, and does not store per-record text hashes. Current-input freshness cannot be verified. No new embeddings generated.'},
    'publishedGraph': {**stats(published), 'method': r['method'], 'createdAt': r['createdAt'], 'indexedSchoolCount': len(r['schools']), 'recomputedBaselineEdgeJaccard': jaccard(published, baseline), 'missingFromRecomputedBaseline': len(published - baseline), 'newInRecomputedBaseline': len(baseline - published), 'directedWeightQuantiles': dict(zip(['min','q25','median','q75','max'], map(float, np.quantile(weights,[0,.25,.5,.75,1]))))},
    'thresholdAndNeighborSensitivity': sweep,
    'preprocessingSensitivity': {'globalMeanOnly': stats(global_graph), 'globalMeanOnlyEdgeJaccardVsSchoolMeanBaseline': jaccard(global_graph, baseline), 'unconstrainedTopSixSameSchoolShare': {'rawVectors': same_school_share(raw_sim), 'schoolMeanRemoved': same_school_share(sim)}, 'warning': 'Excluding same-school links in the published graph is a construction rule, not proof that institutional bias was removed. School-mean subtraction also removes real shared curriculum/context.'},
    'duplicateAndRepresentationWarnings': {'documentedInstitutionAlias': x['documentedInstitutionAlias'], 'repeatedDescriptionGroups': len(x['repeatedDescriptionGroups']), 'recordsSharingDescription': sum(map(len, x['repeatedDescriptionGroups'])), 'inactiveIndexedRecordsInSchoolMeansAndCoverageDenominators': int((~active).sum()), 'note': 'Repeated descriptions / legacy degree variants are not automatically duplicate programs. Entity reconciliation needs source review; no records or graph edges changed.'},
    'missingKnowledgeLayers': {'booksProjectsTheoriesAlumniCareers': 'No structured, evidence-linked layer for these entities is present in the audited program schema. Do not infer shared readings, alumni or careers from a program-similarity edge.'},
    'learningGraphDirection': {
        'entities': ['Canonical school', 'Program / teaching area', 'Concept / practice', 'Work / project / book', 'Publicly documented person'],
        'edgeLayers': {
            'documented': 'Official curriculum, reading list, project credit, faculty or alumni evidence. Keep exact claim, source passage, URL, scope, date and reviewer.',
            'editorial': 'Our interpretation / reading route. Clearly labelled, with an explanation and bibliography; not presented as the school\'s curriculum.',
            'computed': 'A candidate resonance from the versioned model. Not evidence of a shared book, theory, partnership or career.'
        },
        'fusing': 'A user-held juxtaposition of two or more programs: show sourced intersections, contrasts and possible reading routes side by side. Preserve each identity; do not average vectors into a fit score or invent a hybrid degree.',
        'internalReadingPages': 'Bibliographic records, original explainers, source-backed teaching connections and licensed excerpts / full text when permission permits. One provenance drawer rather than a maze of external links.',
        'contentRights': 'Open bibliographic metadata does not grant rights to the underlying books, PDFs or images. Check per-work license before hosting content.',
        'alumni': 'Use explicit public / consented education, project and role records with dates and attribution. Faculty is not alumni; association is not causation. Coverage bias prevents credible career-success rankings.',
        'pilot': 'Curate a small, varied set of roughly 12 programs and 20 resources before scaling. Validate exact links with a human; empty or unknown is an acceptable result. No resources or alumni claims have been generated by this audit.'
    },
    'references': [
        {'url': 'https://www.nature.com/articles/s42003-022-03628-x', 'relevance': 'Evaluate local/global structure, parameter/preprocessing sensitivity and efficiency; do not treat projected clusters as ground truth. This paper does not validate our art-school graph.'},
        {'url': 'https://www.nature.com/articles/s41467-025-60434-9', 'relevance': 'Neighbor embeddings can introduce misleading structures; diagnostic evaluation is needed before adopting UMAP/t-SNE.'},
        {'url': 'https://github.com/ourresearch/openalex-docs/blob/main/license.md', 'relevance': 'OpenAlex metadata is CC0; useful for bibliographic entities.'},
        {'url': 'https://help.openalex.org/access/fulltext/', 'relevance': 'Original PDFs retain their own copyright; metadata openness does not grant full-text reuse rights.'}
    ],
    'validationRequired': ['Freeze source snapshots and canonical institution identities, preserving all legacy IDs as aliases.', 'Embed versioned program-specific curriculum text separately from school/location/admissions boilerplate; keep source quotes and text hashes.', 'Create a stratified human-reviewed set of within- and cross-subject pairs, including negatives, translations, sparse records and legacy variants; hold out a test set before choosing thresholds.', 'Compare content-only embeddings, a lexical baseline and sourced attribute overlap. Measure precision/coverage, robustness and projection neighborhood preservation; report uncertainty, not a fit score.', 'Keep affiliation, documented teaching/resources and computational resonance as separate typed edge layers. Show the evidence for every material claim.'],
}
out = Path(f'data/research/{x["checked"]}-network-reliability.json')
out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({'file': str(out), 'coverage': report['coverage'], 'publishedGraph': report['publishedGraph'], 'embeddingMissingCount': len(missing), 'thresholdSensitivity': sweep, 'preprocessingSensitivity': report['preprocessingSensitivity'], 'descriptionGroups': report['duplicateAndRepresentationWarnings']['repeatedDescriptionGroups']}, indent=2))
