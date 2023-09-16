window.onclick = function () {
    var audioContext = new AudioContext();
    var baseNote = Note.Base.Transpose((Math.random() - 0.5) * 12, 0);
    var fmNote = baseNote.Transpose(0, 2);
    var oscilator = audioContext.createOscillator();
    var volume = audioContext.createGain();
    var fmDepth = 200;
    oscilator.frequency.setValueAtTime(baseNote.Frequency, audioContext.currentTime);
    oscilator.type = "sine";
    function fmWarp(t, depth, frequency) {
        return baseNote.Frequency + Math.sin(t * frequency * Math.PI) * depth;
    }
    var fm = [];
    var duration = 0.3;
    var release = new ExponentialCurve(new DOMPoint(0, 1), new DOMPoint(duration, 0));
    for (var t = 0; t < duration; t += 1 / audioContext.sampleRate) {
        fm.push(fmWarp(t, fmDepth, fmNote.Frequency)); //donk
        //fm.push(fmDepth * (duration - t) / duration + baseNote.Frequency); //kick
    }
    oscilator.frequency.setValueCurveAtTime(fm, audioContext.currentTime, duration);
    var gain = [];
    for (var t = 0; release.IsInDomain(t); t += 1 / audioContext.sampleRate) {
        gain.push(release.GetValue(t));
    }
    volume.gain.setValueCurveAtTime(gain, audioContext.currentTime, duration);
    var analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    oscilator.connect(volume);
    volume.connect(analyser);
    analyser.connect(audioContext.destination);
    oscilator.start();
    var cnvs = document.getElementById("cnvs");
    var ctx = cnvs.getContext("2d");
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.fillRect(0, 0, 1920, 1080);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgb(0, 0, 0)";
        ctx.beginPath();
        var sliceWidth = (1920 * 1.0) / bufferLength;
        var x = 0;
        for (var i = 0; i < bufferLength; i++) {
            var v = dataArray[i] / 128.0;
            var y = (v * 1080) / 2;
            if (i === 0) {
                ctx.moveTo(x, y);
            }
            else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        ctx.lineTo(cnvs.width, cnvs.height / 2);
        ctx.stroke();
    }
    draw();
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
        if (octaves === void 0) { octaves = 0; }
        var key = (keys + this.Key) % Settings.OctaveLength;
        var octave = (octaves + this.Octave);
        var transposeLength = keys + octaves * Settings.OctaveLength;
        var frequency = this.Frequency * Math.pow(2, transposeLength / 12);
        return new Note(key, octave, frequency);
    };
    Note.Base = new Note(KeysScale.A, 0, 55);
    return Note;
}());
var LinearCurve = /** @class */ (function () {
    function LinearCurve(start, end) {
        this._start = start;
        this._end = end;
        this.Evaluate();
    }
    Object.defineProperty(LinearCurve.prototype, "Start", {
        get: function () {
            return this._start;
        },
        set: function (value) {
            this._start = value;
            this.Evaluate();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LinearCurve.prototype, "End", {
        get: function () {
            return this._end;
        },
        set: function (value) {
            this._end = value;
            this.Evaluate();
        },
        enumerable: false,
        configurable: true
    });
    LinearCurve.prototype.Evaluate = function () {
        this._slope = (this._end.y - this._start.y) / (this._end.x - this._start.x);
        this._gain = this._start.y - this._slope * this._start.x;
    };
    LinearCurve.prototype.IsInDomain = function (t) {
        return t >= this._start.x && t < this._end.x;
    };
    LinearCurve.prototype.GetValue = function (t) {
        return t * this._slope + this._gain;
    };
    return LinearCurve;
}());
var ExponentialCurve = /** @class */ (function () {
    function ExponentialCurve(start, end) {
        this._start = start;
        this._end = end;
        this.Evaluate();
    }
    Object.defineProperty(ExponentialCurve.prototype, "Start", {
        get: function () {
            return this._start;
        },
        set: function (value) {
            this._start = value;
            this.Evaluate();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ExponentialCurve.prototype, "End", {
        get: function () {
            return this._end;
        },
        set: function (value) {
            this._end = value;
            this.Evaluate();
        },
        enumerable: false,
        configurable: true
    });
    ExponentialCurve.prototype.Evaluate = function () {
        if (this._start.y < this._end.y) {
            this._slope = this._slope = Math.exp(Math.log(this._end.y - this._start.y + 1) / (this._end.x - this._start.x));
        }
        else {
            this._slope = Math.exp(Math.log(this._start.y - this._end.y + 1) / (this._start.x - this._end.x));
        }
    };
    ExponentialCurve.prototype.IsInDomain = function (t) {
        return t >= this._start.x && t < this._end.x;
    };
    ExponentialCurve.prototype.GetValue = function (t) {
        if (this._start.y < this._end.y) {
            return Math.pow(this._slope, t - this._start.x) - 1 + this._start.y;
        }
        else {
            return Math.pow(this._slope, t - this._end.x) - 1 + this._end.y;
        }
    };
    return ExponentialCurve;
}());
//# sourceMappingURL=app.js.map