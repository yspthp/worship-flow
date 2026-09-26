"""Compile the supplied score; never substitute the former AR/MIDI arrangement.
Run: python tools/compile_building_call.py
The original MusicXML stays byte-for-byte unchanged for OSMD rendering.
"""
import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/scores/building-call-66bpm-20260926.musicxml'
OUTPUT = SOURCE.with_suffix('.json')
# This file has visual drum positions but no per-note instrument IDs.
# Use the conventions of its originating build_musicxml.py: F4=closed hat,
# G5=ride, C5=kick, D5=quiet cross-stick, E5/F5=snare. Do not apply a
# generic staff-position map (or silently turn every drum into a hi-hat).
DRUM_MAP = {'F4': 42, 'G5': 51, 'C5': 36, 'D5': 37, 'E5': 38, 'F5': 38}
DRUM_NAMES = {36: '大鼓', 37: '小鼓邊擊', 38: '小鼓', 42: '閉合 Hi-hat', 51: 'Ride'}
PITCH = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

def chord_name(h):
    accidental = lambda value: {-2: '𝄫', -1: '♭', 0: '', 1: '♯', 2: '𝄪'}[int(value)]
    name = h.findtext('root/root-step', '') + accidental(h.findtext('root/root-alter', '0'))
    kind = h.findtext('kind', 'major')
    name += {'major': '', 'minor': 'm', 'dominant': '7', 'major-seventh': 'maj7',
             'minor-seventh': 'm7', 'suspended-fourth': 'sus4', 'suspended-second': 'sus2',
             'diminished': 'dim', 'augmented': 'aug'}.get(kind, ' ' + kind)
    if h.find('bass') is not None:
        name += '/' + h.findtext('bass/bass-step') + accidental(h.findtext('bass/bass-alter', '0'))
    return name

def compile_score(check=False):
    root = ET.fromstring(SOURCE.read_bytes())
    parts = root.findall('part')
    assert len(parts) == 3
    # This particular revision has a constant 66 BPM, 4/4, no repeat/tie encoding.
    # Fail on future incompatible scores rather than silently approximating them.
    assert not root.findall('.//repeat') and not root.findall('.//tie')
    assert not root.findall('.//grace')
    bpms = {float(n.text) for n in root.findall('.//metronome/per-minute')}
    assert bpms == {66.0}, bpms
    assert all(n.get('tempo') in (None, '66') for n in root.findall('.//sound'))
    bpm = 66
    seconds_per_quarter = 60 / bpm
    measures = []
    markers = []
    quarter = 0
    beats, beat_type = 4, 4
    for m in parts[0].findall('measure'):
        no = int(m.get('number'))
        beats = int(m.findtext('attributes/time/beats', str(beats)))
        beat_type = int(m.findtext('attributes/time/beat-type', str(beat_type)))
        assert (beats, beat_type) == (4, 4)
        measures.append({'number': no, 'q': quarter, 'sec': quarter * seconds_per_quarter,
                         'endSec': (quarter + 4) * seconds_per_quarter})
        for mark in m.findall('direction/direction-type/rehearsal'):
            markers.append((no, mark.text.strip('[]')))
        quarter += 4
    assert [m['number'] for m in measures] == list(range(1, 142))
    sections = [[f'{chr(65+i)} · {label}', start, markers[i+1][0]-1 if i+1 < len(markers) else len(measures)]
                for i, (start, label) in enumerate(markers)]
    events, measure_info = [], {}
    programs = [int(p.findtext('midi-instrument/midi-program', '1')) - 1
                for p in root.findall('part-list/score-part')]
    for pi, part in enumerate(parts):
        divisions = 4
        assert len(part.findall('measure')) == len(measures)
        for m in part.findall('measure'):
            no = int(m.get('number'))
            divisions = int(m.findtext('attributes/divisions', str(divisions)))
            cursor, last, max_end = 0, 0, 0
            measure_events = []
            for n in m:
                if n.tag in ('backup', 'forward'):
                    cursor += (-1 if n.tag == 'backup' else 1) * float(n.findtext('duration')) / divisions
                    assert cursor >= 0, (pi, no, cursor)
                elif n.tag == 'note':
                    duration = float(n.findtext('duration', '0')) / divisions
                    assert duration > 0
                    is_chord = n.find('chord') is not None
                    onset = last if is_chord else cursor
                    max_end = max(max_end, onset + duration)
                    if n.find('rest') is None:
                        if pi == 2:
                            position = n.findtext('unpitched/display-step') + n.findtext('unpitched/display-octave')
                            midi = DRUM_MAP[position]
                        else:
                            midi = (int(n.findtext('pitch/octave')) + 1) * 12 + PITCH[n.findtext('pitch/step')] + int(n.findtext('pitch/alter', '0'))
                        q = measures[no-1]['q'] + onset
                        # No dynamics are encoded in this source; use the original
                        # companion converter's fixed 88/72/78 velocity defaults.
                        event = {'q': q, 'dur': duration, 'midi': midi, 'part': pi, 'measure': no,
                                 'velocity': [88, 72, 78][pi], 'sec': q * seconds_per_quarter,
                                 'length': duration * seconds_per_quarter, 'staff': n.findtext('staff', '1')}
                        events.append(event)
                        measure_events.append(event)
                    if not is_chord:
                        last = cursor
                        cursor += duration
            assert max_end <= 4, (pi, no, max_end)
            info = measure_info.setdefault(str(no), {})
            harmonies = list(dict.fromkeys(chord_name(h) for h in m.findall('harmony')))
            harmony = '和弦：' + ' → '.join(harmonies) + '。' if harmonies else ''
            if pi == 0:
                right = sum(e['staff'] == '1' for e in measure_events)
                info['piano'] = harmony + ('右手按譜帶旋律，左手按低音／和弦托底；踏板隨和聲更換。' if right else '右手休息，保留左手和聲，讓樂句呼吸。')
            elif pi == 1:
                info['organ'] = harmony + ('以 Synth Strings 1 托住長音，按譜面時值換和弦，避免蓋過鋼琴。' if measure_events else '本小節休息，等待下一個入點。')
            else:
                names = [DRUM_NAMES[n] for n in sorted({e['midi'] for e in measure_events})]
                info['drums'] = ('本小節：' + '、'.join(names) + '。' if names else '本小節休息。')
                if any(e['dur'] == .25 for e in measure_events):
                    info['drums'] += '含十六分音符過門；保持拍點，勿搶拍。'
                elif 51 in {e['midi'] for e in measure_events}:
                    info['drums'] += '以八分音符 Ride 托住段落，配合大鼓與小鼓。'
                elif 42 in {e['midi'] for e in measure_events}:
                    info['drums'] += '保持八分音符 Hi-hat，按譜面配合重拍。'
    events.sort(key=lambda e: (e['sec'], e['part'], e['midi']))
    # These are rehearsal suggestions, not dynamics encoded in the source.
    for index, (label, start, end) in enumerate(sections):
        if 'Intro' in label:
            suggestion = '先給清楚預備拍，讓鋼琴與弦樂建立空間。'
        elif 'Instrumental' in label:
            suggestion = '以器樂銜接，提示人聲下一次進入，勿提早催拍。'
        elif 'Pre-Chorus' in label:
            suggestion = '維持穩定拍點，留意鼓組入點，預備下一段銜接。'
        elif 'Chorus' in label:
            suggestion = '提示旋律與和聲平衡，保持拍點，不自行加快或加鼓件。'
        elif 'Coda' in label:
            suggestion = '提示全團準備收束；依譜面時值演奏，不自行加入漸慢。'
        else:
            suggestion = '讓歌詞與旋律清楚，鋼琴與弦樂留出人聲空間。'
        for number in range(start, end + 1):
            next_section = sections[index + 1] if index + 1 < len(sections) else None
            cue = (f'下一段 {next_section[0]} 從第 {next_section[1]} 小節開始。'
                   if next_section else f'全曲於第 {end} 小節結束，依最後音符時值一起收音。')
            measure_info[str(number)]['leader'] = f'司樂建議（非原譜力度記號）：{suggestion}{cue}'
    result = {'source': SOURCE.name, 'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              'title': root.findtext('work/work-title'), 'bpm': bpm, 'key': 'G', 'timeSignature': '4/4',
              'measureCount': len(measures), 'songSeconds': quarter * seconds_per_quarter,
              'sections': sections, 'measures': measures, 'programs': programs,
              'eventCounts': [sum(e['part'] == p for e in events) for p in range(3)],
              'events': events, 'measureInfo': measure_info, 'lyrics': [],
              'playbackNotes': '播放依新版 MusicXML 音符與時值；原譜無力度記號，採固定力度 88/72/78。鼓件依來源產生器對應：F4=Hi-hat、G5=Ride、C5=大鼓、D5=邊擊、E5/F5=小鼓；不沿用舊 MIDI 轉換器將未知鼓件一律映射為 Hi-hat 的後備行為。司樂建議不會自動改變播放力度或速度。'}
    assert root.findtext('part/measure/attributes/key/fifths') == '1'
    serialized = (json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')
    if check:
        if not OUTPUT.exists() or OUTPUT.read_bytes() != serialized:
            raise SystemExit('Compiled score is stale; run python tools/compile_building_call.py')
    else:
        OUTPUT.write_bytes(serialized)
    print(json.dumps({k: result[k] for k in ('title', 'bpm', 'key', 'measureCount', 'songSeconds', 'eventCounts', 'sections')}, ensure_ascii=False))
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify generated data without writing files')
    compile_score(check=parser.parse_args().check)
