"""Site catalog for historical reconstruction galleries."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Site:
    slug: str
    name: str
    region: str
    blurb: str


SITES: list[Site] = [
    Site("great-pyramid-of-giza", "Great Pyramid of Giza", "Egypt", "Old Kingdom pyramid complex at Giza."),
    Site("hanging-gardens-of-babylon", "Hanging Gardens of Babylon", "Mesopotamia", "Legendary terraced gardens of ancient Babylon."),
    Site("statue-of-zeus-at-olympia", "Statue of Zeus at Olympia", "Greece", "Giant seated statue in the sanctuary at Olympia."),
    Site("temple-of-artemis-at-ephesus", "Temple of Artemis at Ephesus", "Turkey", "Huge Ionic temple dedicated to Artemis."),
    Site("mausoleum-at-halicarnassus", "Mausoleum at Halicarnassus", "Turkey", "Grand tomb built for Mausolus."),
    Site("colossus-of-rhodes", "Colossus of Rhodes", "Greece", "Bronze statue of Helios at the harbor of Rhodes."),
    Site("lighthouse-of-alexandria", "Lighthouse of Alexandria", "Egypt", "Pharos lighthouse that guided ships into Alexandria."),
    Site("stonehenge", "Stonehenge", "United Kingdom", "Neolithic stone circle on Salisbury Plain."),
    Site("avebury-henge", "Avebury Henge", "United Kingdom", "Massive Neolithic henge with stone circles."),
    Site("skara-brae", "Skara Brae", "United Kingdom", "Neolithic village in Orkney."),
    Site("hadrians-wall", "Hadrian's Wall", "United Kingdom", "Roman frontier wall across northern Britain."),
    Site("roman-colosseum", "Roman Colosseum", "Italy", "Flavian amphitheater used for public spectacles."),
    Site("roman-forum", "Roman Forum", "Italy", "Civic and religious center of ancient Rome."),
    Site("pompeii", "Pompeii", "Italy", "Roman city buried by the eruption of Vesuvius."),
    Site("pantheon-rome", "Pantheon (Rome)", "Italy", "Roman temple and later church with a giant dome."),
    Site("circus-maximus", "Circus Maximus", "Italy", "Large Roman chariot-racing stadium."),
    Site("acropolis-of-athens", "Acropolis of Athens", "Greece", "Fortified hill with major classical temples."),
    Site("parthenon", "Parthenon", "Greece", "Temple of Athena on the Athenian Acropolis."),
    Site("palace-of-knossos", "Palace of Knossos", "Greece", "Minoan palace complex on Crete."),
    Site("akrotiri-thera", "Akrotiri (Thera)", "Greece", "Bronze Age town buried by volcanic ash."),
    Site("troy", "Troy", "Turkey", "Layered Bronze Age and classical city site."),
    Site("mycenae", "Mycenae", "Greece", "Citadel of the Mycenaean civilization."),
    Site("delphi-sanctuary", "Delphi Sanctuary", "Greece", "Pan-Hellenic sanctuary of Apollo."),
    Site("theatre-of-epidaurus", "Theatre of Epidaurus", "Greece", "Famous ancient Greek theater."),
    Site("pergamon-acropolis", "Pergamon Acropolis", "Turkey", "Hellenistic and Roman hilltop city complex."),
    Site("carthage", "Carthage", "Tunisia", "Phoenician and Punic city-state near modern Tunis."),
    Site("leptis-magna", "Leptis Magna", "Libya", "Major Roman city on North Africa's coast."),
    Site("palmyra", "Palmyra", "Syria", "Oasis city with Roman-period colonnades and temples."),
    Site("jerash-gerasa", "Jerash (Gerasa)", "Jordan", "Well-preserved Greco-Roman city."),
    Site("petra", "Petra", "Jordan", "Nabataean city carved into rose-red rock."),
    Site("persepolis", "Persepolis", "Iran", "Ceremonial capital of the Achaemenid Empire."),
    Site("ziggurat-of-ur", "Ziggurat of Ur", "Iraq", "Monumental stepped temple platform at Ur."),
    Site("babylon", "Babylon", "Iraq", "Ancient Mesopotamian imperial city."),
    Site("memphis-ancient-egypt", "Memphis (Ancient Egypt)", "Egypt", "Ancient capital near Saqqara and Giza."),
    Site("karnak-temple", "Karnak Temple", "Egypt", "Vast temple complex at Thebes."),
    Site("luxor-temple", "Luxor Temple", "Egypt", "New Kingdom temple in ancient Thebes."),
    Site("abu-simbel", "Abu Simbel", "Egypt", "Rock-cut temples of Ramesses II."),
    Site("saqqara-necropolis", "Saqqara Necropolis", "Egypt", "Burial complex including the Step Pyramid."),
    Site("great-zimbabwe", "Great Zimbabwe", "Zimbabwe", "Stone-built medieval city of southern Africa."),
    Site("aksum-obelisks", "Aksum Obelisks", "Ethiopia", "Monumental stelae from the Kingdom of Aksum."),
    Site("lalibela-churches", "Lalibela Churches", "Ethiopia", "Rock-hewn medieval churches."),
    Site("mohenjo-daro", "Mohenjo-daro", "Pakistan", "Major Indus Valley urban center."),
    Site("harappa", "Harappa", "Pakistan", "Key city of the Indus civilization."),
    Site("nalanda-mahavihara", "Nalanda Mahavihara", "India", "Major Buddhist monastic university complex."),
    Site("sigiriya", "Sigiriya", "Sri Lanka", "Rock fortress and palace complex."),
    Site("borobudur", "Borobudur", "Indonesia", "Large Buddhist monument with terraces and stupas."),
    Site("prambanan", "Prambanan", "Indonesia", "Hindu temple complex in Central Java."),
    Site("angkor-wat", "Angkor Wat", "Cambodia", "Vast Khmer temple complex."),
    Site("angkor-thom", "Angkor Thom", "Cambodia", "Khmer walled city including Bayon."),
    Site("bagan", "Bagan", "Myanmar", "Plain with thousands of historic Buddhist monuments."),
    Site("ayutthaya", "Ayutthaya", "Thailand", "Former Siamese capital and temple city."),
    Site("sanchi-stupa", "Sanchi Stupa", "India", "Ancient Buddhist stupa complex."),
    Site("terracotta-army-mausoleum", "Terracotta Army Mausoleum", "China", "Mausoleum complex of Qin Shi Huang."),
    Site("machu-picchu", "Machu Picchu", "Peru", "Inca mountain citadel."),
    Site("cusco-inca-capital", "Cusco (Inca Capital)", "Peru", "Historic capital of the Inca Empire."),
    Site("teotihuacan", "Teotihuacan", "Mexico", "Planned ancient city with pyramids."),
    Site("chichen-itza", "Chichen Itza", "Mexico", "Maya city with temples and observatories."),
    Site("tulum", "Tulum", "Mexico", "Walled Maya coastal city."),
    Site("palenque", "Palenque", "Mexico", "Classic Maya city in Chiapas."),
    Site("tikal", "Tikal", "Guatemala", "Major Maya city with towering temples."),
    Site("copan", "Copan", "Honduras", "Maya city known for carved monuments."),
    Site("mesa-verde-cliff-palace", "Mesa Verde Cliff Palace", "USA", "Ancestral Pueblo cliff dwellings."),
    Site("cahokia-mounds", "Cahokia Mounds", "USA", "Mississippian urban and ceremonial center."),
    Site("chan-chan", "Chan Chan", "Peru", "Adobe capital of the Chimu kingdom."),
]


if len(SITES) != 64:
    raise RuntimeError(f"Expected 64 sites, found {len(SITES)}")


def slugify(name: str) -> str:
    text = name.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")
