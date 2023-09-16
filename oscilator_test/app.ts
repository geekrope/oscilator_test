window.onclick = () =>
{
	const audioContext = new AudioContext();
	const baseNote = Note.Base.Transpose((Math.random() - 0.5) * 12, 0);
	const fmNote = baseNote.Transpose(0, 2);
	const oscilator = audioContext.createOscillator();
	const volume = audioContext.createGain();
	let fmDepth = 200;

	oscilator.frequency.setValueAtTime(baseNote.Frequency, audioContext.currentTime);
	oscilator.type = "sine";

	function fmWarp(t: number, depth: number, frequency: number)
	{
		return baseNote.Frequency + Math.sin(t * frequency * Math.PI) * depth;
	}

	const fm = [];
	const duration = 0.3;

	var release = new ExponentialCurve(1, 0, duration);

	for (let t = 0; t < duration; t += 1 / audioContext.sampleRate)
	{
		//fm.push(fmWarp(t, fmDepth, fmNote.Frequency)); //donk
		fm.push(fmDepth * (duration - t) / duration + baseNote.Frequency); //kick
	}

	oscilator.frequency.setValueCurveAtTime(fm, audioContext.currentTime, duration);

	const gain = [];

	for (let t = 0; t < release.Duration; t += 1 / audioContext.sampleRate)
	{
		gain.push(release.GetValue(t));
	}

	volume.gain.setValueCurveAtTime(gain, audioContext.currentTime, duration);

	const analyser = audioContext.createAnalyser();
	analyser.fftSize = 2048;

	oscilator.connect(volume);
	volume.connect(analyser);
	analyser.connect(audioContext.destination);
	oscilator.start();

	var cnvs = <HTMLCanvasElement>document.getElementById("cnvs");
	var ctx = cnvs.getContext("2d");

	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);

	function draw()
	{
		requestAnimationFrame(draw);

		analyser.getByteTimeDomainData(dataArray);

		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillRect(0, 0, 1920, 1080);

		ctx.lineWidth = 2;
		ctx.strokeStyle = "rgb(0, 0, 0)";

		ctx.beginPath();

		const sliceWidth = (1920 * 1.0) / bufferLength;
		let x = 0;

		for (let i = 0; i < bufferLength; i++)
		{
			const v = dataArray[i] / 128.0;
			const y = (v * 1080) / 2;

			if (i === 0)
			{
				ctx.moveTo(x, y);
			} else
			{
				ctx.lineTo(x, y);
			}

			x += sliceWidth;
		}

		ctx.lineTo(cnvs.width, cnvs.height / 2);
		ctx.stroke();
	}

	draw();
}

enum KeysScale
{
	"A" = 0,
	"A#" = 1,
	"B" = 2,
	"C" = 3,
	"C#" = 4,
	"D" = 5,
	"D#" = 6,
	"E" = 7,
	"F" = 8,
	"F#" = 9,
	"G" = 10,
	"G#" = 11
}

class Settings
{
	public static get OctaveLength(): number
	{
		return 12;
	}
}

class Note
{
	private _key: KeysScale;
	private _octave: number;
	private _frequency: number;

	public static Base = new Note(KeysScale.A, 0, 55);

	public get Key()
	{
		return this._key;
	}
	public get Octave()
	{
		return this._octave;
	}
	public get Frequency()
	{
		return this._frequency;
	}

	public Transpose(keys: number): Note;
	public Transpose(keys: number, octaves: number): Note;
	public Transpose(keys: number, octaves: number = 0): Note
	{
		const key = (keys + this.Key) % Settings.OctaveLength as KeysScale;
		const octave = (octaves + this.Octave);
		const transposeLength = keys + octaves * Settings.OctaveLength;
		const frequency = this.Frequency * Math.pow(2, transposeLength / 12);

		return new Note(key, octave, frequency);
	}

	private constructor(key: KeysScale, octave: number, frequency: number)
	{
		this._key = key;
		this._octave = octave;
		this._frequency = frequency;
	}
}

interface Curve
{
	get Duration(): number;
	GetValue(t: number): number;
}

class Point
{
	public x: number;
	public y: number;

	public constructor(x: number, y: number)
	{
		this.x = x;
		this.y = y;
	}
}

class LinearCurve implements Curve
{
	private _startValue: number;
	private _endValue: number;
	private _duration: number;

	private _slope: number;
	private _gain: number;

	private get _startX(): number
	{
		return 0;
	}
	private get _endX(): number
	{
		return 1;
	}

	public get Start(): number
	{
		return this._startValue;
	}
	public get End(): number
	{
		return this._endValue;
	}
	public get Duration(): number
	{
		return this._duration;
	}

	public set Start(value: number)
	{
		this._startValue = value;

		this.Evaluate();
	}
	public set End(value: number)
	{
		this._endValue = value;

		this.Evaluate();
	}
	public set Duration(value: number)
	{
		this._duration = value;
	}

	private Evaluate()
	{
		this._slope = (this._endValue - this._startValue) / (this._endX - this._startX);
		this._gain = this._startValue - this._slope * this._startX;
	}

	public GetValue(t: number)
	{
		const actualT = t / this.Duration;

		return actualT * this._slope + this._gain;
	}

	public constructor(startValue: number, endValue: number, duration: number)
	{
		this._startValue = startValue;
		this._endValue = endValue;
		this._duration = duration;

		this.Evaluate();
	}
}

class ExponentialCurve implements Curve
{
	private _startValue: number;
	private _endValue: number;
	private _duration: number;

	private _slope: number;

	private get _startX(): number
	{
		return 0;
	}
	private get _endX(): number
	{
		return 1;
	}

	public get Start(): number
	{
		return this._startValue;
	}
	public get End(): number
	{
		return this._endValue;
	}
	public get Duration(): number
	{
		return this._duration;
	}

	public set Start(value: number)
	{
		this._startValue = value;

		this.Evaluate();
	}
	public set End(value: number)
	{
		this._endValue = value;

		this.Evaluate();
	}
	public set Duration(value: number)
	{
		this._duration = value;
	}

	private Evaluate()
	{
		if (this._startValue < this._endValue)
		{
			this._slope = this._slope = Math.exp(Math.log(this._endValue - this._startValue + 1) / (this._endX - this._startX));
		}
		else
		{
			this._slope = Math.exp(Math.log(this._startValue - this._endValue + 1) / (this._startX - this._endX));
		}

	}

	public GetValue(t: number)
	{
		const actualT = t / this.Duration;

		if (this._startValue < this._endValue)
		{
			return Math.pow(this._slope, actualT - this._startX) - 1 + this._startValue;
		}
		else
		{
			return Math.pow(this._slope, actualT - this._endX) - 1 + this._endValue;
		}
	}

	public constructor(startValue: number, endValue: number, duration: number)
	{
		this._startValue = startValue;
		this._endValue = endValue;
		this._duration = duration;

		this.Evaluate();
	}
}

//class CurveComposition implements Curve
//{

//}

class Modulation
{
	private _curve: Curve;
	private _amount: number;
	private _parent: Knob;

	public get Amount(): number
	{
		return this._amount;
	}
	public set Amount(value: number)
	{
		this._amount = value;
	}

	public GetValue(t: number)
	{
		return this._curve.GetValue(t) * this._amount / 100 * this._parent.Scope;
	}

	public constructor(curve: Curve, amount: number, parent: Knob)
	{
		this._curve = curve;
		this._amount = amount;
		this._parent = parent;
	}
}

class Knob
{
	private _origin: number;
	private _min: number;
	private _max: number;
	private _modulations: Modulation[];

	public get Scope()
	{
		return this._max - this._min;
	}

	public Modulate(curve: Curve, amount: number): Modulation
	{
		const modulation = new Modulation(curve, amount, this);

		this._modulations.push(modulation);

		return modulation;
	}
}