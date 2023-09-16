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
    var release = new ExponentialCurve(1, 0, duration);
    for (var t = 0; t < duration; t += 1 / audioContext.sampleRate) {
        //fm.push(fmWarp(t, fmDepth, fmNote.Frequency)); //donk
        fm.push(fmDepth * (duration - t) / duration + baseNote.Frequency); //kick
    }
    oscilator.frequency.setValueCurveAtTime(fm, audioContext.currentTime, duration);
    var gain = [];
    for (var t = 0; t < release.Duration; t += 1 / audioContext.sampleRate) {
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
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
}());
var LinearCurve = /** @class */ (function () {
    function LinearCurve(startValue, endValue, duration) {
        this._startValue = startValue;
        this._endValue = endValue;
        this._duration = duration;
        this.Evaluate();
    }
    Object.defineProperty(LinearCurve.prototype, "_startX", {
        get: function () {
            return 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LinearCurve.prototype, "_endX", {
        get: function () {
            return 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LinearCurve.prototype, "Start", {
        get: function () {
            return this._startValue;
        },
        set: function (value) {
            this._startValue = value;
            this.Evaluate();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LinearCurve.prototype, "End", {
        get: function () {
            return this._endValue;
        },
        set: function (value) {
            this._endValue = value;
            this.Evaluate();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LinearCurve.prototype, "Duration", {
        get: function () {
            return this._duration;
        },
        set: function (value) {
            this._duration = value;
        },
        enumerable: false,
        configurable: true
    });
    LinearCurve.prototype.Evaluate = function () {
        this._slope = (this._endValue - this._startValue) / (this._endX - this._startX);
        this._gain = this._startValue - this._slope * this._startX;
    };
    LinearCurve.prototype.GetValue = function (t) {
        var actualT = t / this.Duration;
        return actualT * this._slope + this._gain;
    };
    return LinearCurve;
}());
var ExponentialCurve = /** @class */ (function () {
    function ExponentialCurve(startValue, endValue, duration) {
        this._startValue = startValue;
        this._endValue = endValue;
        this._duration = duration;
        this.Evaluate();
    }
    Object.defineProperty(ExponentialCurve.prototype, "_startX", {
        get: function () {
            return 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ExponentialCurve.prototype, "_endX", {
        get: function () {
            return 1;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ExponentialCurve.prototype, "Start", {
        get: function () {
            return this._startValue;
        },
        set: function (value) {
            this._startValue = value;
            this.Evaluate();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ExponentialCurve.prototype, "End", {
        get: function () {
            return this._endValue;
        },
        set: function (value) {
            this._endValue = value;
            this.Evaluate();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ExponentialCurve.prototype, "Duration", {
        get: function () {
            return this._duration;
        },
        set: function (value) {
            this._duration = value;
        },
        enumerable: false,
        configurable: true
    });
    ExponentialCurve.prototype.Evaluate = function () {
        if (this._startValue < this._endValue) {
            this._slope = this._slope = Math.exp(Math.log(this._endValue - this._startValue + 1) / (this._endX - this._startX));
        }
        else {
            this._slope = Math.exp(Math.log(this._startValue - this._endValue + 1) / (this._startX - this._endX));
        }
    };
    ExponentialCurve.prototype.GetValue = function (t) {
        var actualT = t / this.Duration;
        if (this._startValue < this._endValue) {
            return Math.pow(this._slope, actualT - this._startX) - 1 + this._startValue;
        }
        else {
            return Math.pow(this._slope, actualT - this._endX) - 1 + this._endValue;
        }
    };
    return ExponentialCurve;
}());
//class CurveComposition implements Curve
//{
//}
var Modulation = /** @class */ (function () {
    function Modulation(curve, amount, parent) {
        this._curve = curve;
        this._amount = amount;
        this._parent = parent;
    }
    Object.defineProperty(Modulation.prototype, "Amount", {
        get: function () {
            return this._amount;
        },
        set: function (value) {
            this._amount = value;
        },
        enumerable: false,
        configurable: true
    });
    Modulation.prototype.GetValue = function (t) {
        return this._curve.GetValue(t) * this._amount / 100 * this._parent.Scope;
    };
    return Modulation;
}());
var Knob = /** @class */ (function () {
    function Knob() {
    }
    Object.defineProperty(Knob.prototype, "Scope", {
        get: function () {
            return this._max - this._min;
        },
        enumerable: false,
        configurable: true
    });
    Knob.prototype.Modulate = function (curve, amount) {
        var modulation = new Modulation(curve, amount, this);
        this._modulations.push(modulation);
        return modulation;
    };
    return Knob;
}());
//# sourceMappingURL=app.js.map