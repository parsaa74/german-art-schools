#!/usr/bin/env python3
"""Merge programs extracted from 'missing programs/' scrapes into
src/data/enhanced_german_art_schools.json.

Program lists were hand-extracted from the official study-programme pages
saved in 'missing programs/' (see Source: headers in those files).
Only fills schools whose `programs` array is currently empty.
"""
import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "src/data/enhanced_german_art_schools.json"

B, M = "Bachelor of Music", "Master of Music"
BA, MA = "Bachelor of Arts", "Master of Arts"
MED = "Master of Education"

def p(name, degree, duration=None, specializations=None, description=None):
    out = {"name": name, "degree": degree}
    if duration: out["duration"] = duration
    if specializations: out["specializations"] = specializations
    if description: out["description"] = description
    return out

PROGRAMS = {

"Hochschule für evangelische Kirchenmusik der Evangelisch-Lutherischen Kirche in Bayern": [
    p("Evangelische Kirchenmusik", B, "8 semesters"),
    p("Chorleitung", B, "8 semesters"),
    p("Orgel", B, "8 semesters"),
    p("Klavierpädagogik", B, "8 semesters"),
    p("Evangelische Kirchenmusik", M),
    p("Instrumental-/Vokalpädagogik", M),
    p("Musikleitung instrumental/vokal", M),
    p("Künstlerisches Orgelspiel", M),
],

"Hochschule für Musik Hanns Eisler Berlin": [
    p("Künstlerische Instrumentalausbildung", B, specializations=[
        "Violine","Viola","Violoncello","Kontrabass","Harfe","Gitarre","Flöte",
        "Oboe","Klarinette","Fagott","Saxophon","Horn","Trompete","Posaune",
        "Tuba","Schlagzeug","Klavier"]),
    p("Künstlerische Instrumentalausbildung", M),
    p("Gesang", B), p("Gesang", M),
    p("Komposition", B), p("Komposition", M),
    p("Orchesterdirigieren", B), p("Orchesterdirigieren", M),
    p("Chordirigieren", B), p("Chordirigieren", M),
    p("Musiktheater-Regie", "Bachelor"),
    p("Produktionsdramaturgie für Musiktheater", "Master"),
    p("Liedgestaltung für Pianist*innen", M),
    p("Kammermusik", M),
    p("Korrepetition", M),
    p("Elektroakustische Musik", M),
],

"Hochschule für Schauspielkunst Ernst Busch": [
    p("Schauspiel", "Diplom", "8 semesters"),
    p("Schauspielregie", "Diplom", "8 semesters"),
    p("Zeitgenössische Puppenspielkunst", "Diplom", "8 semesters"),
    p("Dramaturgie", MA, "4 semesters"),
    p("Spiel und Objekt", MA),
    p("Choreographie", MA, "4 semesters"),
],

"Hochschule für Musik Detmold": [
    p("Künstlerische Ausbildung", B, specializations=[
        "Orchesterinstrumente","Klavier","Gitarre","Akkordeon","Saxophon",
        "Blockflöte","Gesang"]),
    p("Künstlerische Ausbildung", M),
    p("Chorleitung", M), p("Orchesterleitung", M),
    p("Instrumental- und Gesangspädagogik", B),
    p("Elementare Musikpädagogik", B),
    p("Lehramt Musik", "Lehramt"),
    p("Kirchenmusik", B),
    p("Komposition", B),
    p("Musiktheorie und Gehörbildung", B),
    p("Musikübertragung / Tonmeister", B),
    p("Musikübertragung / Tonmeister", M),
],

"Hochschule für Kirchenmusik der Evangelisch-Lutherischen Landeskirche Sachsens": [
    p("Kirchenmusik (B)", "Diplom", "8 semesters",
      description="Diplomstudiengang für den hauptamtlichen kirchenmusikalischen Dienst, für evangelische und katholische Studierende."),
],

"Hochschule für Musik Carl Maria von Weber Dresden": [
    p("Künstlerische Ausbildung", B, specializations=[
        "Streichinstrumente","Blasinstrumente","Harfe","Pauke/Schlagwerk",
        "Klavier","Gitarre","Gesang"]),
    p("Künstlerische Ausbildung", M),
    p("Künstlerisch-pädagogische Ausbildung", B),
    p("Dirigieren / Korrepetition", B), p("Dirigieren / Korrepetition", M),
    p("Jazz/Rock/Pop", B), p("Jazz/Rock/Pop", M),
    p("Komposition", B), p("Komposition", M),
    p("Musiktheorie", B), p("Musiktheorie", M),
    p("Lehramt Musik", "Staatsexamen", specializations=["Gymnasium","Oberschule","Grundschule"]),
    p("Meisterklasse", "Meisterklassenexamen"),
],

"Palucca Hochschule für Tanz Dresden": [
    p("Tanz", BA, "6 semesters"),
    p("Choreografie", MA),
    p("Tanzpädagogik", MA),
    p("Dance Teacher (berufsbegleitend)", MA),
    p("Künstlerische Meisterklasse", "Meisterklassenexamen"),
],

"Robert Schumann Hochschule Düsseldorf": [
    p("Orchesterinstrumente", B), p("Orchesterinstrumente", M),
    p("Klavier", B), p("Klavier", M),
    p("Gesang", B), p("Gesang", M),
    p("Gitarre", B), p("Gitarre", M),
    p("Orgel", B), p("Orgel", M),
    p("Chorleitung", B), p("Chorleitung", M),
    p("Orchesterleitung", B), p("Orchesterleitung", M),
    p("Kirchenmusik", B), p("Kirchenmusik", M),
    p("Komposition", B), p("Komposition", M),
    p("Musik und Medien", B),
    p("Ton und Bild", B),
    p("Musikpädagogik", B), p("Musikpädagogik", M),
    p("Musiktheorie und Hörerziehung", B),
    p("Musikwissenschaft", BA), p("Musikwissenschaft", MA),
    p("Klang und Realität", M),
    p("Künstlerische Musikproduktion", M),
    p("Musikfilmregie", M),
    p("Orchesterpraxis", M),
    p("Liedgestaltung", M),
    p("Kammermusik", M, specializations=["Bläser-Kammermusik","Klavier-Kammermusik","Streicher-Kammermusik"]),
],

"Hochschule für Musik und Darstellende Kunst Frankfurt am Main": [
    p("Künstlerische Ausbildung Musik (KAM)", B),
    p("Künstlerische Ausbildung Musik (KAM)", M),
    p("Gesang", B),
    p("Gesang Musiktheater", M),
    p("Konzert (Gesang)", M),
    p("Komposition", B), p("Komposition", M),
    p("Kirchenmusik", B), p("Kirchenmusik", M),
    p("Historische Interpretationspraxis (HIP)", M),
    p("Kammermusik", M),
    p("Instrumentalpädagogik", M),
    p("Musikpädagogik", M),
    p("Bigband – Spielen, Schreiben, Leiten", M),
    p("IEMA CoMP: Contemporary Music Performance", M),
    p("Concert Performance – Kronberg Academy", B),
    p("Concert Performance – Kronberg Academy", M),
    p("Lehramt Musik", "Staatsexamen", specializations=[
        "Grundschulen (L1)","Haupt- und Realschulen (L2)","Gymnasien (L3)","Förderschulen (L5)"]),
    p("Schauspiel", BA),
    p("Regie", BA),
    p("Tanz", BA),
    p("Contemporary Dance Education", MA),
    p("Theater- und Orchestermanagement", MA),
    p("Konzertexamen", "Konzertexamen"),
],

"Hochschule für Musik Freiburg im Breisgau": [
    p("Musik", B, "8 semesters"),
    p("Musik", M),
    p("Kirchenmusik", B), p("Kirchenmusik", M),
    p("Lehramt Musik", "Lehramt"),
    p("Elementare Musikpädagogik", B),
    p("Konzertexamen / Meisterklasse", "Konzertexamen"),
],

"Evangelische Hochschule für Kirchenmusik": [
    p("Kirchenmusik", B),
    p("Kombistudium Kirchenmusik / Lehramt Musik an Gymnasien", B),
    p("Kirchenmusik", M),
    p("Chor- und Orchesterleitung", M),
    p("Kirchliche Popularmusik", M),
    p("Konzert- und Oratoriengesang", M),
    p("Künstlerisches Orgelspiel", M),
    p("Lehramt Musik", MED,
      description="Gemeinsamer Studiengang mit der Martin-Luther-Universität Halle-Wittenberg."),
],

"Hochschule für Kirchenmusik der Evangelischen Landeskirche in Baden": [
    p("Evangelische Kirchenmusik", B),
    p("Evangelische Kirchenmusik", M),
    p("Popularkirchenmusik", B),
    p("Popularkirchenmusik", M),
    p("Posaunenwart", B),
    p("Ergänzungsstudiengang für Schulmusiker*innen", "Zertifikat"),
],

"Hochschule für Musik Karlsruhe": [
    p("Musik", B),
    p("Musik", M),
    p("Künstlerisches Lehramt an Gymnasien (Schulmusik)", "Lehramt"),
    p("Solistenexamen (Konzertexamen)", "Konzertexamen"),
    p("Certificate of Advanced Studies", "Certificate of Advanced Studies"),
],

"Hochschule für Musik und Tanz Köln": [
    p("Holzbläser", B), p("Blechbläser", B), p("Blasinstrumente", M),
    p("Streichinstrumente", B), p("Streichinstrumente", M),
    p("Klavier", B), p("Klavier", M),
    p("Orgel", B), p("Orgel", M),
    p("Gitarre", B), p("Gitarre", M),
    p("Harfe", B), p("Harfe", M),
    p("Mandoline", B), p("Mandoline", M),
    p("Schlagzeug", B), p("Schlagzeug", M),
    p("Gesang", B),
    p("Gesang Lied/Konzert", M), p("Gesang Musiktheater", M),
    p("Chordirigieren", B), p("Dirigieren Chor", M),
    p("Dirigieren Orchester", M), p("Dirigieren Musiktheater", M),
    p("Orchesterdirigieren", B),
    p("Instrumentale Komposition", B), p("Instrumentale Komposition", M),
    p("Elektronische Komposition", B), p("Elektronische Komposition", M),
    p("Jazz/Pop", B), p("Jazz/Pop instrumental/vokal", M),
    p("Jazz-Komposition/Arrangement", M),
    p("Historische Instrumente", B),
    p("Historische Instrumente und Barockgesang", M),
    p("Elementare Musikpädagogik", B),
    p("Instrumental-/Gesangspädagogik", B),
    p("Musikpädagogik", M), p("Musikpädagogik", MA),
    p("Evangelische Kirchenmusik", B), p("Evangelische Kirchenmusik", M),
    p("Katholische Kirchenmusik", B), p("Katholische Kirchenmusik", M),
    p("Kammermusik", M),
    p("Liedgestaltung (Klavier)", M),
    p("Opernkorrepetition", M),
    p("Interpretation Neue Musik", M),
    p("Neue Klaviermusik", M),
    p("Orchesterspiel", M),
    p("Production", M),
    p("Musikwissenschaft", MA),
    p("Gender & Queer Studies", MA),
    p("Lehramt Musik", "Lehramt"),
    p("Konzertexamen", "Konzertexamen"),
    p("Tanz", BA),
    p("Tanzvermittlung", MA),
    p("Tanzwissenschaft", MA),
],

"Musikhochschule Lübeck": [
    p("Instrumental (Blasinstrumente)", B), p("Instrumental (Blasinstrumente / Schlagzeug)", M),
    p("Instrumental (Streichinstrumente / Harfe)", B), p("Instrumental (Streichinstrumente / Harfe)", M),
    p("Instrumental (Tasteninstrumente)", B), p("Instrumental (Tasteninstrumente)", M),
    p("Instrumental (Gitarre)", B), p("Instrumental (Gitarre)", M),
    p("Instrumental (Saxophon)", B), p("Instrumental (Saxophon)", M),
    p("Instrumental (Schlagzeug)", B),
    p("Instrumental (Orgel)", M),
    p("Vokal", B), p("Vokal", M),
    p("Komposition", B), p("Komposition", M),
    p("Kirchenmusik B", B), p("Kirchenmusik A", M),
    p("Musiktheorie / Gehörbildung", B), p("Musiktheorie", M),
    p("Instrumentale und elementare Musikpädagogik", B),
    p("Instrumental- und Gesangspädagogik", M),
    p("Kammermusik", M),
    p("Korrepetition", M),
    p("Musik Vermitteln (Gesang / Popgesang)", BA),
    p("Musik Vermitteln (Klavier)", BA),
    p("Musik Vermitteln (Sonstige Instrumente)", BA),
    p("MusikPlus – Grundschule", BA), p("MusikPlus – Grundschule", MED),
    p("Lehramt Gymnasium – Musik Vermitteln", MED),
    p("Lehramt Gymnasium (Umstieg)", MED),
    p("Lehramt Grundschule (Umstieg)", MED),
    p("Sound Arts and Creative Music Technology", M),
    p("Konzertexamen", "Konzertexamen"),
    p("Weiterbildung Darstellendes Spiel", "Certificate of Advanced Studies"),
],

"Staatliche Hochschule für Musik und Darstellende Kunst Mannheim": [
    p("Musik", B), p("Musik", M),
    p("Jazz / Popularmusik", B), p("Jazz / Popularmusik", M),
    p("Tanz / Tanzpädagogik", BA), p("Tanz / Tanzpädagogik", MA),
    p("Lehramt Musik an Gymnasien", "Bachelor"), p("Lehramt Musik an Gymnasien", "Master"),
    p("Solistische Ausbildung", "Konzertexamen"),
],

"Hochschule für Musik Nürnberg": [
    p("Künstlerischer Bachelor", B, specializations=[
        "Orchesterinstrumente","Tasteninstrumente","Zupfinstrumente","Gesang",
        "Blockflöte","Historische Instrumente / Alte Musik","Jazz","Dirigieren",
        "Komposition","Orgel","Schlagzeug"]),
    p("Künstlerisch-pädagogischer Bachelor", B, specializations=[
        "Elementare Musikpädagogik","Musikpädagogik","Instrumentalpädagogik"]),
    p("Künstlerischer Master", M),
    p("Musikwissenschaften", MA),
    p("Meisterklasse", "Meisterklassendiplom"),
],

"Hochschule für Katholische Kirchenmusik und Musikpädagogik": [
    p("Katholische Kirchenmusik", B, "8 semesters"),
    p("Katholische Kirchenmusik", M, "4 semesters"),
],

"Hochschule für Kirchenmusik der Diözese Rottenburg-Stuttgart": [
    p("Katholische Kirchenmusik", B),
    p("Katholische Kirchenmusik", M, "4 semesters"),
    p("Chorleitung", M),
    p("Gesang / Gesangspädagogik", M),
    p("Gregorianik / Deutscher Liturgiegesang", M),
    p("Orgelimprovisation / Liturgisches Orgelspiel", M),
    p("Orgelliteraturspiel", M),
    p("Zertifikat C", "Zertifikat"),
],

"Hochschule für Musik Saar": [
    p("Künstlerisches Profil Instrument", B),
    p("Künstlerisches Profil Gesang", B),
    p("Künstlerisches Profil Orchester- und Ensemblemusik", B),
    p("Künstlerisches Profil Jazz und Aktuelle Musik", B),
    p("Künstlerisches Profil Komposition", B),
    p("Künstlerisches Profil Dirigieren (Orchesterleitung)", B),
    p("Künstlerisches Profil Dirigieren (Chorleitung)", B),
    p("Kirchenmusik ev./kath.", B),
    p("Künstlerisch-pädagogisches Profil", B),
    p("Künstlerisch-pädagogisches Profil Musiktheorie", B),
    p("Elementare Musikpädagogik", B),
    p("Cultural Studies und Management", BA,
      description="In Kooperation mit der Universität des Saarlandes."),
    p("Künstlerisches Profil Instrument", M),
    p("Künstlerisches Profil Gesang", M),
    p("Künstlerisches Profil Orchesterinstrument (Orchesterakademie)", M),
    p("Künstlerisches Profil Kammermusik", M),
    p("Künstlerisches Profil Liedgestaltung", M),
    p("Künstlerisches Profil Improvisation für Tasteninstrumente", M),
    p("Künstlerisches Profil Instrumentalkorrepetition", M),
    p("Künstlerisches Profil Komposition", M),
    p("Künstlerisches Profil Neue Musik", M),
    p("Künstlerisches Profil Dirigieren Neue Musik", M),
    p("Künstlerisches Profil Dirigieren (Orchesterleitung)", M),
    p("Künstlerisches Profil Dirigieren (Chorleitung)", M),
    p("Künstlerisches Profil Jazz", M),
    p("Kirchenmusik kath./ev. A", M),
    p("Künstlerisch-pädagogisches Profil Gehörbildung", M),
    p("Künstlerisch-pädagogisches Profil Musiktheorie", M),
    p("Advanced Education in Music Pedagogy", MED),
    p("Q-Master Lehramt Musik", MED),
    p("Kulturmanagement", MA,
      description="In Kooperation mit der HTW Saar."),
],

"Staatliche Hochschule für Musik und Darstellende Kunst Stuttgart": [
    p("Musik", B, "8 semesters"),
    p("Musik", M, "4 semesters"),
    p("Kirchenmusik", B), p("Kirchenmusik", M),
    p("Schauspiel", BA, "8 semesters"),
    p("Figurentheater", BA, "8 semesters"),
    p("Sprechkunst / Sprecherziehung", BA, "8 semesters"),
    p("Sprechkunst", MA, "2 semesters", specializations=["Mediensprechen","Rhetorik","Sprechkunst"]),
    p("Oper", M),
    p("Lehramt Gymnasium mit dem Fach Musik", "Bachelor"),
    p("Lehramt Gymnasium mit dem Fach Musik", "Master"),
    p("Konzertexamen", "Konzertexamen"),
    p("Weiterbildungs-Master (berufsbegleitend)", M,
      specializations=["Blasorchesterleitung","Chordirigieren","Instrumental- und Gesangspädagogik"]),
],

"Staatliche Hochschule für Musik Trossingen": [
    p("Musik", B, specializations=[
        "Akkordeon","Alte Musik","Gesang","Gitarre","Klavier","Orgel",
        "Orchesterinstrumente","Schlagzeug","Komposition","Dirigieren"]),
    p("Musik", M),
    p("Musikdesign", B),
    p("Audio Experience Design", M),
    p("Creative Arts Practice", M),
    p("Rhythmik mit Elementarer Musikpädagogik", B),
    p("Musik und Bewegung", B),
],

"Hochschule für Kirchenmusik der Evangelischen Landeskirche in Württemberg": [
    p("Evangelische Kirchenmusik B", B),
    p("Evangelische Popular-Kirchenmusik", B),
    p("Evangelische Kirchenmusik A", M),
    p("Kirchliche Popularmusik", M),
    p("KA-Aufbaustudiengang Orgel", "Künstlerische Ausbildung"),
],

"Hochschule für Musik Franz Liszt Weimar": [
    p("Künstlerische Instrumentalausbildung", B, specializations=[
        "Violine","Viola","Violoncello","Kontrabass","Harfe","Gitarre","Flöte",
        "Oboe","Klarinette","Fagott","Horn","Trompete","Posaune","Tuba",
        "Schlagwerk","Klavier","Orgel","Akkordeon"]),
    p("Künstlerische Instrumentalausbildung", M),
    p("Gesang / Musiktheater", B), p("Gesang / Musiktheater", M),
    p("Jazz", B, specializations=[
        "Klavier (Jazz)","Gesang (Jazz)","Trompete (Jazz)","Posaune (Jazz)",
        "Saxophon (Jazz)","Klarinette (Jazz)","Flöte (Jazz)","Kontrabass (Jazz) / E-Bass",
        "Drumset (Jazz)","Elektrische Gitarre"]),
    p("Jazz", M),
    p("Alte Musik / Historische Instrumente", B, specializations=[
        "Barockvioline","Barockviola","Barockvioloncello","Viola da gamba",
        "Blockflöte","Cembalo","Historische Tasteninstrumente"]),
    p("Alte Musik / Historische Instrumente", M),
    p("Orchesterdirigieren", B), p("Orchesterdirigieren", M),
    p("Chordirigieren", B), p("Chordirigieren", M),
    p("Kirchenmusik", B), p("Kirchenmusik", M),
    p("Komposition", B), p("Komposition", M),
    p("Musiktheorie", B), p("Musiktheorie", M),
    p("Elementare Musikpädagogik / Rhythmik", B),
    p("Schulmusik (Lehramt an Gymnasien)", "Staatsexamen"),
    p("Musikwissenschaft", BA), p("Musikwissenschaft", MA),
    p("Kulturmanagement", MA),
    p("Liedgestaltung für Pianisten", M),
    p("Kammermusik", M),
    p("Opernkorrepetition", M),
],

"Hochschule für Kirchenmusik der Evangelischen Kirche von Westfalen": [
    p("Evangelische Kirchenmusik Klassisch", B),
    p("Evangelische Kirchenmusik Popular", B),
    p("Evangelische Kirchenmusik Klassisch", M),
    p("Evangelische Kirchenmusik Popular", M),
],

"Hochschule für Musik Würzburg": [
    p("Künstlerische Ausbildung", B, specializations=[
        "Akkordeon","Gesang","Gitarre","Klavier","Orgel","Orchesterinstrumente",
        "Dirigieren","Historische Instrumente"]),
    p("Künstlerische Ausbildung", M),
    p("Jazz", B), p("Jazz", M),
    p("Kirchenmusik (ev./kath.)", B),
    p("Elementare Musikpädagogik", B),
    p("Komposition", B),
    p("Komposition (auch mit neuen Medien)", M),
    p("Musiktheorie", B),
    p("Gesang (Konzert-/Operngesang)", M),
    p("Kammermusik", M),
    p("Chorleitung", M),
    p("Blasorchesterleitung", M),
    p("Künstlerisch-pädagogische Masterstudiengänge", M, specializations=[
        "Elementare Musikpädagogik","Vokale Musizierpraxis","Inklusive Musikpädagogik","Community Music"]),
    p("Lehramt Musik", "Lehramt"),
    p("Meisterklasse", "Meisterklassendiplom"),
],
}

data = json.loads(DATA.read_text())
unis = data["universities"]
added = 0
for name, programs in PROGRAMS.items():
    school = unis.get(name)
    if school is None:
        print(f"!! school not found in JSON: {name}")
        continue
    if school.get("programs"):
        print(f"-- skipping {name}: already has {len(school['programs'])} programs")
        continue
    school["programs"] = programs
    added += len(programs)
    print(f"OK {name}: {len(programs)} programs")

total = sum(len(u.get("programs") or []) for u in unis.values())
data.setdefault("statistics", {})["total_programs"] = total
data["statistics"]["last_updated"] = "2026-06-10"
DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
print(f"\nadded {added} programs; dataset total now {total}")
