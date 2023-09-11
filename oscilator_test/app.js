window.onclick = function () {
    var audioContext = new AudioContext();
    var baseNote = Note.Base.Transpose(-5, 0);
    var fmNote = baseNote.Transpose(0, 2);
    var oscilator = audioContext.createOscillator();
    var volume = audioContext.createGain();
    var fmDepth = 300;
    oscilator.frequency.setValueAtTime(baseNote.Frequency, audioContext.currentTime);
    oscilator.type = "sine";
    function fmWarp(t, depth, frequency) {
        return baseNote.Frequency + Math.sin(t * frequency * Math.PI) * depth;
    }
    var fm = [];
    var duration = 10;
    for (var t = 0; t < duration; t += 1 / audioContext.sampleRate) {
        fm.push(fmWarp(t, fmDepth, fmNote.Frequency));
    }
    oscilator.frequency.setValueCurveAtTime(fm, audioContext.currentTime, duration);
    var gain = [];
    var gainDuration = 0.5;
    var decreaseRate = 0.001;
    for (var t = 0; t < gainDuration; t += 1 / audioContext.sampleRate) {
        gain.push((Math.pow(decreaseRate, t / gainDuration) - decreaseRate) * (1 + decreaseRate));
    }
    volume.gain.value;
    volume.gain.setValueCurveAtTime(gain, audioContext.currentTime, gainDuration);
    oscilator.connect(volume);
    volume.connect(audioContext.destination);
    oscilator.start();
};
var KeysScale;
(function (KeysScale) {
    KeysScale[KeysScale["A"] = 0] = "A";
    KeysScale[KeysScale["A#"] = 1] = "A#";
    KeysScale[KeysScale["B"] = 2] = "B";
    KeysScale[KeysScale["C"] = 3] = "C";
    KeysScale[KeysScale["C#"] = 4] = "C#";
    KeysScale[KeysScale["D"] = 5] = "D";
    KeysScale[KeysScale["D#"] = 6] = "D#";
    KeysScale[KeysScale["E"] = 7] = "E";
    KeysScale[KeysScale["F"] = 8] = "F";
    KeysScale[KeysScale["F#"] = 9] = "F#";
    KeysScale[KeysScale["G"] = 10] = "G";
    KeysScale[KeysScale["G#"] = 11] = "G#";
})(KeysScale || (KeysScale = {}));
var Settings = /** @class */ (function () {
    function Settings() {
    }
    Object.defineProperty(Settings, "OctaveLength", {
        get: function () {
            return 12;
        },
        enumerable: false,
        configurable: true
    });
    return Settings;
}());
var Note = /** @class */ (function () {
    function Note(key, octave, frequency) {
        this._key = key;
        this._octave = octave;
        this._frequency = frequency;
    }
    Object.defineProperty(Note.prototype, "Key", {
        get: function () {
            return this._key;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Note.prototype, "Octave", {
        get: function () {
            return this._octave;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Note.prototype, "Frequency", {
        get: function () {
            return this._frequency;
        },
        enumerable: false,
        configurable: true
    });
    Note.prototype.Transpose = function (keys, octaves) {
        var key = (keys + this.Key) % Settings.OctaveLength;
        var octave = (octaves + this.Octave);
        var transposeLength = keys + octaves * Settings.OctaveLength;
        var frequency = this.Frequency * Math.pow(2, transposeLength / 12);
        return new Note(key, octave, frequency);
    };
    Note.Base = new Note(KeysScale.A, 0, 55);
    return Note;
}());
//# sourceMappingURL=app.js.map