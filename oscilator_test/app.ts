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

	var release = new ExponentialCurve(new DOMPoint(0, 1), new DOMPoint(duration, 0));

	for (let t = 0; t < duration; t += 1 / audioContext.sampleRate)
	{
		fm.push(fmWarp(t, fmDepth, fmNote.Frequency)); //donk
		//fm.push(fmDepth * (duration - t) / duration + baseNote.Frequency); //kick
	}

	oscilator.frequency.setValueCurveAtTime(fm, audioContext.currentTime, duration);

	const gain = [];

	for (let t = 0; release.IsInDomain(t); t += 1 / audioContext.sampleRate)
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
	IsInDomain(t: number): boolean;
	GetValue(t: number): number;
}

class LinearCurve implements Curve
{
	private _start: DOMPoint;
	private _end: DOMPoint;

	private _slope: number;
	private _gain: number;

	public get Start(): DOMPoint
	{
		return this._start;
	}
	public get End(): DOMPoint
	{
		return this._end;
	}

	public set Start(value: DOMPoint)
	{
		this._start = value;

		this.Evaluate();
	}
	public set End(value: DOMPoint)
	{
		this._end = value;

		this.Evaluate();
	}

	private Evaluate()
	{
		this._slope = (this._end.y - this._start.y) / (this._end.x - this._start.x);
		this._gain = this._start.y - this._slope * this._start.x;
	}

	public IsInDomain(t: number)
	{
		return t >= this._start.x && t < this._end.x;
	}
	public GetValue(t: number)
	{


		return t * this._slope + this._gain;
	}

	public constructor(start: DOMPoint, end: DOMPoint)
	{
		this._start = start;
		this._end = end;

		this.Evaluate();
	}
}

class ExponentialCurve implements Curve
{
	private _start: DOMPoint;
	private _end: DOMPoint;

	private _slope: number;

	public get Start(): DOMPoint
	{
		return this._start;
	}
	public get End(): DOMPoint
	{
		return this._end;
	}

	public set Start(value: DOMPoint)
	{
		this._start = value;

		this.Evaluate();
	}
	public set End(value: DOMPoint)
	{
		this._end = value;

		this.Evaluate();
	}

	private Evaluate()
	{
		if (this._start.y < this._end.y)
		{
			this._slope = this._slope = Math.exp(Math.log(this._end.y - this._start.y + 1) / (this._end.x - this._start.x));
		}
		else
		{
			this._slope = Math.exp(Math.log(this._start.y - this._end.y + 1) / (this._start.x - this._end.x));
		}

	}

	public IsInDomain(t: number)
	{
		return t >= this._start.x && t < this._end.x;
	}
	public GetValue(t: number)
	{
		if (this._start.y < this._end.y)
		{
			return Math.pow(this._slope, t - this._start.x) - 1 + this._start.y;
		}
		else
		{
			return Math.pow(this._slope, t - this._end.x) - 1 + this._end.y;
		}
	}

	public constructor(start: DOMPoint, end: DOMPoint)
	{
		this._start = start;
		this._end = end;

		this.Evaluate();
	}
}