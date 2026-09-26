"""Independent, text-only MusicXML-to-playback event audit (standard library only)."""
import hashlib
import json
from collections import Counter
from fractions import Fraction
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/scores/building-call-66bpm-20260926.musicxml'
raw = SOURCE.read_bytes()
score = ET.fromstring(raw)
data = json.loads(SOURCE.with_suffix('.json').read_text(encoding='utf-8'))
assert data['sourceSha256'] == hashlib.sha256(raw).hexdigest()
# Pin the actual user attachment, not merely a mutually consistent XML/JSON pair.
assert data['sourceSha256'] == '3e70ed5925ae23d623334d946634b9d3640be16cc279d50d4938cb9c3561af70'
assert {float(n.text) for n in score.findall('.//metronome/per-minute')} == {data['bpm']}
assert data['bpm'] == 66 and data['measureCount'] == 141
assert len(data['sections']) == 14
pitch_classes = dict(zip('CDEFGAB', [0, 2, 4, 5, 7, 9, 11]))
drums = {'F4': 42, 'G5': 51, 'C5': 36, 'D5': 37, 'E5': 38, 'F5': 38}
expected = Counter()
for part_index, part in enumerate(score.findall('part')):
    measures = part.findall('measure')
    assert [int(m.get('number')) for m in measures] == list(range(1, 142))
    divisions = None
    for measure in measures:
        number = int(measure.get('number'))
        value = measure.findtext('attributes/divisions')
        if value is not None:
            divisions = int(value)
        cursor, previous = Fraction(0), Fraction(0)
        for node in measure:
            if node.tag in ('backup', 'forward'):
                cursor += Fraction(int(node.findtext('duration')), divisions) * (-1 if node.tag == 'backup' else 1)
            elif node.tag == 'note':
                duration = Fraction(int(node.findtext('duration')), divisions)
                onset = previous if node.find('chord') is not None else cursor
                if node.find('rest') is None:
                    if node.find('unpitched') is not None:
                        midi = drums[node.findtext('unpitched/display-step') + node.findtext('unpitched/display-octave')]
                    else:
                        midi = 12 * (int(node.findtext('pitch/octave')) + 1)
                        midi += pitch_classes[node.findtext('pitch/step')] + int(node.findtext('pitch/alter', '0'))
                    expected[(part_index, number, float((number - 1) * 4 + onset),
                              float(duration), midi, node.findtext('staff', '1'))] += 1
                if node.find('chord') is None:
                    previous = cursor
                    cursor += duration
                assert 0 <= onset < 4 and onset + duration <= 4
        # The attachment represents silent drum measures as empty measures,
        # not whole-measure rest notes. They still occupy four beats.
        assert cursor == (4 if measure.findall('note') else 0), (part_index, number, cursor)
actual = Counter((e['part'], e['measure'], e['q'], e['dur'], e['midi'], e['staff']) for e in data['events'])
assert actual == expected, (expected - actual, actual - expected)
for event in data['events']:
    assert abs(event['sec'] - event['q'] * 60 / data['bpm']) < 1e-9
    assert abs(event['length'] - event['dur'] * 60 / data['bpm']) < 1e-9
assert data['eventCounts'] == [1656, 546, 1632]
print('PASS: attachment SHA-256; independent XML audit of all 3834 pitches/onsets/durations/staves; 423 part-measures including silent drums.')
